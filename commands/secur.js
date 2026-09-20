const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

const securityPath = path.join(__dirname, '..', 'security.json');

function loadSecurity() {
  if (!fs.existsSync(securityPath)) fs.writeFileSync(securityPath, '{}');
  return JSON.parse(fs.readFileSync(securityPath, 'utf8'));
}

function saveSecurity(data) {
  fs.writeFileSync(securityPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'secur',
  // Usage : &secur max  |  &secur off
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Seul un administrateur peut gerer la securite du serveur.')] });
    }

    const mode = args[0]?.toLowerCase();
    if (!['max', 'off'].includes(mode)) {
      return message.reply({ embeds: [errorEmbed('Usage : `&secur max` (activer) ou `&secur off` (desactiver)')] });
    }

    const data = loadSecurity();

    if (mode === 'max') {
      data[message.guild.id] = true;
      saveSecurity(data);
      return message.reply({
        embeds: [successEmbed(
          '🔒 **Mode securite maximale active.**\n' +
          'Toute personne (hors proprietaire) qui supprime un salon/role, cree un salon/role, modifie les permissions de @everyone, ' +
          'ou s\'attribue des permissions dangereuses sera automatiquement expulsee et l\'action sera annulee autant que possible.'
        )],
      });
    }

    data[message.guild.id] = false;
    saveSecurity(data);
    return message.reply({ embeds: [successEmbed('🔓 Mode securite maximale desactive.')] });
  },
};
