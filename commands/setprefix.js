const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

const prefixPath = path.join(__dirname, '..', 'prefixes.json');

function loadPrefixes() {
  if (!fs.existsSync(prefixPath)) fs.writeFileSync(prefixPath, '{}');
  return JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
}

function savePrefixes(data) {
  fs.writeFileSync(prefixPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'setprefix',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Seul un administrateur peut changer le prefixe.')] });
    }

    const newPrefix = args[0];
    if (!newPrefix || newPrefix.length > 5) {
      return message.reply({ embeds: [errorEmbed('Donne un prefixe valide (5 caracteres max). Exemple : `&setprefix !`')] });
    }

    const prefixes = loadPrefixes();
    prefixes[message.guild.id] = newPrefix;
    savePrefixes(prefixes);

    return message.reply({ embeds: [successEmbed(`Le prefixe de ce serveur est maintenant : \`${newPrefix}\``)] });
  },
};
