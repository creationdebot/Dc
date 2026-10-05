// commands/support.js : -support [#salon-partenariat] [#salon-vocal]
// Poste le message d'info du support (embed).
// Exemple : -support #regles-partenariat #support-vocal
//   1er salon mentionné -> remplace "#inconnu" (règles de partenariat)
//   2e salon mentionné  -> remplace "#Aucun accès" (salon vocal de support)
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const NOM = 'Tomioka'; // change le nom ici si tu veux

module.exports = {
  name: 'support',
  aliases: [],

  async execute(message) {
    try {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('Tu dois être administrateur pour utiliser cette commande.');
      }

      const [salonPartenariat, salonVocal] = [...message.mentions.channels.values()];
      const partenariatText = salonPartenariat ? `${salonPartenariat}` : '#partenariat';
      const vocalText = salonVocal ? `${salonVocal}` : '#support-vocal';

      const texte =
`• Contacter le Support de ${NOM}

Le support du serveur est disponible 24h/24 et 7j/7 afin de répondre à vos questions et de vous accompagner tout au long de votre expérience sur ${NOM}.

-# ❗ Attention : Les demandes concernant les giveaways ne seront pas prises en charge.

# 🎟️ Tickets

__**Owner**__ : Pour toute demande concernant les Owners du serveur, les décales, ou si vous rencontrez un problème important nécessitant une intervention.

__**Partenariat**__ : Pour toute demande concernant un partenariat avec ${NOM}. Prendre connaissance de ${partenariatText} avant.

__**Gestion Abus**__ : Vous rencontrez un conflit avec un membre ou un membre du staff ? Signalez un comportement problématique, un abus, ou contestez une sanction que vous estimez injustifiée.

__**Demande de Staff**__ : Vous souhaitez rejoindre le staff, demander un rank-up, récupérer un rôle ou effectuer toute autre demande concernant les permissions et responsabilités ?

__**ADS/Gr@b**__ : Pour toute demande concernant les Gr@bs, les quotas, ou pour toute personne souhaitant devenir Gr@beur.

__**Jeux**__ : Pour toute question, demande d'aide ou problème concernant les jeux proposés sur le serveur.

__**Animation**__ : Pour rejoindre l'équipe d'animation ou demander à participer aux différentes activités telles que Votes2Profil, ${NOM}2Fame, etc.

# 🎙️ Support Vocal

Si tu souhaites effectuer ta demande ou ton report directement en vocal, plusieurs salons sont mis à ta disposition : ${vocalText}.

Il te suffit de rester dans le salon vocal et d'attendre qu'un membre du staff vienne te prendre en charge.

Merci de patienter et de rester disponible afin que nous puissions traiter ta demande dans les meilleures conditions.`;

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(texte);

      await message.channel.send({ embeds: [embed] });
      await message.delete().catch(() => {});
    } catch (err) {
      console.error('Erreur -support :', err);
      let hint = '';
      if (err.code === 50013 || err.code === 50001) {
        hint = "\n➡️ Le bot n'a pas la permission d'écrire / d'envoyer des embeds dans ce salon.";
      }
      await message.reply(`❌ Erreur : \`${err.message}\`${hint}`).catch(() => {});
    }
  },
};
