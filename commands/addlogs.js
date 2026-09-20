const { PermissionsBitField, ChannelType } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

const LOG_CHANNELS = ['raid-logs', 'role-logs', 'moderation-logs'];

module.exports = {
  name: 'addlogs',
  async execute(message) {
    if (!hasPermission(message, PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Seul un administrateur peut configurer les logs.')] });
    }

    const guild = message.guild;
    const everyone = guild.roles.everyone;
    const created = [];
    const alreadyExisting = [];

    for (const name of LOG_CHANNELS) {
      const existing = guild.channels.cache.find(c => c.name === name);
      if (existing) {
        alreadyExisting.push(name);
        continue;
      }

      const channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      }).catch(() => null);

      if (channel) created.push(channel);
    }

    if (created.length > 0) {
      const maxPosition = Math.max(...guild.channels.cache.map(c => c.position), 0);
      for (let i = 0; i < created.length; i++) {
        await created[i].setPosition(maxPosition + i + 1).catch(() => {});
      }
    }

    let description = '';
    if (created.length > 0) {
      description += `Salons crees : ${created.map(c => `<#${c.id}>`).join(', ')}\n`;
    }
    if (alreadyExisting.length > 0) {
      description += `Deja existants (non recrees) : ${alreadyExisting.join(', ')}\n`;
    }
    description += '\nCes salons sont caches pour @everyone. Donne la permission de voir le salon a ton role staff/admin si besoin.';

    return message.reply({ embeds: [successEmbed(description)] });
  },
};
