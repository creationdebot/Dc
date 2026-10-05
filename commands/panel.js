// commands/panel.js : -panel
// Poste un panel de tickets avec un menu déroulant "Choisir une catégorie..."
// 3 catégories : Ticket Owner, Ticket Partenariat, Ticket Animation.
// Le bouton "Fermer le ticket" utilise le système déjà présent dans ton index.js (ticket_close).
const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  PermissionFlagsBits, ChannelType,
} = require('discord.js');

const NOM = 'Tomioka';
const SELECT_ID = 'ticket_panel_select';

// IDs des rôles staff qui doivent voir chaque type de ticket (optionnel).
// Exemple : owner: ['123456789012345678']
// Les administrateurs voient toujours tous les tickets.
const STAFF_ROLES = {
  owner: [1556035670458237050],
  partenariat: [1556753778483396669],
  animation: [1556687531184103424],
};

const CATEGORIES = {
  owner: {
    label: 'Ticket Owner',
    description: 'Ticket pour contacter un owner, demande de fusions, fournis etc..',
    emoji: '👑',
    channel: 'owner',
    title: '👑 Ticket Owner',
  },
  partenariat: {
    label: 'Ticket Partenariat',
    description: `Ouvrir un ticket afin d'effectuer un Partenariat avec ${NOM}.`,
    emoji: '⭐',
    channel: 'partenariat',
    title: '⭐ Ticket Partenariat',
  },
  animation: {
    label: 'Ticket Animation',
    description: "Proposer une idée d'animations, passer dans un vote2fame, devenir animateur ect..",
    emoji: '🎉',
    channel: 'animation',
    title: '🎉 Ticket Animation',
  },
};

function buildRow() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(SELECT_ID)
    .setPlaceholder('Choisir une catégorie...')
    .addOptions(
      Object.entries(CATEGORIES).map(([value, c]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(c.label)
          .setDescription(c.description.slice(0, 100))
          .setEmoji(c.emoji)
          .setValue(value)
      )
    );
  return new ActionRowBuilder().addComponents(menu);
}

async function handleSelect(interaction) {
  const key = interaction.values[0];
  const cat = CATEGORIES[key];
  if (!cat) return;

  const guild = interaction.guild;
  await interaction.deferReply({ ephemeral: true });

  // Remet le menu à zéro pour pouvoir rechoisir la même catégorie plus tard
  interaction.message.edit({ components: [buildRow()] }).catch(() => {});

  // Un seul ticket ouvert par personne (même règle que le reste du bot)
  const existing = guild.channels.cache.find((c) => c.topic === `ticket:${interaction.user.id}`);
  if (existing) {
    return interaction.editReply(`Tu as déjà un ticket ouvert : ${existing}`);
  }

  // Catégorie "Tickets" (créée si elle n'existe pas)
  let parent = guild.channels.cache.find(
    (c) => c.name === 'Tickets' && c.type === ChannelType.GuildCategory
  );
  if (!parent) {
    parent = await guild.channels.create({ name: 'Tickets', type: ChannelType.GuildCategory }).catch(() => null);
  }

  const staffRoles = (STAFF_ROLES[key] || []).filter((id) => guild.roles.cache.has(id));

  const channelName = `ticket-${cat.channel}-${interaction.user.username}`.toLowerCase().slice(0, 90);
  const ticketChannel = await guild.channels
    .create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: parent?.id,
      topic: `ticket:${interaction.user.id}`,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        ...staffRoles.map((id) => ({
          id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        })),
      ],
    })
    .catch((e) => {
      console.error('Création du ticket impossible :', e.message);
      return null;
    });

  if (!ticketChannel) {
    return interaction.editReply('❌ Erreur lors de la création du ticket.');
  }

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Fermer le ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );

  const staffPing = staffRoles.map((id) => `<@&${id}>`).join(' ');
  await ticketChannel.send({
    content: `${interaction.user} ${staffPing}`.trim(),
    embeds: [
      new EmbedBuilder()
        .setTitle(cat.title)
        .setColor(0x2b2d31)
        .setDescription("Explique ta demande ici. Un membre du staff va s'en occuper."),
    ],
    components: [closeRow],
  });

  return interaction.editReply(`✅ Ton ticket a été créé : ${ticketChannel}`);
}

let initialized = false;
function init(client) {
  if (initialized) return;
  initialized = true;
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== SELECT_ID) return;
    try {
      await handleSelect(interaction);
    } catch (e) {
      console.error('Erreur panel tickets :', e);
      const msg = '❌ Une erreur est survenue.';
      if (interaction.deferred || interaction.replied) interaction.editReply(msg).catch(() => {});
      else interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  });
}

module.exports = {
  name: 'panel',
  aliases: ['panneau'],
  init,

  async execute(message, args, client) {
    init(client || message.client);

    try {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('Tu dois être administrateur pour utiliser cette commande.');
      }

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle(`📩 Support ${NOM}`)
        .setDescription(
          'Besoin d\'aide ou d\'une demande particulière ?\n' +
          'Choisis une catégorie dans le menu ci-dessous pour ouvrir un ticket.'
        );

      await message.channel.send({ embeds: [embed], components: [buildRow()] });
      await message.delete().catch(() => {});
    } catch (err) {
      console.error('Erreur -panel :', err);
      await message.reply(`❌ Erreur : \`${err.message}\``).catch(() => {});
    }
  },
};
