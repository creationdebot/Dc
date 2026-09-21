const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'copyroles',
  description: 'Copie tous les roles d\'un serveur source vers ce serveur (sans supprimer les roles existants). Le bot doit etre Administrateur sur les deux serveurs.',
  usage: '&copyroles <ID_du_serveur_source>',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Seul un administrateur peut copier des roles.')] });
    }

    const sourceGuildId = args[0];
    if (!sourceGuildId) {
      return message.reply({ embeds: [errorEmbed('Usage : `&copyroles <ID_du_serveur_source>`\nLe bot doit etre Administrateur sur les deux serveurs.')] });
    }

    const sourceGuild = message.client.guilds.cache.get(sourceGuildId);
    if (!sourceGuild) {
      return message.reply({ embeds: [errorEmbed('Le bot n\'est pas present sur ce serveur, ou l\'ID est incorrect.')] });
    }

    const botMemberSource = sourceGuild.members.me;
    if (!botMemberSource.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Le bot doit avoir la permission Administrateur sur le serveur source.')] });
    }

    const sourceRoles = sourceGuild.roles.cache
      .filter(r => r.name !== '@everyone')
      .sort((a, b) => a.position - b.position);

    if (sourceRoles.size === 0) {
      return message.reply({ embeds: [errorEmbed('Ce serveur n\'a aucun role a copier.')] });
    }

    const statusMsg = await message.reply(`🔄 Copie de ${sourceRoles.size} role(s) depuis **${sourceGuild.name}**...`);

    let created = 0;
    let skipped = 0;

    for (const [, role] of sourceRoles) {
      const alreadyExists = message.guild.roles.cache.some(r => r.name === role.name);
      if (alreadyExists) {
        skipped++;
        continue;
      }

      await message.guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        permissions: role.permissions,
        mentionable: role.mentionable,
      }).catch(() => {});
      created++;
    }

    return statusMsg.edit({
      embeds: [successEmbed(`Copie terminee : **${created}** role(s) cree(s), **${skipped}** ignore(s) (nom deja existant sur ce serveur).`)],
    });
  },
};
