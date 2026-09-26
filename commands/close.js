const { errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'close',
  description: 'Ferme le ticket dans lequel la commande est utilisee.',
  usage: '&close',
  async execute(message) {
    if (!message.channel.topic?.startsWith('ticket:')) {
      return message.reply({ embeds: [errorEmbed('Cette commande ne fonctionne que dans un salon de ticket.')] });
    }

    await message.reply({ embeds: [successEmbed('🔒 Ce ticket sera ferme dans 5 secondes dcp tg nn arrete de parler alors que le ticket ce ferme ')] });
    setTimeout(() => message.channel.delete().catch(() => {}), 5000);
  },
};
