const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed, getTargetMember, getLogChannel } = require('../utils');

module.exports = {
  name: 'kick',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.KickMembers)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission d\'expulser.')] });
    }

    const target = getTargetMember(message, args);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID d\'un membre a expulser.')] });
    }

    if (!target.kickable) {
      return message.reply({ embeds: [errorEmbed('Je ne peux pas expulser ce membre (role trop haut ?).')] });
    }

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    await target.kick(reason);
    message.reply({ embeds: [successEmbed(`**${target.user.tag}** a ete expulse. Raison : ${reason}`)] });

    const logChannel = getLogChannel(message.guild, 'moderation-logs');
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('👢 Membre expulse')
        .setColor(0xE67E22)
        .addFields(
          { name: 'Membre', value: `${target.user.tag} (${target.id})` },
          { name: 'Moderateur', value: `${message.author.tag}` },
          { name: 'Raison', value: reason },
        )
        .setTimestamp();
      logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
  },
};
