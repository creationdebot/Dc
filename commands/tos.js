const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'tos',
  description: 'Affiche les liens des conditions d\'utilisation, regles de la communaute et politique de confidentialite de Discord.',
  usage: '&tos',
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('📋 tos discord')
      .setDescription(
        '[https://discord.com/terms](https://discord.com/terms)\n\n' +
        '[https://discord.com/guidelines](https://discord.com/guidelines)\n\n' +
        '[https://discord.com/privacy](https://discord.com/privacy)'
      )
      .setColor(0x2F3136);

    return message.channel.send({ embeds: [embed] });
  },
};
