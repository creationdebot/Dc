const { errorEmbed, successEmbed } = require('../utils');

module.exports = {
  name: 'subscribe',
  aliases: ['sub'],
  // Usage : &subscribe @role  -> le membre prend ou quitte ce role lui-meme
  async execute(message, args) {
    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[0]) ||
      message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());

    if (!role) {
      return message.reply({ embeds: [errorEmbed('Mentionne, donne l\'ID ou le nom exact du role a prendre/quitter.')] });
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({ embeds: [errorEmbed('Je ne peux pas gerer ce role (trop haut).')] });
    }

    const member = message.member;
    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      return message.reply({ embeds: [successEmbed(`Tu as quitte le role **${role.name}**.`)] });
    }

    await member.roles.add(role);
    return message.reply({ embeds: [successEmbed(`Tu as pris le role **${role.name}**.`)] });
  },
};
