// commands/reglement.js : -règlement [#salon]
// Poste le règlement du serveur Tomioka (embed).
// Si tu mentionnes un salon (ex : -règlement #chat), un bouton qui y mène est ajouté en dessous.
const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits,
} = require('discord.js');

const REGLEMENT = `↪ • **Règlement :** 🛡️
Merci de lire attentivement les règles appliquées sur notre serveur afin de garantir un espace agréable et sécurisé pour tous.

↪ **Salons Vocaux :** 🎀

Il est strictement interdit de diffuser des contenus sensibles, choquants ou pouvant heurter la sensibilité des membres.
L’utilisation de soundboards ou tout autre dispositif sonore perturbateur est interdite.
Toute infraction sera sanctionnée immédiatement.

↪ **Équipe Tomioka :** 🧸

Notre équipe de staff se mobilise chaque jour pour vous offrir un cadre convivial et respectueux. Merci de respecter leur travail et leurs décisions.
Si vous estimez qu’une sanction est injustifiée, vous pouvez ouvrir un ticket dans le salon dédié. Nous traiterons votre demande dans les meilleurs délais.

Toute attitude provocatrice ou irrespectueuse envers un membre de l’équipe entraînera une sanction adaptée.

↪ **Salons Textuels :** 💭

Tout propos **raciste, homophobe, sexiste, discriminatoire ou blasphématoire** est formellement **interdit** et sera sévèrement **sanctionné.**
La divulgation de données personnelles est **interdite.** Ne communiquez jamais d’informations privées et méfiez-vous des liens suspects en messages privés.

↪ **Le contenu NSFW :** ✨

Toutes images, vidéos, textes explicites est interdit, aussi bien dans les salons écrits que vocaux.
Le spam, sous toutes ses formes (messages répétitifs, flood, publicité non autorisée) sera **sanctionné.** 🔮

📌 Merci de prendre connaissance et de respecter ce règlement afin de préserver la bonne ambiance du serveur !
**L’équipe Tomioka** vous souhaite un excellent moment parmi nous !`;

module.exports = {
  name: 'règlement',
  aliases: ['reglement'],

  async execute(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Tu dois être administrateur pour utiliser cette commande.');
    }

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setDescription(REGLEMENT);

    const payload = { embeds: [embed] };

    // Bouton vers un salon (optionnel) : -règlement #chat
    const target = message.mentions.channels.first();
    if (target) {
      const label = `Tu as terminé ta lecture ? Jette un œil au salon #${target.name}`.slice(0, 80);
      payload.components = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel(label)
            .setEmoji('➡️')
            .setURL(`https://discord.com/channels/${message.guild.id}/${target.id}`)
        ),
      ];
    }

    await message.channel.send(payload);
    await message.delete().catch(() => {});
 },
};
