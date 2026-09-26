const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { hasPermission, errorEmbed } = require('../utils');

module.exports = {
  name: 'boost',
  description: 'Affiche la liste des boosters du serveur dans le salon choisi.',
  usage: '&boost #salon',
  async execute(message) {
    if (!hasPermission(message, PermissionsBitField.Flags.ManageGuild)) {
      return message.reply({ embeds: [errorEmbed('Tu n\'as pas la permission de faire ca.')] });
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply({ embeds: [errorEmbed('Usage : `&boost #salon`')] });
    }

    const guild = message.guild;
    await guild.members.fetch();

    const boosters = guild.members.cache
      .filter(m => m.premiumSince)
      .sort((a, b) => a.premiumSince - b.premiumSince);

    const embed = new EmbedBuilder()
      .setTitle(`🚀 Boosts de ${guild.name}`)
      .setColor(0xF47FFF)
      .addFields(
        { name: 'Nombre total de boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
        { name: 'Niveau du serveur', value: `Niveau ${guild.premiumTier}`, inline: true },
      );

    if (boosters.size === 0) {
      embed.addFields({ name: 'Boosters', value: 'Aucun booster pour le moment.' });
    } else {
      const list = boosters.map(m => `**${m.user.tag}** - depuis <t:${Math.floor(m.premiumSince.getTime() / 1000)}:D>`).join('\n');
      embed.addFields({ name: `Boosters (${boosters.size})`, value: list.slice(0, 1024) });
    }

    await channel.send({ embeds: [embed] });
    return message.reply(`Liste des boosts envoyee dans ${channel}.`);
  },
};
