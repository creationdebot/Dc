require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const DEFAULT_PREFIX = process.env.PREFIX || '&';
const prefixPath = path.join(__dirname, 'prefixes.json');

function getPrefix(guildId) {
  if (!fs.existsSync(prefixPath)) return DEFAULT_PREFIX;
  const prefixes = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
  return prefixes[guildId] || DEFAULT_PREFIX;
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
      for (const alias of command.aliases) client.commands.set(alias, command);
    }
  }
}

client.once('ready', () => {
  console.log(`Connecte en tant que ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: `${DEFAULT_PREFIX}help` }],
    status: 'online',
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const prefix = getPrefix(message.guild.id);
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply('Une erreur est survenue lors de l\'execution de cette commande.').catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);
