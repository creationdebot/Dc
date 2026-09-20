const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed, getTargetMember } = require('../utils');

module.exports = {
  name: 'unmute',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission d\'unmute.')] });
    }

    const target = getTargetMember(message, args);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID d\'un membre a unmute.')] });
    }

    await target.timeout(null);
    return message.reply({ embeds: [successEmbed(`**${target.user.tag}** a ete unmute.`)] });
  },
};
