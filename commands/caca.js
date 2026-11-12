// Panel de tickets - discord.js v14
// Installation : npm install discord.js
// Lancement    : node ticket-panel.js
// Utilisation  : /caca (réservé aux administrateurs)

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes,
} = require('discord.js');

// ======================= CONFIGURATION =======================
const config = {
  TOKEN: 'TON_TOKEN_ICI',
  CLIENT_ID: 'ID_DU_BOT',
  GUILD_ID: 'ID_DU_SERVEUR',
  CATEGORY_ID: 'ID_CATEGORIE_TICKETS', // catégorie où les tickets seront créés
  STAFF_ROLE_ID: 'ID_ROLE_STAFF',      // staff qui gère les BL et cages
  OWNER_ROLE_ID: 'ID_ROLE_OWNER',
  COOWNER_ROLE_ID: 'ID_ROLE_COOWNER',
  COLOR: 0x5865f2,
};

// Options du panel : "roles" = rôles qui voient le ticket
const OPTIONS = {
  bl: {
    label: 'Demande de BL',
    description: 'Faire une demande de BL',
    emoji: '📋',
    roles: [config.STAFF_ROLE_ID, config.OWNER_ROLE_ID, config.COOWNER_ROLE_ID],
    message: 'Merci de détailler ta **demande de BL** (pseudo, raison, preuves).',
  },
  cage: {
    label: 'Demande de cage',
    description: 'Faire une demande de cage',
    emoji: '🔒',
    roles: [config.STAFF_ROLE_ID, config.OWNER_ROLE_ID, config.COOWNER_ROLE_ID],
    message: 'Merci de détailler ta **demande de cage** (pseudo, raison, preuves).',
  },
  owner: {
    label: 'Parler au Owner',
    description: 'Contacter le owner du serveur',
    emoji: '👑',
    roles: [config.OWNER_ROLE_ID],
    message: 'Explique ta demande, le **Owner** te répondra dès que possible.',
  },
  coowner: {
    label: 'Parler au Co-Owner',
    description: 'Contacter le co-owner du serveur',
    emoji: '⭐',
    roles: [config.COOWNER_ROLE_ID],
    message: 'Explique ta demande, le **Co-Owner** te répondra dès que possible.',
  },
};

// ======================= CLIENT =======================
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Enregistrement de la commande slash
async function registerCommands() {
  const command = new SlashCommandBuilder()
    .setName('caca')
    .setDescription('Envoie le panel de tickets dans ce salon')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  const rest = new REST({ version: '10' }).setToken(config.TOKEN);
  await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), {
    body: [command.toJSON()],
  });
}

client.once(Events.ClientReady, async () => {
  await registerCommands();
  console.log(`Connecté en tant que ${client.user.tag}`);
});

// ======================= INTERACTIONS =======================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // --- /panel-tickets ---
    if (interaction.isChatInputCommand() && interaction.commandName === 'caca') {
      const embed = new EmbedBuilder()
        .setTitle('🎫 Support - Tickets')
        .setDescription(
          'Choisis une option dans le menu ci-dessous pour ouvrir un ticket.\n\n' +
            Object.values(OPTIONS)
              .map((o) => `${o.emoji} **${o.label}**\n${o.description}`)
              .join('\n\n')
        )
        .setColor(config.COLOR)
        .setFooter({ text: 'Un seul ticket par catégorie et par personne.' });

      const menu = new StringSelectMenuBuilder()
        .setCustomId('ticket_select')
        .setPlaceholder('Sélectionne le type de ticket')
        .addOptions(
          Object.entries(OPTIONS).map(([value, o]) => ({
            label: o.label,
            description: o.description,
            emoji: o.emoji,
            value,
          }))
        );

      await interaction.channel.send({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)],
      });
      return interaction.reply({ content: '✅ Panel envoyé.', ephemeral: true });
    }

    // --- Sélection d'une option : création du ticket ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
      const type = interaction.values[0];
      const option = OPTIONS[type];
      const guild = interaction.guild;
      const user = interaction.user;

      // Évite les doublons
      const topic = `ticket:${user.id}:${type}`;
      const existing = guild.channels.cache.find((c) => c.topic === topic);
      if (existing) {
        return interaction.reply({
          content: `❌ Tu as déjà un ticket ouvert : ${existing}`,
          ephemeral: true,
        });
      }

      const channel = await guild.channels.create({
        name: `${type}-${user.username}`.slice(0, 90),
        type: ChannelType.GuildText,
        parent: config.CATEGORY_ID,
        topic,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
            ],
          },
          ...option.roles.map((roleId) => ({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
            ],
          })),
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle(`${option.emoji} ${option.label}`)
        .setDescription(`Bienvenue ${user} !\n\n${option.message}`)
        .setColor(config.COLOR)
        .setTimestamp();

      const closeBtn = new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Fermer le ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger);

      await channel.send({
        content: `${user} ${option.roles.map((r) => `<@&${r}>`).join(' ')}`,
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(closeBtn)],
      });

      return interaction.reply({
        content: `✅ Ticket créé : ${channel}`,
        ephemeral: true,
      });
    }

    // --- Bouton de fermeture ---
    if (interaction.isButton() && interaction.customId === 'ticket_close') {
      const channel = interaction.channel;
      const ownerId = channel.topic?.split(':')[1];
      const isStaff = Object.values(OPTIONS)
        .flatMap((o) => o.roles)
        .some((roleId) => interaction.member.roles.cache.has(roleId));

      if (interaction.user.id !== ownerId && !isStaff) {
        return interaction.reply({
          content: "❌ Tu n'as pas la permission de fermer ce ticket.",
          ephemeral: true,
        });
      }

      await interaction.reply('🔒 Le ticket sera supprimé dans 5 secondes...');
      setTimeout(() => channel.delete().catch(() => {}), 5000);
    }
  } catch (err) {
    console.error(err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(config.TOKEN);
