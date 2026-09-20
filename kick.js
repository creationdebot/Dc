const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed, getTargetMember } = require('../utils');

module.exports = {
  name: 'kick',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.KickMembers)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission d\'expulser.')] });
    }

    const target = getTargetMember(message, args);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID d\'un membre a expulser.')] });
    }

    if (!target.kickable) {
      return message.reply({ embeds: [errorEmbed('Je ne peux pas expulser ce membre (role trop haut ?).')] });
    }

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    await target.kick(reason);
    return message.reply({ embeds: [successEmbed(`**${target.user.tag}** a ete expulse. Raison : ${reason}`)] });
  },
};
