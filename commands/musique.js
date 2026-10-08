// commands/musique.js : musique dans un salon vocal (YouTube + Spotify)
//
//   &musique <lien YouTube / lien Spotify / nom>  -> le bot rejoint ton vocal et lance la musique.
//                                                    Refais la commande pour changer de musique.
//   &playlists <lien de playlist>                 -> met toute la playlist, un titre après l'autre.
//                                                    (playlist YouTube, playlist ou album Spotify)
//   &skip                                         -> passe au titre suivant
//   &stop                                         -> arrête et déconnecte le bot
//
// Le bot reste dans le vocal tant que personne ne le déconnecte.
// Spotify ne donne pas le son : le bot retrouve chaque titre sur YouTube et le joue.
//
// Dépendances à ajouter dans package.json :
//   @discordjs/voice, @snazzah/davey, @iamtraction/play-dl, play-dl, ffmpeg-static, opusscript,
//   libsodium-wrappers, spotify-url-info
const { PermissionFlagsBits } = require('discord.js');

// Si les dépendances ne sont pas installées, le bot démarre quand même
let voice = null;
let play = null;
let depsError = null;
try {
  voice = require('@discordjs/voice');
  try {
    play = require('@iamtraction/play-dl'); // version maintenue de play-dl
  } catch {
    play = require('play-dl'); // ancienne version (repli)
  }
} catch (e) {
  depsError = e;
}
const {
  joinVoiceChannel, createAudioPlayer, createAudioResource,
  AudioPlayerStatus, VoiceConnectionStatus, NoSubscriberBehavior, entersState,
  generateDependencyReport,
} = voice || {};

const MAX_PLAYLIST = 300; // titres maximum pris dans une playlist
const SPOTIFY_RE = /open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist)\//i;
const states = new Map(); // un état par serveur

let tokenSet = false;
async function setupPlayDl() {
  if (tokenSet) return;
  tokenSet = true;
  // Optionnel : cookie YouTube (variable YT_COOKIE) si YouTube bloque le serveur
  if (process.env.YT_COOKIE) {
    await play.setToken({ youtube: { cookie: process.env.YT_COOKIE } }).catch(() => {});
  }
}

let spotifyLib = null;
function getSpotify() {
  if (!spotifyLib) {
    try {
      spotifyLib = require('spotify-url-info')(fetch);
    } catch {
      throw new Error("le module spotify-url-info n'est pas installé (ajoute-le dans package.json)");
    }
  }
  return spotifyLib;
}

// ---------- Utilitaires ----------
const isUrl = (s) => /^https?:\/\//i.test(s);

// Garde seulement la vidéo d'un lien (enlève &list=...)
function cleanVideoUrl(input) {
  try {
    const u = new URL(input);
    u.searchParams.delete('list');
    u.searchParams.delete('index');
    u.searchParams.delete('start_radio');
    return u.toString();
  } catch {
    return input;
  }
}

async function resolveSingle(input) {
  if (isUrl(input)) {
    const url = cleanVideoUrl(input);
    if (play.yt_validate(url) !== 'video') return null;
    const info = await play.video_basic_info(url);
    return { title: info.video_details.title || 'Sans titre', url: info.video_details.url || url };
  }
  const results = await play.search(input, { limit: 1, source: { youtube: 'video' } });
  if (!results.length) return null;
  return { title: results[0].title || 'Sans titre', url: results[0].url };
}

async function resolveYoutubePlaylist(input) {
  const pl = await play.playlist_info(input, { incomplete: true });
  const videos = await pl.all_videos();
  const tracks = videos
    .filter((v) => v.url)
    .slice(0, MAX_PLAYLIST)
    .map((v) => ({ title: v.title || 'Sans titre', url: v.url }));
  return { title: pl.title || 'Playlist', tracks };
}

// Spotify : on récupère seulement les titres, la vidéo YouTube est cherchée au moment de lire
function spotifyTrack(t) {
  const name = t.name || t.title || '';
  const artist =
    t.artist || t.subtitle || (Array.isArray(t.artists) ? t.artists.map((a) => a.name).join(', ') : '');
  if (!name) return null;
  return {
    title: artist ? `${artist} - ${name}` : name,
    query: `${artist} ${name}`.trim(),
  };
}

async function resolveSpotify(input, type) {
  const sp = getSpotify();

  if (type === 'track') {
    const p = await sp.getPreview(input);
    const track = spotifyTrack({ name: p.title, artist: p.artist });
    return { title: p.title, tracks: track ? [track] : [] };
  }

  const preview = await sp.getPreview(input).catch(() => ({}));
  const list = await sp.getTracks(input);
  const tracks = (list || []).map(spotifyTrack).filter(Boolean).slice(0, MAX_PLAYLIST);
  return { title: preview.title || 'Spotify', tracks };
}

// ---------- Lecture ----------
function cleanup(guildId) {
  const state = states.get(guildId);
  if (!state) return;
  states.delete(guildId);
  state.queue = [];
  try { state.player.stop(true); } catch {}
  try {
    if (state.connection.state.status !== VoiceConnectionStatus.Destroyed) state.connection.destroy();
  } catch {}
}

async function startTrack(state, track) {
  let step = 'recherche YouTube';
  try {
    // Titre Spotify : on cherche d'abord la vidéo YouTube correspondante
    if (!track.url) {
      const found = await play.search(track.query, { limit: 1, source: { youtube: 'video' } });
      if (!found.length) throw new Error('introuvable sur YouTube');
      track.url = found[0].url;
    }
    step = 'lecture du flux';
    const stream = await play.stream(track.url, { quality: 2 });
    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    state.current = track;
    state.player.play(resource);
    state.textChannel?.send(`🎵 En lecture : **${track.title}**`).catch(() => {});
    return true;
  } catch (e) {
    console.error(`[MUSIQUE] échec (${step}) pour "${track.title}" :`, e.stack || e.message);
    state.textChannel
      ?.send(`❌ Impossible de lire **${track.title}** (${step} : ${e.message})`)
      .catch(() => {});
    return false;
  }
}

async function playNext(state) {
  while (state.queue.length) {
    const track = state.queue.shift();
    if (await startTrack(state, track)) return;
  }
  state.current = null; // plus rien à lire : le bot reste dans le vocal
}

async function ensureState(message, voiceChannel) {
  const guild = message.guild;
  let state = states.get(guild.id);

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  if (!state || state.connection !== connection) {
    if (state) cleanup(guild.id);

    connection.on('stateChange', (oldS, newS) => {
      const extra = [newS.reason !== undefined ? `raison ${newS.reason}` : '', newS.closeCode ? `code ${newS.closeCode}` : '']
        .filter(Boolean).join(', ');
      console.log(`[MUSIQUE] connexion vocale : ${oldS.status} -> ${newS.status}${extra ? ` (${extra})` : ''}`);
    });

    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
    state = { connection, player, queue: [], current: null, textChannel: message.channel };
    states.set(guild.id, state);

    player.on(AudioPlayerStatus.Idle, () => {
      state.current = null;
      playNext(state).catch(console.error);
    });
    player.on('error', (e) => console.error('Erreur du lecteur audio :', e.message));

    // Déconnecté du vocal (par quelqu'un) : on nettoie, sauf s'il s'agit d'un simple déplacement
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch {
        cleanup(guild.id);
      }
    });
    connection.on(VoiceConnectionStatus.Destroyed, () => cleanup(guild.id));

    connection.subscribe(player);
  }

  state.textChannel = message.channel;

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  } catch {
    const st = connection.state;
    const code = st.closeCode ? `, code ${st.closeCode}` : '';
    const status = st.status;
    cleanup(guild.id);
    throw new Error(`Impossible de rejoindre le salon vocal (état : ${status}${code}).`);
  }
  return state;
}

// ---------- Commande ----------
module.exports = {
  name: 'musique',
  aliases: ['playlists', 'playlist', 'skip', 'stop', 'mdebug'],

  async execute(message, args) {
    const invokedFirst = message.content.trim().split(/\s+/)[0].toLowerCase();

    // &mdebug : affiche ce qui est installé pour la musique
    if (invokedFirst.endsWith('mdebug')) {
      if (depsError) return message.reply(`❌ Dépendance manquante : \`${String(depsError.message).split('\n')[0]}\``);
      let davey = 'non installé';
      try { require.resolve('@snazzah/davey'); davey = 'installé'; } catch {}
      const report = [
        `Node : ${process.version}`,
        `@snazzah/davey (DAVE) : ${davey}`,
        `Cookie YouTube (YT_COOKIE) : ${process.env.YT_COOKIE ? 'oui' : 'non'}`,
        '',
        generateDependencyReport(),
      ].join('\n');
      return message.reply('```\n' + report.slice(0, 1800) + '\n```');
    }

    if (depsError) {
      console.error('Dépendances musique manquantes :', depsError.message);
      const detail = String(depsError.message || depsError).split('\n')[0];
      return message.reply(
        "❌ Le système de musique n'est pas installé : ajoute les dépendances dans `package.json` (voir le début de `commands/musique.js`).\n" +
        `Détail : \`${detail}\``
      );
    }

    const invoked = message.content.trim().split(/\s+/)[0].toLowerCase();
    const is = (w) => invoked.endsWith(w);
    const guild = message.guild;

    try {
      // ----- &skip -----
      if (is('skip')) {
        const state = states.get(guild.id);
        if (!state || !state.current) return message.reply('Aucune musique en cours.');
        state.player.stop(); // déclenche le titre suivant
        return message.reply('⏭️ Titre suivant.');
      }

      // ----- &stop -----
      if (is('stop')) {
        if (!states.has(guild.id)) return message.reply('Je ne suis pas dans un salon vocal.');
        cleanup(guild.id);
        return message.reply('⏹️ Musique arrêtée, je quitte le vocal.');
      }

      // ----- &musique / &playlists -----
      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel) return message.reply("❌ Rejoins d'abord un salon vocal.");

      const perms = voiceChannel.permissionsFor(guild.members.me);
      if (!perms?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
        return message.reply("❌ Je n'ai pas la permission de me connecter / parler dans ce salon vocal.");
      }

      const input = args.join(' ').trim();
      const isPlaylistCmd = is('playlists') || is('playlist');

      if (!input) {
        return message.reply(
          isPlaylistCmd
            ? 'Utilisation : `playlists <lien de la playlist YouTube ou Spotify>`'
            : 'Utilisation : `musique <lien YouTube, lien Spotify ou nom de la musique>`'
        );
      }

      const spotify = isUrl(input) ? input.match(SPOTIFY_RE) : null;
      const spotifyType = spotify ? spotify[1].toLowerCase() : null;

      if (isUrl(input) && !spotify && play.yt_validate(input) === false) {
        return message.reply('❌ Liens pris en charge : YouTube et Spotify (ou tape le nom de la musique).');
      }

      await setupPlayDl();
      const wait = await message.reply('🔎 Recherche...');

      // ===== &playlists =====
      if (isPlaylistCmd) {
        let title;
        let tracks;

        if (spotify) {
          if (spotifyType === 'track') {
            return wait.edit('❌ Ce lien est une seule musique. Utilise `musique <lien>`.');
          }
          ({ title, tracks } = await resolveSpotify(input, spotifyType));
        } else {
          if (!isUrl(input) || play.yt_validate(input) !== 'playlist') {
            return wait.edit("❌ Ce lien n'est pas une playlist. Pour une seule musique, utilise `musique`.");
          }
          ({ title, tracks } = await resolveYoutubePlaylist(input));
        }
        if (!tracks.length) return wait.edit('❌ Playlist vide ou introuvable (est-elle publique ?).');

        const state = await ensureState(message, voiceChannel);
        state.queue = tracks.slice(1);
        await wait.edit(`📃 **${title}** : **${tracks.length}** titre(s) ajouté(s).`);

        if (!(await startTrack(state, tracks[0]))) await playNext(state);
        return;
      }

      // ===== &musique : remplace la musique en cours (et la file d'attente) =====
      let track;

      if (spotify) {
        if (spotifyType !== 'track') {
          return wait.edit("📃 C'est une playlist / un album : utilise `playlists <lien>`.");
        }
        const res = await resolveSpotify(input, 'track');
        track = res.tracks[0];
      } else {
        if (isUrl(input) && play.yt_validate(input) === 'playlist' && !input.includes('v=')) {
          return wait.edit("📃 C'est une playlist : utilise `playlists <lien>` pour la mettre en entier.");
        }
        track = await resolveSingle(input);
      }
      if (!track) return wait.edit('❌ Aucune musique trouvée.');

      const state = await ensureState(message, voiceChannel);
      state.queue = [];
      if (await startTrack(state, track)) {
        await wait.delete().catch(() => {});
      } else {
        await wait.edit('❌ Impossible de lire cette musique.');
      }
    } catch (err) {
      console.error('Erreur musique :', err);
      await message.reply(`❌ Erreur : \`${err.message}\``).catch(() => {});
    }
  },
};
