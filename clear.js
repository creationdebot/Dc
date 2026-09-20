const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'clear',
  aliases: ['purge'],
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageMessages)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de supprimer des messages.')] });
    }

    const amount = parseInt(args[0], 10);
    if (!amount || amount < 1 || amount > 100) {
      return message.reply({ embeds: [errorEmbed('Donne un nombre entre 1 et 100.')] });
    }

    await message.channel.bulkDelete(amount, true).catch(() => null);
    const confirmation = await message.channel.send({
      embeds: [successEmbed(`${amount} message(s) supprime(s).`)],
    });
    setTimeout(() => confirmation.delete().catch(() => {}), 4000);
  },
};
