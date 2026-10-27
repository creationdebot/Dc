// À mettre dans le dossier commands/
// Commande : &4c  -> envoie en boucle des pseudos de 4 caractères valides

const BATCH_SIZE = 20;  // nombre de pseudos par message
const DELAY = 3000;     // ms entre deux messages (évite le rate limit)

// Caractères autorisés dans un pseudo Discord : a-z, 0-9, _ et .
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789_.';

function genUsername(length = 4) {
  while (true) {
    let name = '';
    for (let i = 0; i < length; i++) {
      name += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    // pas de '..', ne commence/finit pas par '.'
    if (name.includes('..') || name.startsWith('.') || name.endsWith('.')) continue;
    return name;
  }
}

function genBatch() {
  const names = new Set();
  while (names.size < BATCH_SIZE) names.add(genUsername());
  return [...names].map(n => `\`${n}\``).join('\n');
}

module.exports = {
  name: '4c',
  description: 'Génère des pseudos de 4 caractères valides en boucle (&stope pour arrêter)',
  async execute(message, args, client) {
    client.fourCRunning = client.fourCRunning || new Map();
    const channel = message.channel;

    if (client.fourCRunning.has(channel.id)) {
      return message.reply('Déjà en cours ici. Utilise `&stope` pour arrêter.');
    }

    await channel.send('Génération lancée ! `&stope` pour arrêter.');
    const interval = setInterval(() => {
      channel.send(genBatch()).catch(() => {});
    }, DELAY);
    client.fourCRunning.set(channel.id, interval);
  },
};
