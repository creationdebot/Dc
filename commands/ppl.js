const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../utils');

const paypalPath = path.join(__dirname, '..', 'paypal.json');

module.exports = {
  name: 'ppl',
  description: 'Envoie le lien PayPal enregistre avec &addppl.',
  usage: '&ppl',
  async execute(message) {
    if (!fs.existsSync(paypalPath)) {
      return message.reply({ embeds: [errorEmbed('Aucun lien PayPal enregistre. Un admin doit d\'abord faire `&addppl <lien>`.')] });
    }

    const data = JSON.parse(fs.readFileSync(paypalPath, 'utf8'));
    const link = data[message.guild.id];

    if (!link) {
      return message.reply({ embeds: [errorEmbed('Aucun lien PayPal enregistre. Un admin doit d\'abord faire `&addppl <lien>`.')] });
    }

    const embed = new EmbedBuilder()
      .setTitle('💳 Lien PayPal')
      .setDescription(link)
      .setColor(0x0070BA);

    return message.reply({ embeds: [embed] });
  },
};
