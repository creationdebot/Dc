const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed, getTargetMember, getLogChannel } = require('../utils');

module.exports = {
  name: 'ban',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.BanMembers)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de bannir.')] });
    }

    const target = getTargetMember(message, args);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID d\'un membre a bannir.')] });
    }

    if (!target.bannable) {
      return message.reply({ embeds: [errorEmbed('Je ne peux pas bannir ce membre (role trop haut ?).')] });
    }

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    await target.ban({ reason });
    message.reply({ embeds: [successEmbed(`**${target.user.tag}** a ete banni. Raison : ${reason}`)] });

    const logChannel = getLogChannel(message.guild, 'moderation-logs');
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🔨 Membre banni')
        .setColor(0xE74C3C)
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
