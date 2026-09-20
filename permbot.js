const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'permbot',
  // Usage: &permbot @bot @role  -> attribue un role (ex: role "Bots") a un compte bot
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Seul un administrateur peut utiliser cette commande.')] });
    }

    const target = message.mentions.members?.first() || message.guild.members.cache.get(args[0]);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID du bot concerne.')] });
    }

    if (!target.user.bot) {
      return message.reply({ embeds: [errorEmbed('Cette commande ne s\'applique qu\'aux comptes bot.')] });
    }

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[1]) ||
      message.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(1).join(' ').toLowerCase());

    if (!role) {
      return message.reply({ embeds: [errorEmbed('Mentionne, donne l\'ID ou le nom exact du role a attribuer au bot.')] });
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({ embeds: [errorEmbed('Ce role est trop haut pour que je puisse l\'attribuer.')] });
    }

    await target.roles.add(role);
    return message.reply({
      embeds: [successEmbed(`Le role **${role.name}** a ete attribue au bot **${target.user.tag}**.`)],
    });
  },
};
