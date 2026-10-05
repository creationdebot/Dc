// commands/soutien.js : -soutien [@role]
// Poste le message de soutien du serveur (embed).
// Si tu mentionnes un rôle (ex : -soutien @Booster), il est affiché comme dans l'image à la place de "@Yuuurei".
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const NOM = 'TOMIOKA'; // change le nom ici si tu veux (ex : 'Tomioka')

module.exports = {
  name: 'soutien',
  aliases: [],

  async execute(message) {
    try {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('Tu dois être administrateur pour utiliser cette commande.');
      }

      const role = message.mentions.roles.first();
      const roleText = role ? `${role}` : `@${NOM}`;

      const texte =
`Afin de soutenir ${NOM} et de l’aider à grandir, tu peux __contribuer__ de 2 façons ! 🤭

・**Mettre /${NOM} dans ton statut**
Cela permet de donner davantage de visibilité au serveur.

・**Booster le serveur**
Si tu souhaites aller encore plus loin et soutenir le serveur, tu peux également le booster ! 💎

En échange, tu obtiendras la __perm image__ ainsi que le rôle ${roleText} automatiquement !

-# Un grand merci à toutes les personnes qui soutiennent ${NOM} et participent au projet ! 🥹`;

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(texte);

      await message.channel.send({ embeds: [embed] });
      await message.delete().catch(() => {});
    } catch (err) {
      console.error('Erreur -soutien :', err);
      let hint = '';
      if (err.code === 50013 || err.code === 50001) {
        hint = "\n➡️ Le bot n'a pas la permission d'écrire / d'envoyer des embeds dans ce salon.";
      }
      await message.reply(`❌ Erreur : \`${err.message}\`${hint}`).catch(() => {});
    }
  },
};
