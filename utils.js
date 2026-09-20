const { EmbedBuilder } = require('discord.js');

function hasPermission(message, permissionFlag) {
  return message.member.permissions.has(permissionFlag);
}

function errorEmbed(text) {
  return new EmbedBuilder().setColor(0xE74C3C).setDescription(`❌ ${text}`);
}

function successEmbed(text) {
  return new EmbedBuilder().setColor(0x2ECC71).setDescription(`✅ ${text}`);
}

function getTargetMember(message, args) {
  const mention = message.mentions.members?.first();
  if (mention) return mention;
  const id = args[0];
  if (id) return message.guild.members.cache.get(id) || null;
  return null;
}

function getLogChannel(guild, name) {
  return guild.channels.cache.find(c => c.name === name && c.isTextBased());
}

module.exports = { hasPermission, errorEmbed, successEmbed, getTargetMember, getLogChannel };
