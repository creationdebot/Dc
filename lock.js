const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'lock',
  async execute(message) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de verrouiller ce salon.')] });
    }

    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false,
    });

    return message.reply({ embeds: [successEmbed('Ce salon a ete verrouille. Personne ne peut plus envoyer de messages.')] });
  },
};
