# Discord Mod Bot

Bot de moderation Discord, prefixe `&`, ecrit avec discord.js v14.

## Installation

1. Installer les dependances :
   ```
   npm install
   ```
2. Copier `.env.example` en `.env` et renseigner ton token :
   ```
   DISCORD_TOKEN=ton_token
   PREFIX=&
   ```
3. Lancer le bot :
   ```
   npm start
   ```

## Permissions du bot a activer sur le portail developpeur

- Server Members Intent
- Message Content Intent

## Commandes disponibles (prefixe `&`)

| Commande | Usage | Description |
|---|---|---|
| ban | `&ban @membre [raison]` | Bannit un membre |
| unban | `&unban <ID>` | Debannit un utilisateur |
| kick | `&kick @membre [raison]` | Expulse un membre |
| mute | `&mute @membre [duree ex: 10m] [raison]` | Rend muet (timeout) un membre |
| unmute | `&unmute @membre` | Retire le mute |
| clear | `&clear <nombre>` | Supprime des messages (1-100) |
| warn | `&warn @membre [raison]` | Ajoute un avertissement |
| rank | `&rank @membre @role` | Donne un role a un membre |
| derank | `&derank @membre @role` | Retire un role a un membre |
| permbot | `&permbot @bot @role` | Donne un role a un compte bot (admin uniquement) |
| lock | `&lock` | Verrouille le salon actuel |
| unlock | `&unlock` | Deverrouille le salon actuel |
| gw | `&gw <duree ex: 10m> <nb gagnants> <lot>` | Lance un giveaway |

## Deploiement sur Railway

Assure-toi que `package.json` est bien a la racine du depot GitHub connecte,
et ajoute la variable d'environnement `DISCORD_TOKEN` dans les Variables du service Railway.
