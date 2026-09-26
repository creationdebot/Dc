const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

const boostChannelPath = path.join(__dirname, '..', 'boostchannel.json');

function loadConfig() {
  if (!fs.existsSync(boostChannelPath)) fs.writeFileSync(boostChannelPath, '{}');
  return JSON.parse(fs.readFileSync(boostChannelPath, 'utf8'));
}

function saveConfig(data) {
  fs.writeFileSync(boostChannelPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'boost',
  description: 'Definit le salon ou sera annonce automatiquement chaque nouveau boost du serveur.',
  usage: '&boost #salon',
  async execute(message) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageGuild)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de faire ca.')] });
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply({ embeds: [errorEmbed('Usage : `&boost #salon`')] });
    }

    const config = loadConfig();
    config[message.guild.id] = channel.id;
    saveConfig(config);

    return message.reply({
      embeds: [successEmbed(`Chaque nouveau boost du serveur sera desormais annonce automatiquement dans ${channel}.`)],
    });
  },
};
