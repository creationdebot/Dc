const { PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const { hasPermission, errorEmbed } = require('../utils');

module.exports = {
  name: 'bztmr',
  description: 'Supprime tous les salons du serveur et cree un salon unique annonçant la migration vers le nouveau serveur.',
  usage: '&bztmr <lien_invitation>',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Seul un administrateur peut faire ca.')] });
    }

    const inviteLink = args[0];
    if (!inviteLink) {
      return message.reply({ embeds: [errorEmbed('Usage : `&bztmr <lien_invitation>`')] });
    }

    const confirmMsg = await message.reply(
      '⚠️ Ceci va supprimer **TOUS** les salons de ce serveur et les remplacer par une annonce de migration.\n' +
      'Reagis avec ✅ dans les 15 secondes pour confirmer.'
    );
    await confirmMsg.react('✅');

    const filter = (reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id;
    const collected = await confirmMsg.awaitReactions({ filter, max: 1, time: 15000 }).catch(() => null);

    if (!collected || collected.size === 0) {
      return message.reply({ embeds: [errorEmbed('Annule (pas de confirmation).')] });
    }

    const guild = message.guild;

    for (const [, channel] of guild.channels.cache) {
      await channel.delete().catch(() => {});
    }

    const newChannel = await guild.channels.create({
      name: 'annonce',
      type: ChannelType.GuildText,
    }).catch(() => null);

    if (newChannel) {
      const embed = new EmbedBuilder()
        .setTitle('📢 On demenage !')
        .setDescription(`Venez sur **Tomioka** !\n${inviteLink}`)
        .setColor(0x3498DB);
      await newChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
