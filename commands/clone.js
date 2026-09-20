const { PermissionsBitField, ChannelType } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'clone',
  // Usage : &clone <ID_du_serveur_destination>
  // Le bot doit etre present et Administrateur sur les DEUX serveurs.
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Seul un administrateur peut cloner ce serveur.')] });
    }

    const targetGuildId = args[0];
    if (!targetGuildId) {
      return message.reply({ embeds: [errorEmbed('Usage : `&clone <ID_du_serveur_destination>`\nLe bot doit etre Administrateur sur les deux serveurs.')] });
    }

    const targetGuild = message.client.guilds.cache.get(targetGuildId);
    if (!targetGuild) {
      return message.reply({ embeds: [errorEmbed('Le bot n\'est pas present sur ce serveur, ou l\'ID est incorrect.')] });
    }

    const botMemberTarget = targetGuild.members.me;
    if (!botMemberTarget.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Le bot doit avoir la permission Administrateur sur le serveur de destination.')] });
    }

    const confirmMsg = await message.reply(
      `⚠️ Tu es sur le point de copier la structure de **${message.guild.name}** vers **${targetGuild.name}**.\n` +
      `Cela va SUPPRIMER tous les salons et roles existants sur **${targetGuild.name}** puis recreer ceux de ce serveur.\n` +
      `Reagis avec ✅ dans les 15 secondes pour confirmer.`
    );
    await confirmMsg.react('✅');

    const filter = (reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id;
    const collected = await confirmMsg.awaitReactions({ filter, max: 1, time: 15000 }).catch(() => null);

    if (!collected || collected.size === 0) {
      return message.reply({ embeds: [errorEmbed('Clonage annule (pas de confirmation).')] });
    }

    const statusMsg = await message.reply('🔄 Clonage en cours, ne quitte pas le salon...');

    try {
      for (const [, channel] of targetGuild.channels.cache) {
        await channel.delete().catch(() => {});
      }
      for (const [, role] of targetGuild.roles.cache) {
        if (role.name !== '@everyone' && role.editable) {
          await role.delete().catch(() => {});
        }
      }

      const sourceRoles = message.guild.roles.cache
        .filter(r => r.name !== '@everyone')
        .sort((a, b) => a.position - b.position);

      const roleMap = new Map();
      for (const [, role] of sourceRoles) {
        const newRole = await targetGuild.roles.create({
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          permissions: role.permissions,
          mentionable: role.mentionable,
        }).catch(() => null);
        if (newRole) roleMap.set(role.id, newRole.id);
      }

      const categories = message.guild.channels.cache
        .filter(c => c.type === ChannelType.GuildCategory)
        .sort((a, b) => a.position - b.position);

      const categoryMap = new Map();
      for (const [, cat] of categories) {
        const newCat = await targetGuild.channels.create({
          name: cat.name,
          type: ChannelType.GuildCategory,
        }).catch(() => null);
        if (newCat) categoryMap.set(cat.id, newCat.id);
      }

      const channels = message.guild.channels.cache
        .filter(c => c.type !== ChannelType.GuildCategory)
        .sort((a, b) => a.position - b.position);

      for (const [, chan] of channels) {
        await targetGuild.channels.create({
          name: chan.name,
          type: chan.type,
          parent: chan.parentId ? categoryMap.get(chan.parentId) : null,
          topic: chan.topic || undefined,
          nsfw: chan.nsfw || false,
        }).catch(() => {});
      }

      await statusMsg.edit({
        embeds: [successEmbed(`Clonage termine ! **${targetGuild.name}** a maintenant la meme structure que **${message.guild.name}**.`)],
      });
    } catch (err) {
      console.error(err);
      await statusMsg.edit({ embeds: [errorEmbed('Une erreur est survenue pendant le clonage.')] });
    }
  },
};
