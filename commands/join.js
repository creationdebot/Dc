const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

const joinChannelPath = path.join(__dirname, '..', 'joinchannel.json');

function loadConfig() {
  if (!fs.existsSync(joinChannelPath)) fs.writeFileSync(joinChannelPath, '{}');
  return JSON.parse(fs.readFileSync(joinChannelPath, 'utf8'));
}

function saveConfig(data) {
  fs.writeFileSync(joinChannelPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'join',
  description: 'Definit le salon ou sera annoncee automatiquement chaque nouvelle arrivee sur le serveur.',
  usage: '&join #salon',
  async execute(message) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageGuild)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de faire ca.')] });
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply({ embeds: [errorEmbed('Usage : `&join #salon`')] });
    }

    const config = loadConfig();
    config[message.guild.id] = channel.id;
    saveConfig(config);

    return message.reply({
      embeds: [successEmbed(`Chaque nouvelle arrivee sur le serveur sera desormais annoncee dans ${channel}.`)],
    });
  },
};
