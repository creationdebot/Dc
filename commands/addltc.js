const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'ltc.json');

function loadData() {
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'addltc',
  aliases: [],
  async execute(message, args) {
    const texte = args.join(' ');
    if (!texte) {
      return message.reply('Merci de preciser un texte apres la commande, ex : `&addltc Mon texte ici`.');
    }

    const data = loadData();
    data[message.guild.id] = texte;
    saveData(data);

    return message.reply('✅ Texte enregistre.');
  },
};
