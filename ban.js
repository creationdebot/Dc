const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed, getTargetMember } = require('../utils');

module.exports = {
  name: 'ban',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.BanMembers)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de bannir.')] });
    }

    const target = getTargetMember(message, args);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID d\'un membre a bannir.')] });
    }

    if (!target.bannable) {
      return message.reply({ embeds: [errorEmbed('Je ne peux pas bannir ce membre (role trop haut ?).')] });
    }

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    await target.ban({ reason });
    return message.reply({ embeds: [successEmbed(`**${target.user.tag}** a ete banni. Raison : ${reason}`)] });
  },
};
