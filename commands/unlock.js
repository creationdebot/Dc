const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'unlock',
  async execute(message) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de deverrouiller ce salon.')] });
    }

    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: null,
    });

    return message.reply({ embeds: [successEmbed('Ce salon a ete deverrouille.')] });
  },
};
