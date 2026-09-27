const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'unbanall',
  description: 'Debannit tous les utilisateurs actuellement bannis du serveur.',
  usage: '&unbanall',
  async execute(message) {
    if (!hasPermission(message, PermissionsBitField.Flags.BanMembers)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de debannir.')] });
    }

    const bans = await message.guild.bans.fetch().catch(() => null);
    if (!bans || bans.size === 0) {
      return message.reply({ embeds: [errorEmbed('Aucun utilisateur banni sur ce serveur.')] });
    }

    const confirmMsg = await message.reply(
      `⚠️ Tu es sur le point de debannir **${bans.size}** utilisateur(s).\n` +
      'Reagis avec ✅ dans les 15 secondes pour confirmer.'
    );
    await confirmMsg.react('✅');

    const filter = (reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id;
    const collected = await confirmMsg.awaitReactions({ filter, max: 1, time: 15000 }).catch(() => null);

    if (!collected || collected.size === 0) {
      return message.reply({ embeds: [errorEmbed('Annule (pas de confirmation).')] });
    }

    const statusMsg = await message.reply(`🔄 Debannissement de ${bans.size} utilisateur(s) en cours...`);

    let unbanned = 0;
    let failed = 0;

    for (const [userId] of bans) {
      const ok = await message.guild.bans.remove(userId).then(() => true).catch(() => false);
      if (ok) unbanned++;
      else failed++;
    }

    return statusMsg.edit({
      embeds: [successEmbed(`${unbanned} utilisateur(s) debanni(s). ${failed > 0 ? `(${failed} echec(s))` : ''}`)],
    });
  },
};
