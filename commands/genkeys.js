// commands/genkeys.js : &genkeys <nombre>  (admin uniquement)
const { PermissionFlagsBits } = require('discord.js');
const acces = require('./acces');

const MAX_KEYS = 200;

module.exports = {
  name: 'genkeys',
  aliases: [],

  async execute(message, args) {
    try {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('Tu dois être administrateur pour utiliser cette commande.');
      }

      // Diagnostic : acces.js pas à jour ?
      if (typeof acces.createManyKeys !== 'function') {
        return message.reply(
          "⚠️ Ton fichier `commands/acces.js` n'est pas à jour (il manque `createManyKeys`). " +
          "Remplace-le par la dernière version, puis relance le bot."
        );
      }

      const raw = args?.[0] ?? message.content.trim().split(/\s+/)[1];
      const count = parseInt(raw, 10);
      if (!count || count < 1) {
        return message.reply('Utilisation : `&genkeys <nombre>` (ex : `&genkeys 10`)');
      }
      if (count > MAX_KEYS) {
        return message.reply(`Maximum ${MAX_KEYS} clés à la fois.`);
      }

      const keys = acces.createManyKeys(message.author.id, count);

      // Envoi en MP (par paquets de 50)
      try {
        for (let i = 0; i < keys.length; i += 50) {
          const chunk = keys.slice(i, i + 50).map((k) => `\`${k}\``).join('\n');
          await message.author.send(chunk);
        }
        await message.reply(`✅ ${count} clé(s) envoyée(s) en message privé.`);
      } catch (dmError) {
        console.error('Erreur MP genkeys :', dmError);
        await message.reply("❌ Je n'arrive pas à t'envoyer un MP. Ouvre tes messages privés pour ce serveur (Paramètres du serveur, Confidentialité).");
      }
      await message.delete().catch(() => {});
    } catch (err) {
      console.error('Erreur genkeys :', err);
      await message.reply(`❌ Erreur : \`${err.message}\``).catch(() => {});
    }
  },
};
