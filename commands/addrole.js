const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'addrole',
  description: 'Ajoute un role a tous les membres du serveur. Peut prendre du temps sur un gros serveur.',
  usage: '&addrole @role',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageRoles)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de gerer les roles.')] });
    }

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[0]) ||
      message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());

    if (!role) {
      return message.reply({ embeds: [errorEmbed('Usage : `&addrole @role`')] });
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({ embeds: [errorEmbed('Je ne peux pas attribuer ce role (trop haut).')] });
    }

    const statusMsg = await message.reply(`🔄 Ajout du role **${role.name}** a tous les membres, patiente...`);

    await message.guild.members.fetch();
    const members = message.guild.members.cache.filter(m => !m.roles.cache.has(role.id) && !m.user.bot);

    let added = 0;
    let failed = 0;

    for (const [, member] of members) {
      const ok = await member.roles.add(role).then(() => true).catch(() => false);
      if (ok) added++;
      else failed++;
    }

    return statusMsg.edit({
      embeds: [successEmbed(`Role **${role.name}** ajoute a ${added} membre(s). ${failed > 0 ? `(${failed} echec(s))` : ''}`)],
    });
  },
};
