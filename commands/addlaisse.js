const fs = require('fs');
const path = require('path');
const { errorEmbed, successEmbed, getTargetMember } = require('../utils');

const configPath = path.join(__dirname, '..', 'leashrole.json');
const leashPath = path.join(__dirname, '..', 'leash.json');

function loadConfig() {
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function loadLeash() {
  if (!fs.existsSync(leashPath)) fs.writeFileSync(leashPath, '{}');
  return JSON.parse(fs.readFileSync(leashPath, 'utf8'));
}

function saveLeash(data) {
  fs.writeFileSync(leashPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'addlaisse',
  async execute(message, args) {
    const target = getTargetMember(message, args);
    if (!target) {
      return message.reply({ embeds: [errorEmbed('Mentionne ou donne l\'ID de la personne a mettre en laisse.')] });
    }

    if (target.id === message.author.id) {
      return message.reply({ embeds: [errorEmbed('Tu ne peux pas te mettre toi-meme en laisse.')] });
    }

    const config = loadConfig();
    const consentRoleId = config[message.guild.id];
    if (!consentRoleId) {
      return message.reply({ embeds: [errorEmbed('Aucun role de consentement configure. Un admin doit d\'abord faire `&acclaisse @role`.')] });
    }

    if (!target.roles.cache.has(consentRoleId)) {
      return message.reply({ embeds: [errorEmbed(`**${target.user.tag}** n'a pas pris le role de consentement pour la laisse. Il doit d'abord l'accepter lui-meme.`)] });
    }

    if (!target.manageable) {
      return message.reply({ embeds: [errorEmbed('Je ne peux pas changer le pseudo de ce membre (role trop haut ?).')] });
    }

    const leash = loadLeash();
    const guildId = message.guild.id;
    leash[guildId] = leash[guildId] || {};

    if (leash[guildId][target.id]) {
      return message.reply({ embeds: [errorEmbed(`**${target.user.tag}** est deja en laisse.`)] });
    }

    const originalNick = target.nickname;
    await target.setNickname(`🐕 ${message.author.username}`).catch(() => {});

    leash[guildId][target.id] = {
      leaderId: message.author.id,
      originalNick: originalNick || null,
    };
    saveLeash(leash);

    return message.reply({
      embeds: [successEmbed(`**${target.user.tag}** est maintenant en laisse chez **${message.author.username}**. Il te suivra en vocal. Il peut taper \`&unlaisse\` a tout moment pour se liberer.`)],
    });
  },
};
