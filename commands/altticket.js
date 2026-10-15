const { ChannelType, PermissionFlagsBits } = require('discord.js');

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
