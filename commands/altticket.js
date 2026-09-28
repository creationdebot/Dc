const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'altticket',
  description: 'Affiche un panneau avec un bouton "Buy" qui cree un ticket d\'achat.',
  usage: '&altticket',
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('🛒 Buy')
      .setDescription('Clique sur le bouton **Buy** ci-dessous pour ouvrir un ticket d\'achat avec le meilleur owner uhq .')
      .setColor(0x2ECC71);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_buy').setLabel('Buy').setEmoji('🛒').setStyle(ButtonStyle.Success),
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  },
};
