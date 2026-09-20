const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { hasPermission, errorEmbed } = require('../utils');

// Convertit "10m", "1h", "1d" en millisecondes
function parseDuration(str) {
  const match = str?.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

module.exports = {
  name: 'gw',
  aliases: ['giveaway'],
  // Usage: &gw <duree ex: 10m> <nombre de gagnants> <lot>
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageGuild)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de lancer un giveaway.')] });
    }

    const duration = parseDuration(args[0]);
    const winnersCount = parseInt(args[1], 10);
    const prize = args.slice(2).join(' ');

    if (!duration || !winnersCount || !prize) {
      return message.reply({
        embeds: [errorEmbed('Usage : `&gw <duree ex: 10m/1h/1d> <nb de gagnants> <lot>`')],
      });
    }

    const endTimestamp = Math.floor((Date.now() + duration) / 1000);

    const embed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY 🎉')
      .setDescription(
        `Lot : **${prize}**\nReagis avec 🎉 pour participer !\nFin <t:${endTimestamp}:R>\nGagnant(s) : **${winnersCount}**\nOrganise par : ${message.author}`
      )
      .setColor(0xF1C40F)
      .setTimestamp(Date.now() + duration);

    await message.delete().catch(() => {});
    const gwMessage = await message.channel.send({ embeds: [embed] });
    await gwMessage.react('🎉');

    setTimeout(async () => {
      try {
        const fetched = await gwMessage.fetch();
        const reaction = fetched.reactions.cache.get('🎉');
        const users = reaction ? await reaction.users.fetch() : new Map();
        const participants = users.filter(u => !u.bot);

        if (participants.size === 0) {
          return gwMessage.reply('Giveaway termine ! Personne n\'a participe, aucun gagnant.');
        }

        const winners = participants.random(Math.min(winnersCount, participants.size));
        const winnersArray = Array.isArray(winners) ? winners : [winners];
        const winnersMentions = winnersArray.map(w => `<@${w.id}>`).join(', ');

        const endEmbed = EmbedBuilder.from(embed)
          .setDescription(`Lot : **${prize}**\nGiveaway termine !\nGagnant(s) : ${winnersMentions}`);
        await gwMessage.edit({ embeds: [endEmbed] });
        await gwMessage.reply(`🎉 Felicitations ${winnersMentions}, vous remportez **${prize}** !`);
      } catch (err) {
        console.error('Erreur a la fin du giveaway :', err);
      }
    }, duration);
  },
};
