// commands/genkeys.js : &genkeys <nombre>  (admin uniquement)
const { PermissionFlagsBits } = require('discord.js');
const { createManyKeys } = require('./acces');

const MAX_KEYS = 200;

module.exports = {
  name: 'genkeys',
  aliases: [],

  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Tu dois être administrateur pour utiliser cette commande.');
    }

    const raw = args?.[0] ?? message.content.trim().split(/\s+/)[1];
    const count = parseInt(raw, 10);
    if (!count || count < 1) {
      return message.reply('Utilisation : `&genkeys <nombre>` (ex : `&genkeys 10`)');
    }
    if (count > MAX_KEYS) {
      return message.reply(`Maximum ${MAX_KEYS} clés à la fois.`);
    }

    const keys = createManyKeys(message.author.id, count);

    // Envoi en message privé (par paquets de 50) pour ne pas afficher les clés dans le salon
    try {
      for (let i = 0; i < keys.length; i += 50) {
        const chunk = keys.slice(i, i + 50).map((k) => `\`${k}\``).join('\n');
        await message.author.send(chunk);
      }
      await message.reply(`✅ ${count} clé(s) envoyée(s) en message privé.`);
    } catch {
      await message.reply('❌ Je n\'arrive pas à t\'envoyer un MP. Active tes messages privés pour ce serveur.');
    }
    await message.delete().catch(() => {});
  },
