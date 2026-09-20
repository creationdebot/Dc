const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed, getTargetMember } = require('../utils');

// Convertit "10m", "1h", "30s" en millisecondes. Par defaut 10 minutes.
function parseDuration(str) {
  if (!str) return 10 * 60 * 1000;
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 10 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Math.min(value * multipliers[unit], 28 * 86400000); // max 28 jours (limite Discord)
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
    return message.reply({
      embeds: [successEmbed(`**${target.user.tag}** a ete mute pendant ${duration / 60000} minute(s). Raison : ${reason}`)],
    });
  },
};
