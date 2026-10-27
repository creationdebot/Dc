// À mettre dans le dossier commands/
// &4c        -> pseudos de 4 caractères au hasard
// &4c rare   -> pseudos avec au moins un _ ou un . (moins souvent pris)

const BATCH_SIZE = 20;  // nombre de pseudos par message
const DELAY = 3000;     // ms entre deux messages (évite le rate limit)

const ALNUM = 'abcdefghijklmnopqrstuvwxyz0123456789';
const CHARS = ALNUM + '_.';

function isValid(name) {
  // pas de '..', ne commence/finit pas par '.'
  return !(name.includes('..') || name.startsWith('.') || name.endsWith('.'));
}

function pick(str) {
  return str[Math.floor(Math.random() * str.length)];
}

function genUsername(rare) {
  while (true) {
    let chars = [];
    for (let i = 0; i < 4; i++) chars.push(pick(rare ? ALNUM : CHARS));

    if (rare) {
      // insère 1 ou 2 caractères spéciaux à des positions aléatoires
      const count = Math.random() < 0.7 ? 1 : 2;
      for (let k = 0; k < count; k++) {
        chars[Math.floor(Math.random() * 4)] = pick('_.');
      }
    }

    const name = chars.join('');
    if (isValid(name)) return name;
  }
}

function genBatch(rare) {
  const names = new Set();
  while (names.size < BATCH_SIZE) names.add(genUsername(rare));
  return [...names].map(n => `\`${n}\``).join('\n');
}

module.exports = {
  name: '4c',
  description: 'Génère des pseudos de 4 caractères valides en boucle (&stope pour arrêter)',
  async execute(message, args, client) {
    client.fourCRunning = client.fourCRunning || new Map();
    const channel = message.channel;
    const rare = (args[0] || '').toLowerCase() === 'rare';

    if (client.fourCRunning.has(channel.id)) {
      return message.reply('Déjà en cours ici. Utilise `&stope` pour arrêter.');
    }

    await channel.send(`Génération ${rare ? '(mode rare) ' : ''}lancée ! \`&stope\` pour arrêter.`);
    const interval = setInterval(() => {
      channel.send(genBatch(rare)).catch(() => {});
    }, DELAY);
    client.fourCRunning.set(channel.id, interval);
  },
};
