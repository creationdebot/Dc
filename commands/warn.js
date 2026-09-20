const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed, getTargetMember } = require('../utils');

const warnsPath = path.join(__dirname, '..', 'warns.json');

function loadWarns() {
  if (!fs.existsSync(warnsPath)) fs.writeFileSync(warnsPath, '{}');
  return JSON.parse(fs.readFileSync(warnsPath, 'utf8'));
}

function saveWarns(data) {
  fs.writeFileSync(warnsPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'warn',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de warn.')] });
    }

    const target = getTargetMember(message, args);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID d\'un membre a warn.')] });
    }

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    const warns = loadWarns();
    const guildId = message.guild.id;
    warns[guildId] = warns[guildId] || {};
    warns[guildId][target.id] = warns[guildId][target.id] || [];
    warns[guildId][target.id].push({
      reason,
      moderator: message.author.id,
      date: new Date().toISOString(),
    });
    saveWarns(warns);

    const count = warns[guildId][target.id].length;
    return message.reply({
      embeds: [successEmbed(`**${target.user.tag}** a recu un avertissement (${count} au total). Raison : ${reason}`)],
    });
  },
};
