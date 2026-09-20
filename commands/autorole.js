const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

const autoroleePath = path.join(__dirname, '..', 'autorole.json');

function loadAutorole() {
  if (!fs.existsSync(autoroleePath)) fs.writeFileSync(autoroleePath, '{}');
  return JSON.parse(fs.readFileSync(autoroleePath, 'utf8'));
}

function saveAutorole(data) {
  fs.writeFileSync(autoroleePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'autorole',
  // Usage : &autorole @role   -> active
  //         &autorole off     -> desactive
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageRoles)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de gerer les roles.')] });
    }

    const data = loadAutorole();

    if (args[0]?.toLowerCase() === 'off') {
      delete data[message.guild.id];
      saveAutorole(data);
      return message.reply({ embeds: [successEmbed('Auto-role desactive.')] });
    }

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[0]) ||
      message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());

    if (!role) {
      return message.reply({ embeds: [errorEmbed('Usage : `&autorole @role` (ou `&autorole off` pour desactiver)')] });
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({ embeds: [errorEmbed('Je ne peux pas attribuer ce role (trop haut).')] });
    }

    data[message.guild.id] = role.id;
    saveAutorole(data);

    return message.reply({ embeds: [successEmbed(`Le role **${role.name}** sera desormais donne automatiquement a chaque nouveau membre.`)] });
  },
};
