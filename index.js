require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const DEFAULT_PREFIX = process.env.PREFIX || '&';
const prefixPath = path.join(__dirname, 'prefixes.json');

function getPrefix(guildId) {
  if (!fs.existsSync(prefixPath)) return DEFAULT_PREFIX;
  const prefixes = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
  return prefixes[guildId] || DEFAULT_PREFIX;
}

const buyersPath = path.join(__dirname, 'buyers.json');
const securityPath = path.join(__dirname, 'security.json');

function isAuthorized(message) {
  if (message.member.permissions.has('Administrator')) return true;
  if (message.guild.ownerId === message.author.id) return true;

  if (!fs.existsSync(buyersPath)) return false;
  const buyers = JSON.parse(fs.readFileSync(buyersPath, 'utf8'));
  const guildBuyers = buyers[message.guild.id] || [];
  return guildBuyers.includes(message.author.id);
}

function isSecurityEnabled(guildId) {
  if (!fs.existsSync(securityPath)) return false;
  const data = JSON.parse(fs.readFileSync(securityPath, 'utf8'));
  return !!data[guildId];
}

async function punishExecutor(guild, executor, reason) {
  if (!executor) return;
  if (executor.id === guild.ownerId) return;
  if (executor.id === guild.client.user.id) return;

  const member = await guild.members.fetch(executor.id).catch(() => null);
  if (!member || !member.kickable) return;

  await member.kick(reason).catch(() => {});

  const logChannel = guild.channels.cache.find(c => c.name === 'moderation-logs' && c.isTextBased());
  if (logChannel) {
    logChannel.send(`🚨 **${executor.tag}** a ete expulse automatiquement (mode securite maximale) : ${reason}`).catch(() => {});
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command?.name) {
    client.commands.set(command.name, command);
    if (command.aliases) {
      for (const alias of command.aliases) client.commands.set(alias, command);
    }
  }
}

client.once('ready', () => {
  console.log(`Connecte en tant que ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: `${DEFAULT_PREFIX}help` }],
    status: 'online',
  });
});

const statsPath = path.join(__dirname, 'stats.json');

function incrementMessageCount(guildId, userId) {
  const stats = fs.existsSync(statsPath) ? JSON.parse(fs.readFileSync(statsPath, 'utf8')) : {};
  stats[guildId] = stats[guildId] || {};
  stats[guildId][userId] = stats[guildId][userId] || { messages: 0, voiceSeconds: 0 };
  stats[guildId][userId].messages++;
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

function addVoiceSeconds(guildId, userId, seconds) {
  const stats = fs.existsSync(statsPath) ? JSON.parse(fs.readFileSync(statsPath, 'utf8')) : {};
  stats[guildId] = stats[guildId] || {};
  stats[guildId][userId] = stats[guildId][userId] || { messages: 0, voiceSeconds: 0 };
  stats[guildId][userId].voiceSeconds += seconds;
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  incrementMessageCount(message.guild.id, message.author.id);

  const prefix = getPrefix(message.guild.id);
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  if (!isAuthorized(message)) {
    return message.reply('❌ Tu n\'es pas autorise a utiliser ce bot. Demande a un administrateur de t\'ajouter avec `&buyer`.');
  }

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply('Une erreur est survenue lors de l\'execution de cette commande.').catch(() => {});
  }
});

client.on('channelDelete', async (channel) => {
  if (!channel.guild || !isSecurityEnabled(channel.guild.id)) return;
  const logs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 }).catch(() => null);
  const entry = logs?.entries.first();
  if (entry && entry.target?.id === channel.id) {
    await punishExecutor(channel.guild, entry.executor, `Suppression du salon #${channel.name}`);
  }
});

client.on('channelCreate', async (channel) => {
  if (!channel.guild || !isSecurityEnabled(channel.guild.id)) return;
  const logs = await channel.guild.fetchAuditLogs({ type: 10, limit: 1 }).catch(() => null);
  const entry = logs?.entries.first();
  if (entry && entry.target?.id === channel.id) {
    await channel.delete().catch(() => {});
    await punishExecutor(channel.guild, entry.executor, `Creation non autorisee du salon #${channel.name}`);
  }
});

client.on('roleDelete', async (role) => {
  if (!isSecurityEnabled(role.guild.id)) return;
  const logs = await role.guild.fetchAuditLogs({ type: 32, limit: 1 }).catch(() => null);
  const entry = logs?.entries.first();
  if (entry && entry.target?.id === role.id) {
    await punishExecutor(role.guild, entry.executor, `Suppression du role ${role.name}`);
  }
});

client.on('roleCreate', async (role) => {
  if (!isSecurityEnabled(role.guild.id)) return;
  const logs = await role.guild.fetchAuditLogs({ type: 30, limit: 1 }).catch(() => null);
  const entry = logs?.entries.first();
  if (entry && entry.target?.id === role.id) {
    await role.delete().catch(() => {});
    await punishExecutor(role.guild, entry.executor, `Creation non autorisee du role ${role.name}`);
  }
});

client.on('roleUpdate', async (oldRole, newRole) => {
  if (!isSecurityEnabled(newRole.guild.id)) return;
  if (newRole.id === newRole.guild.id && !oldRole.permissions.equals(newRole.permissions)) {
    await newRole.setPermissions(oldRole.permissions).catch(() => {});
    const logs = await newRole.guild.fetchAuditLogs({ type: 31, limit: 1 }).catch(() => null);
    const entry = logs?.entries.first();
    await punishExecutor(newRole.guild, entry?.executor, 'Modification des permissions de @everyone');
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  const addedRoles = newRoles.filter(r => !oldRoles.has(r.id));
  const removedRoles = oldRoles.filter(r => !newRoles.has(r.id));

  if (isSecurityEnabled(newMember.guild.id) && addedRoles.size > 0) {
    const logs = await newMember.guild.fetchAuditLogs({ type: 25, limit: 1 }).catch(() => null);
    const entry = logs?.entries.first();
    const executor = entry?.executor;

    let executorIsSafe = true;
    if (executor) {
      const isOwner = executor.id === newMember.guild.ownerId;
      const isBot = executor.id === newMember.guild.client.user.id;
      const executorMember = await newMember.guild.members.fetch(executor.id).catch(() => null);
      const isAdmin = executorMember?.permissions.has('Administrator');
      executorIsSafe = isOwner || isBot || isAdmin;
    }

    if (executor && !executorIsSafe) {
      for (const [, role] of addedRoles) {
        await newMember.roles.remove(role).catch(() => {});
      }
      await punishExecutor(newMember.guild, executor, `A donne un/des role(s) a ${newMember.user.tag} (${addedRoles.map(r => r.name).join(', ')})`);
    }
  }

  if (addedRoles.size === 0 && removedRoles.size === 0) return;

  const logChannel = newMember.guild.channels.cache.find(c => c.name === 'role-logs' && c.isTextBased());
  if (!logChannel) return;

  if (addedRoles.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('➕ Role(s) ajoute(s)')
      .setColor(0x2ECC71)
      .addFields(
        { name: 'Membre', value: `${newMember.user.tag} (${newMember.id})` },
        { name: 'Role(s)', value: addedRoles.map(r => r.name).join(', ') },
      )
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => {});
  }

  if (removedRoles.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('➖ Role(s) retire(s)')
      .setColor(0xE74C3C)
      .addFields(
        { name: 'Membre', value: `${newMember.user.tag} (${newMember.id})` },
        { name: 'Role(s)', value: removedRoles.map(r => r.name).join(', ') },
      )
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => {});
  }
});

const autoroleePath = path.join(__dirname, 'autorole.json');

client.on('guildMemberAdd', async (member) => {
  if (!fs.existsSync(autoroleePath)) return;
  const data = JSON.parse(fs.readFileSync(autoroleePath, 'utf8'));
  const roleId = data[member.guild.id];
  if (!roleId) return;

  const role = member.guild.roles.cache.get(roleId);
  if (!role) return;

  await member.roles.add(role).catch(() => {});
});

const TICKET_LABELS = {
  ticket_owner: { name: 'owner', title: '👑 Ticket - Parler a un owner' },
  ticket_staff: { name: 'staff', title: '📋 Ticket - Recrutement staff' },
  ticket_other: { name: 'question', title: '❓ Ticket - Autre question' },
};

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (TICKET_LABELS[interaction.customId]) {
    const guild = interaction.guild;
    const info = TICKET_LABELS[interaction.customId];
    const channelName = `ticket-${info.name}-${interaction.user.username}`.toLowerCase().slice(0, 90);

    const existing = guild.channels.cache.find(c => c.topic === `ticket:${interaction.user.id}`);
    if (existing) {
      return interaction.reply({ content: `Tu as deja un ticket ouvert : ${existing}`, ephemeral: true });
    }

    let category = guild.channels.cache.find(c => c.name === 'Tickets' && c.type === 4);
    if (!category) {
      category = await guild.channels.create({ name: 'Tickets', type: 4 }).catch(() => null);
    }

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: 0,
      parent: category?.id,
      topic: `ticket:${interaction.user.id}`,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: ['ViewChannel'] },
        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
      ],
    }).catch(() => null);

    if (!ticketChannel) {
      return interaction.reply({ content: 'Erreur lors de la creation du ticket.', ephemeral: true });
    }

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer le ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    );

    await ticketChannel.send({
      content: `${interaction.user} | Le staff va te repondre bientot.`,
      embeds: [new EmbedBuilder().setTitle(info.title).setColor(0x3498DB).setDescription('Explique ta demande ici. Un membre du staff va s\'en occuper.')],
      components: [closeRow],
    });

    return interaction.reply({ content: `Ton ticket a ete cree : ${ticketChannel}`, ephemeral: true });
  }

  if (interaction.customId === 'ticket_close') {
    if (!interaction.channel.topic?.startsWith('ticket:')) return;
    await interaction.reply('🔒 Ce ticket sera ferme dans 5 secondes...');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
});

const voiceJoinTimestamps = new Map();

client.on('voiceStateUpdate', async (oldState, newState) => {
  const key = `${newState.guild.id}-${newState.member.id}`;

  if (!oldState.channelId && newState.channelId) {
    voiceJoinTimestamps.set(key, Date.now());
  }

  if (oldState.channelId && !newState.channelId) {
    const joinedAt = voiceJoinTimestamps.get(key);
    if (joinedAt) {
      const seconds = Math.floor((Date.now() - joinedAt) / 1000);
      addVoiceSeconds(newState.guild.id, newState.member.id, seconds);
      voiceJoinTimestamps.delete(key);
    }
  }
});

const leashPath = path.join(__dirname, 'leash.json');

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!fs.existsSync(leashPath)) return;
  if (!newState.channelId || oldState.channelId === newState.channelId) return;

  const leash = JSON.parse(fs.readFileSync(leashPath, 'utf8'));
  const guildLeash = leash[newState.guild.id];
  if (!guildLeash) return;

  for (const [followerId, entry] of Object.entries(guildLeash)) {
    if (entry.leaderId !== newState.member.id) continue;

    const followerMember = await newState.guild.members.fetch(followerId).catch(() => null);
    if (followerMember?.voice.channelId) {
      await followerMember.voice.setChannel(newState.channelId).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
