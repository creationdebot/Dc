const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

const configPath = path.join(__dirname, '..', 'leashrole.json');

function loadConfig() {
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, '{}');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'acclaisse',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Seul un administrateur peut configurer ce role.')] });
    }

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[0]) ||
      message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());

    if (!role) {
      return message.reply({ embeds: [errorEmbed('Usage : `&acclaisse @role`')] });
    }

    const config = loadConfig();
    config[message.guild.id] = role.id;
    saveConfig(config);

    return message.reply({
      embeds: [successEmbed(
        `Le role **${role.name}** est maintenant le role de consentement pour la laisse.\n` +
        `Les membres qui veulent pouvoir etre mis en laisse doivent taper \`&subscribe @${role.name}\` pour le prendre eux-memes.`
      )],
    });
  },
};
