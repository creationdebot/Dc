const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');

let listenerAdded = false;

module.exports = {
  name: 'altticket',
  description: 'Affiche un panneau avec un bouton "Buy" qui cree un ticket d\'achat.',
  usage: '&altticket',
  async execute(message) {
    const client = message.client;

    if (!listenerAdded) {
      listenerAdded = true;

      client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;
        if (interaction.customId !== 'ticket_buy') return;

        await interaction.deferReply({ ephemeral: true });

        try {
          const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
              { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
              { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
          });

          await channel.send(`Bienvenue ${interaction.user}, explique ce que tu veux acheter.`);
          await interaction.editReply(`Ticket créé : ${channel}`);
        } catch (err) {
          console.error(err);
          await interaction.editReply('Erreur lors de la création du ticket.');
        }
      });
    }

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
