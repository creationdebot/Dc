// commands/staff.js : choisir quels rôles voient chaque type de ticket (sans ID)
//   -staff animation @Animateurs      -> les animateurs voient les tickets animation
//   -staff owner @Owners
//   -staff partenariat @Partenariat
//   -staff animation retirer @Role    -> retire ce rôle
//   -staff animation reset            -> vide la liste
//   -staff                            -> affiche la configuration
const fs = require('fs');
const path = require('path');
const { PermissionFlagsBits } = require('discord.js');

const STAFF_FILE = path.join(__dirname, '..', 'staff-roles.json');
const TYPES = ['owner', 'partenariat', 'animation'];

function load() {
  if (!fs.existsSync(STAFF_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(STAFF_FILE, 'utf8')); } catch { return {}; }
}
const save = (d) => fs.writeFileSync(STAFF_FILE, JSON.stringify(d, null, 2));

function normalizeType(raw) {
  const t = (raw || '').toLowerCase();
  if (t.startsWith('own')) return 'owner';
  if (t.startsWith('part')) return 'partenariat';
  if (t.startsWith('anim')) return 'animation';
  return null;
}

module.exports = {
  name: 'staff',
  aliases: [],

  async execute(message, args) {
    try {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('Tu dois être administrateur pour utiliser cette commande.');
      }

      const data = load();

      // Affichage
      if (!args || args.length === 0) {
        const lines = TYPES.map((t) => {
          const roles = (data[t] || []).map((id) => `<@&${id}>`).join(' ') || '_aucun_';
          return `**${t}** : ${roles}`;
        });
        return message.reply(
          lines.join('\n') +
          '\n\nUtilisation : `-staff animation @Role`, `-staff animation retirer @Role`, `-staff animation reset`'
        );
      }

      const type = normalizeType(args[0]);
      if (!type) {
        return message.reply('Type inconnu. Choisis : `owner`, `partenariat` ou `animation`.');
      }

      const sub = args[1]?.toLowerCase();
      data[type] = data[type] || [];

      if (sub === 'reset') {
        data[type] = [];
        save(data);
        return message.reply(`✅ Liste **${type}** vidée.`);
      }

      const role = message.mentions.roles.first();
      if (!role) {
        return message.reply('Mentionne le rôle : `-staff animation @Animateurs`');
      }

      if (sub === 'retirer' || sub === 'remove') {
        data[type] = data[type].filter((id) => id !== role.id);
        save(data);
        return message.reply(`✅ ${role.name} ne voit plus les tickets **${type}**.`);
      }

      if (!data[type].includes(role.id)) data[type].push(role.id);
      save(data);
      return message.reply(
        `✅ Le rôle **${role.name}** verra désormais les tickets **${type}** (les nouveaux tickets, pas ceux déjà ouverts).`
      );
    } catch (err) {
      console.error('Erreur -staff :', err);
      await message.reply(`❌ Erreur : \`${err.message}\``).catch(() => {});
    }
  },
};
