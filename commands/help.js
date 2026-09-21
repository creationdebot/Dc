const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  async execute(message, args, client) {
    const uniqueCommands = [...new Map(client.commands.map(cmd => [cmd.name, cmd])).values()];
    uniqueCommands.sort((a, b) => a.name.localeCompare(b.name));

    const query = args[0]?.toLowerCase();

    if (query) {
      const command = client.commands.get(query);
      if (!command) {
        return message.reply(`Commande \`${query}\` introuvable. Tape \`&help\` pour voir la liste complete.`);
      }

      const detailEmbed = new EmbedBuilder()
        .setTitle(`📖 Commande : ${command.name}`)
        .setColor(0x3498DB)
        .setDescription(command.description || 'Pas de description detaillee pour cette commande.')
        .addFields({ name: 'Usage', value: `\`${command.usage || `&${command.name}`}\`` });

      if (command.aliases?.length) {
        detailEmbed.addFields({ name: 'Alias', value: command.aliases.map(a => `\`${a}\``).join(', ') });
      }

      return message.reply({ embeds: [detailEmbed] });
    }

    const commandList = uniqueCommands.map(cmd => `\`${cmd.name}\``).join(' ');

    const embed = new EmbedBuilder()
      .setTitle('📖 Liste des commandes')
      .setColor(0x3498DB)
      .setDescription(
        `Voici toutes les commandes actuellement disponibles (prefixe \`&\`) :\n\n${commandList}\n\n` +
        'Tape `&help <commande>` pour voir les details d\'une commande precise.'
      )
      .setFooter({ text: `${uniqueCommands.length} commande(s) chargee(s)` });

    return message.reply({ embeds: [embed] });
  },
};
