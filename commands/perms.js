// commands/perms.js : donne un rôle à quelqu'un pour une durée limitée
// &perms @membre @role 5j      -> donne le rôle pendant 5 jours (max 4 mois)
// &perms retirer @membre @role -> retire le rôle avant la fin
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const DB_PATH = path.join(__dirname, '..', 'perms.json');
const DAY = 24 * 60 * 60 * 1000;
const MAX_DURATION = 120 * DAY; // 4 mois

const UNITS = {
  min: 60 * 1000,
  h: 60 * 60 * 1000,
  j: DAY, jour: DAY, jours: DAY, d: DAY,
  sem: 7 * DAY, semaine: 7 * DAY, semaines: 7 * DAY, w: 7 * DAY,
  mois: 30 * DAY,
};

function parseDuration(str) {
  const m = /^(\d+)\s*([a-zA-Zéû]+)$/.exec(str || '');
  if (!m) return null;
  const unit = UNITS[m[2].toLowerCase()];
  const amount = parseInt(m[1], 10);
  if (!unit || !amount) return null;
  return amount * unit;
}

// ---------- Stockage ----------
function load() {
  if (!fs.existsSync(DB_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
}
const save = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
const keyOf = (guildId, userId, roleId) => `${guildId}:${userId}:${roleId}`;

// ---------- Vérification des expirations (toutes les minutes) ----------
async function checkExpirations(client) {
  const data = load();
  let changed = false;

  for (const [key, entry] of Object.entries(data)) {
    if (Date.now() < entry.expiresAt) continue;

    try {
      const guild = await client.guilds.fetch(entry.guildId);
      const member = await guild.members.fetch(entry.userId);
      await member.roles.remove(entry.roleId, 'Fin du temps (&perms)');
      delete data[key];
      changed = true;
    } catch (e) {
      // Membre parti ou serveur introuvable : on nettoie. Sinon on réessaiera.
      if (e.code === 10007 || e.code === 10013 || e.code === 10004) {
        delete data[key];
        changed = true;
      } else {
        console.error('&perms : retrait impossible, nouvel essai plus tard :', e.message);
      }
    }
  }
  if (changed) save(data);
}

let initialized = false;
function init(client) {
  if (initialized) return;
  initialized = true;
  checkExpirations(client).catch(console.error);
  setInterval(() => checkExpirations(client).catch(console.error), 60 * 1000);
}

// ---------- Utilitaires ----------
async function resolveTargets(message, args) {
  const member =
    message.mentions.members.first() ||
    (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
  const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
  return { member, role };
}

module.exports = {
  name: 'perms',
  aliases: [],
  init,

  async execute(message, args, client) {
    init(client || message.client);

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Tu dois être administrateur pour utiliser cette commande.');
    }

    const usage =
      'Utilisation :\n' +
      '`&perms @membre @role 5j` (durée max : 4 mois)\n' +
      '`&perms retirer @membre @role`\n' +
      'Durées : `30min`, `12h`, `5j`, `2sem`, `3mois`';

    // ----- Retirer avant la fin -----
    const sub = args[0]?.toLowerCase();
    if (sub === 'retirer' || sub === 'remove') {
      const { member, role } = await resolveTargets(message, args.slice(1));
      if (!member || !role) return message.reply(usage);

      const data = load();
      const key = keyOf(message.guild.id, member.id, role.id);
      if (!data[key]) return message.reply("Ce rôle temporaire n'est pas actif pour ce membre.");

      try {
        await member.roles.remove(role, `Retiré par ${message.author.tag} (&perms)`);
      } catch {
        return message.reply('❌ Impossible de retirer le rôle (vérifie la position du rôle du bot).');
      }
      delete data[key];
      save(data);
      return message.reply(`✅ Rôle **${role.name}** retiré à ${member}.`);
    }

    // ----- Donner un rôle temporaire -----
    const { member, role } = await resolveTargets(message, args);
    const duration = parseDuration(args[args.length - 1]);

    if (!member || !role || !duration) return message.reply(usage);

    if (duration > MAX_DURATION) {
      return message.reply('❌ La durée maximum est de **4 mois**.');
    }
    if (role.id === message.guild.id || role.managed) {
      return message.reply('❌ Ce rôle ne peut pas être donné.');
    }

    const botMember = message.guild.members.me;
    if (role.position >= botMember.roles.highest.position) {
      return message.reply('⚠️ Le rôle du bot doit être **au-dessus** de ce rôle dans la liste des rôles.');
    }
    if (
      message.author.id !== message.guild.ownerId &&
      role.position >= message.member.roles.highest.position
    ) {
      return message.reply('❌ Tu ne peux pas donner un rôle égal ou supérieur au tien.');
    }

    const data = load();
    const key = keyOf(message.guild.id, member.id, role.id);

    // Déjà le rôle sans passer par &perms : on évite de le retirer plus tard par erreur
    if (member.roles.cache.has(role.id) && !data[key]) {
      return message.reply(`❌ ${member} a déjà le rôle **${role.name}**.`);
    }

    try {
      await member.roles.add(role, `&perms par ${message.author.tag}`);
    } catch (e) {
      console.error(e);
      return message.reply('❌ Impossible de donner le rôle (permission **Gérer les rôles** ?).');
    }

    const expiresAt = Date.now() + duration;
    data[key] = { guildId: message.guild.id, userId: member.id, roleId: role.id, expiresAt };
    save(data);

    const ts = Math.floor(expiresAt / 1000);
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('✅ Rôle temporaire donné')
      .addFields(
        { name: 'Membre', value: `${member}`, inline: true },
        { name: 'Rôle', value: `${role}`, inline: true },
        { name: 'Fin', value: `<t:${ts}:F> (<t:${ts}:R>)` },
      );
    return message.reply({ embeds: [embed] });
  },
};
