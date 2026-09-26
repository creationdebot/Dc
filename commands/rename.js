const { errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'rename',
  description: 'Renomme le ticket dans lequel la commande est utilisee.',
  usage: '&rename <nouveau_nom>',
  async execute(message, args) {
    if (!message.channel.topic?.startsWith('ticket:')) {
      return message.reply({ embeds: [errorEmbed('Cette commande ne fonctionne que dans un salon de ticket.')] });
    }

    const newName = args.join('-').toLowerCase().slice(0, 90);
    if (!newName) {
      return message.reply({ embeds: [errorEmbed('Usage : `&rename <nouveau_nom>`')] });
    }

    await message.channel.setName(newName).catch(() => {});
    return message.reply({ embeds: [successEmbed(`Le ticket a ete renomme en **${newName}**.`)] });
  },
};
