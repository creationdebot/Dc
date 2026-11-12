// Commande : &caca  -> envoie le panel de tickets (BL, cage, owner, co-owner)
// A mettre dans le dossier /commands (et supprimer l'ancien ticket-panel.js)
// Pas de client.login ici : on utilise le bot existant.

const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');

// ======================= CONFIGURATION =======================
const config = {
  OWNER_ROLE_ID: '1570480657602314242',
  OWNER_ROLE_ID: '1570480657602314242',
  COOWNER_ROLE_ID: '1570480658663612577',
  CATEGORY_NAME: 'Tickets', // catégorie créée automatiquement si elle n'existe pas
  COLOR: 0x5865f2,
};

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

const SELECT_ID = 'tp_select';
const CLOSE_ID = 'tp_close';

// ======================= GESTION DES INTERACTIONS =======================
let listening = false;

function startListener(client) {
  if (listening) return;
  listening = true;

  client.on('interactionCreate', async (interaction) => {
    try {
      // --- Choix dans le menu : création du ticket ---
      if (interaction.isStringSelectMenu() && interaction.customId === SELECT_ID) {
        const type = interaction.values[0];
        const option = OPTIONS[type];
        if (!option) return;

        const guild = interaction.guild;
        const user = interaction.user;
        const topic = `tp:${user.id}:${type}`;

        const existing = guild.channels.cache.find((c) => c.topic === topic);
        if (existing) {
          return interaction.reply({
            content: `❌ Tu as déjà un ticket ouvert : ${existing}`,
            ephemeral: true,
          });
        }

        // Catégorie
        let category = guild.channels.cache.find(
          (c) => c.name === config.CATEGORY_NAME && c.type === ChannelType.GuildCategory
        );
        if (!category) {
          category = await guild.channels
            .create({ name: config.CATEGORY_NAME, type: ChannelType.GuildCategory })
            .catch(() => null);
        }

        // On ne garde que les rôles qui existent vraiment
        const roleIds = option.roles.filter((id) => guild.roles.cache.has(id));
        const allow = [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ];

        const channel = await guild.channels
          .create({
            name: `${type}-${user.username}`.toLowerCase().slice(0, 90),
            type: ChannelType.GuildText,
            parent: category?.id,
            topic,
            permissionOverwrites: [
              { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
              { id: user.id, allow },
              ...roleIds.map((id) => ({ id, allow })),
            ],
          })
          .catch((e) => {
            console.error('[caca] création ticket :', e.message);
            return null;
          });

        if (!channel) {
          return interaction.reply({
            content: '❌ Impossible de créer le ticket (permissions du bot ?).',
            ephemeral: true,
          });
        }

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(CLOSE_ID)
            .setLabel('Fermer le ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
          content: `${user} ${roleIds.map((id) => `<@&${id}>`).join(' ')}`,
          embeds: [
            new EmbedBuilder()
              .setTitle(`${option.emoji} ${option.label}`)
              .setDescription(`Bienvenue ${user} !\n\n${option.message}`)
              .setColor(config.COLOR)
              .setTimestamp(),
          ],
          components: [closeRow],
        });

        return interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true });
      }

      // --- Bouton de fermeture ---
      if (interaction.isButton() && interaction.customId === CLOSE_ID) {
        const channel = interaction.channel;
        if (!channel.topic?.startsWith('tp:')) return;

        const [, ownerId, type] = channel.topic.split(':');
        const allowedRoles = OPTIONS[type]?.roles || [];
        const canClose =
          interaction.user.id === ownerId ||
          interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
          allowedRoles.some((id) => interaction.member.roles.cache.has(id));

        if (!canClose) {
          return interaction.reply({
            content: "❌ Tu n'as pas la permission de fermer ce ticket.",
            ephemeral: true,
          });
        }

        await interaction.reply('🔒 Ce ticket sera fermé dans 5 secondes...');
        setTimeout(() => channel.delete().catch(() => {}), 5000);
      }
    } catch (err) {
      console.error('[caca]', err);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true }).catch(() => {});
      }
    }
  });
}

// ======================= COMMANDE =======================
module.exports = {
  name: 'caca',
  aliases: ['ticketpanel'],

  // Appelé au démarrage si 'caca' est dans la liste de l'index
  init(client) {
    startListener(client);
  },

  async execute(message, args, client) {
    startListener(client); // sécurité si init n'a pas été appelé

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
      .setCustomId(SELECT_ID)
      .setPlaceholder('Sélectionne le type de ticket')
      .addOptions(
        Object.entries(OPTIONS).map(([value, o]) => ({
          label: o.label,
          description: o.description,
          emoji: o.emoji,
          value,
        }))
      );

    await message.channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)],
    });

    message.delete().catch(() => {});
  },
};
