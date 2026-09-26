const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { getTargetMember } = require('../utils');

const statsPath = path.join(__dirname, '..', 'stats.json');

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}min`;
}

module.exports = {
  name: 'stats',
  description: 'Affiche le nombre de messages envoyes et le temps passe en vocal d\'un membre.',
  usage: '&stats [@membre]',
  async execute(message, args) {
    const target = getTargetMember(message, args) || message.member;

    if (!fs.existsSync(statsPath)) {
      return message.reply(`**${target.user.tag}** n'a pas encore de statistiques enregistrees.`);
    }

    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    const guildStats = stats[message.guild.id] || {};
    const userStats = guildStats[target.id] || { messages: 0, voiceSeconds: 0 };

    const embed = new EmbedBuilder()
      .setTitle(`📊 Statistiques de ${target.user.username}`)
      .setColor(0x3498DB)
      .setThumbnail(target.user.displayAvatarURL())
      .addFields(
        { name: '💬 Alors tu a passer combien de temps sur le meilleur serv ', value: `${userStats.messages}`, inline: true },
        { name: '🎙️ ta pas 1s de vocal t gay ', value: formatDuration(userStats.voiceSeconds || 0), inline: true },
      );

    return message.reply({ embeds: [embed] });
  },
};
