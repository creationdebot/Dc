const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ticket',
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Support - Ouvrir un ticket')
      .setDescription('Choisis une categorie ci-dessous pour ouvrir un ticket prive avec le staff.')
      .setColor(0x3498DB);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_owner').setLabel('Parler a un owner').setEmoji('👑').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket_staff').setLabel('Recrutement staff').setEmoji('📋').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_other').setLabel('Autre question').setEmoji('❓').setStyle(ButtonStyle.Secondary),
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  },
};
