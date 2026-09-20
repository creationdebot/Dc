const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Liste des commandes')
      .setColor(0x3498DB)
      .setDescription('Voici toutes les commandes disponibles (prefixe `&`) :')
      .addFields(
        { name: '🔨 Moderation', value:
          '`ban` `unban` `kick` `mute` `unmute` `warn` `clear`', inline: false },
        { name: '🎭 Roles', value:
          '`rank` `derank` `permbot`', inline: false },
        { name: '🔒 Salon', value:
          '`lock` `unlock`', inline: false },
        { name: '🎉 Divers', value:
          '`gw` (giveaway) `setprefix`', inline: false },
      )
      .setFooter({ text: 'Tape &help <commande> pour plus de details sur une commande specifique.' });

    // Details commande specifique
    const details = {
      ban: 'Usage : `&ban @membre [raison]`\nBannit un membre du serveur.',
      unban: 'Usage : `&unban <ID>`\nDebannit un utilisateur via son ID.',
      kick: 'Usage : `&kick @membre [raison]`\nExpulse un membre du serveur.',
      mute: 'Usage : `&mute @membre [duree ex: 10m] [raison]`\nRend muet un membre (timeout Discord).',
      unmute: 'Usage : `&unmute @membre`\nRetire le mute d\'un membre.',
      warn: 'Usage : `&warn @membre [raison]`\nAjoute un avertissement a un membre.',
      clear: 'Usage : `&clear <nombre>`\nSupprime entre 1 et 100 messages.',
      rank: 'Usage : `&rank @membre @role`\nDonne un role a un membre.',
      derank: 'Usage : `&derank @membre @role`\nRetire un role a un membre.',
      permbot: 'Usage : `&permbot @bot @role`\nDonne un role a un compte bot (admin uniquement).',
      lock: 'Usage : `&lock`\nVerrouille le salon actuel (personne ne peut ecrire).',
      unlock: 'Usage : `&unlock`\nDeverrouille le salon actuel.',
      gw: 'Usage : `&gw <duree ex: 10m/1h/1d> <nb gagnants> <lot>`\nLance un giveaway avec reaction 🎉.',
      setprefix: 'Usage : `&setprefix <nouveau_prefixe>`\nChange le prefixe du bot pour ce serveur (admin uniquement).',
    };

    const query = args[0]?.toLowerCase();
    if (query && details[query]) {
      const detailEmbed = new EmbedBuilder()
        .setTitle(`📖 Commande : ${query}`)
        .setColor(0x3498DB)
        .setDescription(details[query]);
      return message.reply({ embeds: [detailEmbed] });
    }

    return message.reply({ embeds: [embed] });
  },
};
