require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');

const DEFAULT_PREFIX = process.env.PREFIX || '&';
const prefixPath = path.join(__dirname, 'prefixes.json');

function getPrefix(guildId) {
  if (!fs.existsSync(prefixPath)) return DEFAULT_PREFIX;
  const prefixes = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
  return prefixes[guildId] || DEFAULT_PREFIX;
}

const buyersPath = path.join(__dirname, 'buyers.json');

function isAuthorized(message) {
  if (message.member.permissions.has('Administrator')) return true;
  if (message.guild.ownerId === message.author.id) return true;

  if (!fs.existsSync(buyersPath)) return false;
  const buyers = JSON.parse(fs.readFileSync(buyersPath, 'utf8'));
  const guildBuyers = buyers[message.guild.id] || [];
  return guildBuyers.includes(message.author.id);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command?.name) {
    client.commands.set(command.name, command);
    if (command.aliases) {
      for (const alias of command.aliases) client.commands
