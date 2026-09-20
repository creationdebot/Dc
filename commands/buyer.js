const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed, getTargetMember } = require('../utils');

const buyersPath = path.join(__dirname, '..', 'buyers.json');

function loadBuyers() {
  if (!fs.existsSync(buyersPath)) fs.writeFileSync(buyersPath, '{}');
  return JSON.parse(fs.readFileSync(buyersPath, 'utf8'));
}

function saveBuyers(data) {
  fs.writeFileSync(buyersPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'buyer',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Seul un administrateur peut autoriser un utilisateur.')] });
    }

    const target = getTargetMember(message, args);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID d\'un membre a autoriser.')] });
    }

    const buyers = loadBuyers();
    const guildId = message.guild.id;
    buyers[guildId] = buyers[guildId] || [];

    if (buyers[guildId].includes(target.id)) {
      return message.reply({ embeds: [errorEmbed(`**${target.user.tag}** est deja autorise.`)] });
    }

    buyers[guildId].push(target.id);
    saveBuyers(buyers);

    return message.reply({ embeds: [successEmbed(`**${target.user.tag}** peut maintenant utiliser le bot.`)] });
  },
};
