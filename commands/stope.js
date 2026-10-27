// À mettre dans le dossier commands/
// Commande : &stope  -> arrête la génération lancée par &4c

module.exports = {
  name: 'stope',
  description: 'Arrête la génération de pseudos lancée par &4c',
  async execute(message, args, client) {
    const running = client.fourCRunning;
    const interval = running?.get(message.channel.id);

    if (!interval) {
      return message.reply('Rien n\'est en cours dans ce salon.');
    }

    clearInterval(interval);
    running.delete(message.channel.id);
    message.reply('Génération arrêtée.');
  },
};
