// commands/verif.js : vérification par réaction
// &verif @role  -> poste le message. Réagir avec ✅ donne le rôle, retirer la réaction le retire.
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const EMOJI = '✅';
const CONFIG_PATH = path.join(__dirname, '..', 'verif.json');

function load() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
}
const save = (data) => fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));

async function handleReaction(reaction, user, add) {
  if (user.bot) return;
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
  } catch {
    return;
  }

  const guild = reaction.message.guild;
  if (!guild) return;

  const cfg = load()[guild.id];
  if (!cfg || cfg.messageId !== reaction.message.id) return;
  if (reaction.emoji.name !== EMOJI) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  try {
    if (add) await member.roles.add(cfg.roleId);
    else await member.roles.remove(cfg.roleId);
  } catch (e) {
    console.error('Vérification : impossible de modifier le rôle :', e.message);
  }
}

let initialized = false;
function init(client) {
  if (initialized) return;
  initialized = true;
  client.on('messageReactionAdd', (r, u) => handleReaction(r, u, true).catch(console.error));
  client.on('messageReactionRemove', (r, u) => handleReaction(r, u, false).catch(console.error));
}

module.exports = {
  name: 'verif',
  aliases: ['verification'],
  init,

  async execute(message, args, client) {
    init(client || message.client);

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Tu dois être administrateur pour utiliser cette commande.');
    }

    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args?.[0]);
    if (!role) {
      return message.reply('Utilisation : `&verif @role` (le rôle donné quand on réagit)');
    }

    const botMember = message.guild.members.me;
    if (role.position >= botMember.roles.highest.position) {
      return message.reply('⚠️ Le rôle du bot doit être **au-dessus** de ce rôle dans la liste des rôles du serveur.');
    }

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('Vérification')
      .setDescription(`Réagis avec ${EMOJI} sur ce message pour obtenir l'accès au serveur.`)
      .setFooter({ text: `Réagis avec ${EMOJI} pour valider` });

    const sent = await message.channel.send({ embeds: [embed] });
    await sent.react(EMOJI);

    const data = load();
    data[message.guild.id] = { channelId: message.channel.id, messageId: sent.id, roleId: role.id };
    save(data);

    await message.delete().catch(() => {});
 },
};
