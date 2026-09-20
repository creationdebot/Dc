const fs = require('fs');
const path = require('path');
const { errorEmbed, successEmbed, getTargetMember } = require('../utils');

const leashPath = path.join(__dirname, '..', 'leash.json');

function loadLeash() {
  if (!fs.existsSync(leashPath)) fs.writeFileSync(leashPath, '{}');
  return JSON.parse(fs.readFileSync(leashPath, 'utf8'));
}

function saveLeash(data) {
  fs.writeFileSync(leashPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'unlaisse',
  async execute(message, args) {
    const leash = loadLeash();
    const guildId = message.guild.id;
    leash[guildId] = leash[guildId] || {};

    let targetId = message.author.id;
    const explicitTarget = getTargetMember(message, args);
    if (explicitTarget) targetId = explicitTarget.id;

    const entry = leash[guildId][targetId];
    if (!entry) {
      return message.reply({ embeds: [errorEmbed('Cette personne n\'est pas en laisse.')] });
    }

    if (targetId !== message.author.id && entry.leaderId !== message.author.id) {
      return message.reply({ embeds: [errorEmbed('Seule la personne en laisse ou son maitre peut retirer la laisse.')] });
    }

    const member = await message.guild.members.fetch(targetId).catch(() => null);
    if (member) {
      await member.setNickname(entry.originalNick).catch(() => {});
    }

    delete leash[guildId][targetId];
    saveLeash(leash);

    return message.reply({ embeds: [successEmbed('La laisse a ete retiree, le pseudo original est restaure.')] });
  },
};
