// commands/acces.js : TOUT le système dans un seul fichier
// Commande &accès + boutons + modal + clés + rôle temporaire 1h + cooldown 3h
const fs = require('fs');
const crypto = require('crypto');
const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder,
  TextInputBuilder, TextInputStyle, PermissionFlagsBits, MessageFlags,
} = require('discord.js');

// ================= CONFIG =================
const ROLE_ID = process.env.ROLE_ID || 'ID_DU_ROLE_ACCES';
const ACCESS_DURATION = 2 * 60 * 1000;      // accès : 2 minutes
const KEY_VALIDITY = 15 * 60 * 1000;         // clé valable 2 min
const GEN_COOLDOWN = 3 * 60 * 60 * 1000;     // 3h entre deux générations
const DB_FILE = './keys-data.json';
// ==========================================

// ---------- Stockage ----------
let db = { keys: {}, access: {}, cooldowns: {} };
if (fs.existsSync(DB_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch {}
}
db.keys = db.keys || {};
db.access = db.access || {};
db.cooldowns = db.cooldowns || {};
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// ---------- Clés ----------
function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () =>
    Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join('');
  return `${part()}-${part()}-${part()}-${part()}`;
}

function createKey(userId) {
  const readyAt = (db.cooldowns[userId] || 0) + GEN_COOLDOWN;
  if (Date.now() < readyAt) return { ok: false, readyAt };
  const key = generateKey();
  db.keys[key] = { userId, createdAt: Date.now() };
  db.cooldowns[userId] = Date.now();
  save();
  return { ok: true, key };
}

// Génère plusieurs clés d'un coup (pas de cooldown, sans expiration)
function createManyKeys(userId, count) {
  const keys = [];
  for (let i = 0; i < count; i++) {
    const key = generateKey();
    db.keys[key] = { userId, createdAt: Date.now(), permanent: true };
    keys.push(key);
  }
  save();
  return keys;
}

function useKey(userId, rawKey) {
  const key = rawKey.trim().toUpperCase();
  const entry = db.keys[key];
  if (!entry || entry.userId !== userId) return { ok: false, error: '❌ Clé invalide.' };
  if (!entry.permanent && Date.now() - entry.createdAt > KEY_VALIDITY) {
    delete db.keys[key];
    save();
    return { ok: false, error: '⌛ Cette clé a expiré. Génères-en une nouvelle.' };
  }
  delete db.keys[key];
  save();
  return { ok: true };
}

// ---------- Rôle temporaire ----------
// Vérification toutes les 30 secondes : si le temps est écoulé, on retire le rôle.
// Si le retrait échoue, on réessaie au tour suivant (rien n'est oublié).
let checking = false;
async function checkExpirations(client) {
  if (checking) return;
  checking = true;
  try {
    let changed = false;
    for (const [userId, info] of Object.entries(db.access)) {
      if (Date.now() < info.expiresAt) continue;
      try {
        const guild = await client.guilds.fetch(info.guildId);
        const member = await guild.members.fetch(userId);
        await member.roles.remove(ROLE_ID, 'Fin des 1h (clé)');
        delete db.access[userId];
        changed = true;
      } catch (e) {
        // Membre parti / serveur introuvable : on nettoie. Sinon on réessaiera.
        if (e.code === 10007 || e.code === 10013 || e.code === 10004) {
          delete db.access[userId];
          changed = true;
        } else {
          console.error(`Retrait du rôle impossible pour ${userId} (nouvel essai dans 30s) :`, e.message);
        }
      }
    }
    if (changed) save();
  } finally {
    checking = false;
  }
}

async function grantAccess(client, member) {
  await member.roles.add(ROLE_ID);
  const expiresAt = Date.now() + ACCESS_DURATION;
  db.access[member.id] = { guildId: member.guild.id, expiresAt };
  save();
  return expiresAt;
}

// ---------- Boutons + modal ----------
async function handleInteraction(client, interaction) {
  if (interaction.isButton() && interaction.customId === 'gen_key') {
    const res = createKey(interaction.user.id);
    if (!res.ok) {
      return interaction.reply({
        content: `⏳ Tu as déjà généré une clé. Tu pourras en générer une nouvelle <t:${Math.floor(res.readyAt / 1000)}:R>.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    return interaction.reply({
      content:
        `🔑 Ta clé : \`${res.key}\`\n` +
        `Valable 15 minutes, utilisable une seule fois. Clique sur **Entrer ma clé** pour l'utiliser.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (interaction.isButton() && interaction.customId === 'use_key') {
    const modal = new ModalBuilder().setCustomId('key_modal').setTitle('Entrer ta clé');
    const input = new TextInputBuilder()
      .setCustomId('key_input')
      .setLabel('Ta clé')
      .setPlaceholder('XXXX-XXXX-XXXX-XXXX')
      .setStyle(TextInputStyle.Short)
      .setMinLength(19)
      .setMaxLength(19)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'key_modal') {
    const result = useKey(interaction.user.id, interaction.fields.getTextInputValue('key_input'));
    if (!result.ok) {
      return interaction.reply({ content: result.error, flags: MessageFlags.Ephemeral });
    }
    try {
      const expiresAt = await grantAccess(client, interaction.member);
      return interaction.reply({
        content: `✅ Accès accordé jusqu'à <t:${Math.floor(expiresAt / 1000)}:t> (1 heure).`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (e) {
      console.error(e);
      return interaction.reply({
        content: '❌ Impossible de donner le rôle (le rôle du bot doit être au-dessus).',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

// ---------- Initialisation (une seule fois) ----------
let initialized = false;
function init(client) {
  if (initialized) return;
  initialized = true;
  client.on('interactionCreate', (i) => handleInteraction(client, i).catch(console.error));
  checkExpirations(client).catch(console.error);
  setInterval(() => checkExpirations(client).catch(console.error), 30 * 1000);
}

// ---------- Commande &accès ----------
module.exports = {
  name: 'accès',
  aliases: ['acces'],
  init,
  createManyKeys,

  async execute(message) {
    init(message.client); // s'enregistre tout seul au 1er appel

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Tu dois être administrateur pour utiliser cette commande.');
    }

    const embedGen = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🔑 Génération de clé')
      .setDescription('Clique sur le bouton ci-dessous pour générer ta clé.');

    const embedUse = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('🗝️ Utiliser une clé')
      .setDescription(
        "Clique sur le bouton ci-dessous et entre ta clé pour obtenir l'accès à la catégorie pendant 1 heure."
      );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('gen_key').setLabel('Générer une clé').setStyle(ButtonStyle.Primary)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('use_key').setLabel('Entrer ma clé').setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({ embeds: [embedGen, embedUse], components: [row1, row2] });
    await message.delete().catch(() => {});
  },
};
