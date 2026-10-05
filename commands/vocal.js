// commands/vocal.js : -vocal [nombre]
// Crée des salons vocaux "🚌 ・ Vocal 1", "🎒 ・ Vocal 2"... dans une catégorie "Vocaux".
// Par défaut 500 salons (maximum 500 par catégorie sur Discord).
const { ChannelType, PermissionFlagsBits } = require('discord.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const running = new Set();
const CATEGORY_NAME = 'Vocaux';
const MAX_PER_CATEGORY = 500;
const DELAY = 1000; // 1 s entre chaque création (évite les limites de Discord)

// Un emoji différent pour chaque vocal
const EMOJIS = [
  '🚌', '🎒', '🧠', '👨‍🏫', '👩‍🏫', '📌', '☕', '🍬', '🍵', '🥼',
  '🏫', '👕', '👚', '📆', '🧮', '📚', '✏️', '📝', '🖍️', '📐',
  '📏', '🔬', '🧪', '🎓', '🏆', '📖', '🔔', '🧃', '🍎', '🥪',
  '🧑‍🎓', '🪑', '📓', '📒', '🗂️', '🖊️', '🧴', '🎨', '🎭', '⚽',
  '🏀', '🎵', '🎤', '🔭', '🌍', '🧭', '🕒', '🍙', '🍪', '🥐',
];

module.exports = {
  name: 'vocal',
  aliases: ['vocaux'],

  async execute(message, args) {
    const guild = message.guild;

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Tu dois être administrateur pour utiliser cette commande.');
    }
    if (running.has(guild.id)) {
      return message.reply('⏳ Une création de vocaux est déjà en cours.');
    }

    let count = parseInt(args?.[0], 10) || MAX_PER_CATEGORY;
    count = Math.min(Math.max(count, 1), MAX_PER_CATEGORY);

    // Limite de Discord : 500 salons par serveur
    if (guild.channels.cache.size + count + 1 > 500) {
      return message.reply('❌ Le serveur approche la limite de 500 salons : impossible de créer autant de vocaux.');
    }

    running.add(guild.id);
    const status = await message.reply(`🔊 Création de **${count}** salons vocaux... (environ ${Math.ceil(count * DELAY / 1000 / 60) || 1} min)`);

    let created = 0;
    try {
      // Réutilise la catégorie "Vocaux" si elle a assez de place, sinon en crée une
      let category = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildCategory &&
          c.name === CATEGORY_NAME &&
          c.children.cache.size + count <= MAX_PER_CATEGORY
      );
      if (!category) {
        category = await guild.channels.create({
          name: CATEGORY_NAME,
          type: ChannelType.GuildCategory,
        });
      }

      const start = category.children.cache.size;
      for (let i = 1; i <= count; i++) {
        const n = start + i;
        const emoji = EMOJIS[(n - 1) % EMOJIS.length];
        await guild.channels.create({
          name: `${emoji} ・ Vocal ${n}`,
          type: ChannelType.GuildVoice,
          parent: category.id,
        });
        created++;
        await sleep(DELAY);
      }

      await status.edit(`✅ **${created}** salons vocaux créés dans la catégorie **${CATEGORY_NAME}**.`).catch(() => {});
    } catch (err) {
      console.error('Erreur -vocal :', err);
      await status
        .edit(`❌ Arrêté après **${created}** salon(s) : \`${err.message}\``)
        .catch(() => {});
    } finally {
      running.delete(guild.id);
    }
  },
};
