const { EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../utils');

module.exports = {
  name: 'claim',
  description: 'S\'attribue le ticket dans lequel la commande est utilisee. Renomme le salon et indique qui l\'a pris en charge.',
  usage: '&claim',
  async execute(message) {
    if (!message.channel.topic?.startsWith('ticket:')) {
      return message.reply({ embeds: [errorEmbed('Cette commande ne fonctionne que dans un salon de ticket.')] });
    }

    const currentName = message.channel.name;
    const baseName = currentName.replace(/^claim-/, '');
    const newName = `claim-${message.author.username}`.toLowerCase().slice(0, 90);

    await message.channel.setName(newName).catch(() => {});

    const embed = new EmbedBuilder()
      .setTitle('🙋 deja pris wlh ')
      .setDescription(`je l'ai pris casse toi nn 🦧🐕 **${message.author.username}**.`)
      .setColor(0x2ECC71);

    return message.channel.send({ embeds: [embed] });
  },
};
