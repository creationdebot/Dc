const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'unban',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.BanMembers)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de debannir.')] });
    }

    const userId = args[0];
    if (!userId) {
      return message.reply({ embeds: [errorEmbed('Donne l\'ID de l\'utilisateur a debannir.')] });
    }

    try {
      await message.guild.bans.remove(userId);
      return message.reply({ embeds: [successEmbed(`L'utilisateur \`${userId}\` a ete debanni.`)] });
    } catch {
      return message.reply({ embeds: [errorEmbed('Impossible de debannir cet ID (utilisateur pas banni ?).')] });
    }
  },
};
