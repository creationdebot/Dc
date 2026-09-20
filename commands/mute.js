const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed, getTargetMember, getLogChannel } = require('../utils');

function parseDuration(str) {
  if (!str) return 10 * 60 * 1000;
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 10 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Math.min(value * multipliers[unit], 28 * 86400000);
}

module.exports = {
  name: 'mute',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de mute.')] });
    }

    const target = getTargetMember(message, args);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID d\'un membre a mute.')] });
    }

    if (!target.moderatable) {
      return message.reply({ embeds: [errorEmbed('Je ne peux pas mute ce membre (role trop haut ?).')] });
    }

    const durationArg = args[1];
    const duration = parseDuration(durationArg);
    const reason = args.slice(durationArg && /^\d+(s|m|h|d)$/.test(durationArg) ? 2 : 1).join(' ') || 'Aucune raison fournie';

    await target.timeout(duration, reason);
    message.reply({
      embeds: [successEmbed(`**${target.user.tag}** a ete mute pendant ${duration / 60000} minute(s). Raison : ${reason}`)],
    });

    const logChannel = getLogChannel(message.guild, 'moderation-logs');
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🔇 Membre mute')
        .setColor(0xF1C40F)
        .addFields(
          { name: 'Membre', value: `${target.user.tag} (${target.id})` },
          { name: 'Moderateur', value: `${message.author.tag}` },
          { name: 'Duree', value: `${duration / 60000} minute(s)` },
          { name: 'Raison', value: reason },
        )
        .setTimestamp();
      logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
  },
};
