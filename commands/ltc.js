const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'ltc.json');

function loadData() {
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

module.exports = {
  name: 'ltc',
  aliases: [],
  async execute(message) {
    const data = loadData();
    const texte = data[message.guild.id];

    if (!texte) {
      return message.reply('Aucun texte n\'a encore ete enregistre avec `&addltc`.');
    }

    return message.channel.send(texte);
  },
};
