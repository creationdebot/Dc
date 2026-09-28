const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');
const { hasPermission, errorEmbed, successEmbed } = require('../utils');

const paypalPath = path.join(__dirname, '..', 'paypal.json');

function loadPaypal() {
  if (!fs.existsSync(paypalPath)) fs.writeFileSync(paypalPath, '{}');
  return JSON.parse(fs.readFileSync(paypalPath, 'utf8'));
}

function savePaypal(data) {
  fs.writeFileSync(paypalPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'addppl',
  description: 'Enregistre le lien PayPal a envoyer avec la commande &ppl.',
  usage: '&addppl <lien_paypal>',
  async execute(message, args) {
    if (!hasPermission(message, PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [errorEmbed('Seul un administrateur peut enregistrer le lien PayPal.')] });
    }

    const link = args[0];
    if (!link) {
      return message.reply({ embeds: [errorEmbed('Usage : `&addppl <lien_paypal>`')] });
    }

    if (!/^https:\/\/(www\.)?(paypal\.me|paypal\.com)\//i.test(link)) {
      return message.reply({ embeds: [errorEmbed('Ce lien ne semble pas etre un lien PayPal valide (il doit commencer par `https://paypal.me/` ou `https://paypal.com/`).')] });
    }

    const data = loadPaypal();
    data[message.guild.id] = link;
    savePaypal(data);

    return message.reply({ embeds: [successEmbed('Lien PayPal enregistre. Utilise `&ppl` pour l\'envoyer.')] });
  },
};
