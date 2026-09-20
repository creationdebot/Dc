const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed, getTargetMember } = require('../utils');

module.exports = {
  name: 'rank',
  // Usage: &rank @membre @role  (ou ID/nom de role)
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageRoles)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de gerer les roles.')] });
    }

    const target = getTargetMember(message, args);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID d\'un membre.')] });
    }

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[1]) ||
      message.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(1).join(' ').toLowerCase());

    if (!role) {
      return message.reply({ embeds: [errorEmbed('Mentionne, donne l\'ID ou le nom exact du role a attribuer.')] });
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({ embeds: [errorEmbed('Ce role est trop haut pour que je puisse l\'attribuer.')] });
    }

    await target.roles.add(role);
    return message.reply({ embeds: [successEmbed(`Le role **${role.name}** a ete donne a **${target.user.tag}**.`)] });
  },
};
