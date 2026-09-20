const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'dm',
  // Usage : &dm @role <message>
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageGuild)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission d\'envoyer une annonce.')] });
    }

    const role = message.mentions.roles.first();
    if (!role) {
      return message.reply({ embeds: [errorEmbed('Usage : `&dm @role <message>`')] });
    }

    const content = args.filter(a => !a.startsWith('<@&')).join(' ');
    if (!content) {
      return message.reply({ embeds: [errorEmbed('Usage : `&dm @role <message>`')] });
    }

    await message.guild.members.fetch();
    const members = role.members;

    if (members.size === 0) {
      return message.reply({ embeds: [errorEmbed(`Personne n'a le role **${role.name}**.`)] });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📢 Annonce de ${message.guild.name}`)
      .setDescription(content)
      .setColor(0x3498DB)
      .setFooter({ text: `Tu recois ce message car tu as le role ${role.name}.` });

    let sent = 0;
    let failed = 0;

    for (const [, member] of members) {
      try {
        await member.send({ embeds: [embed] });
        sent++;
      } catch {
        failed++;
      }
    }

    return message.reply({
      embeds: [successEmbed(`Annonce envoyee a ${sent} membre(s) avec le role **${role.name}**. ${failed > 0 ? `(${failed} echec(s), DM probablement fermes)` : ''}`)],
    });
  },
};
