const ContainerBuilder = require("@helpers/ContainerBuilder");
const { getSettings: registerGuild } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  if (!guild.available) return;
  if (!guild.members.cache.has(guild.ownerId)) await guild.fetchOwner({ cache: true }).catch(() => {});
  client.logger.log(`Guild Joined: ${guild.name} Members: ${guild.memberCount}`);
  await registerGuild(guild);

  await guild.members.fetch().catch(() => {});
  
  const humans = guild.members.cache.filter(m => !m.user.bot).size;
  const bots = guild.members.cache.filter(m => m.user.bot).size;
  const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
  const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
  const categories = guild.channels.cache.filter(c => c.type === 4).size;
  
  const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
  
  const container = ContainerBuilder.serverInfo({
    title: `🎉 New Server Joined: ${guild.name}`,
    description: `**Server ID:** ${guild.id}\n**Created:** <t:${createdTimestamp}:F>\n**Owner:** <@${guild.ownerId}> (${guild.ownerId})`,
    thumbnail: guild.iconURL({ dynamic: true }),
    fields: [
      {
        name: "👥 Members",
        value: `**Total:** ${guild.memberCount}\n**Humans:** ${humans}\n**Bots:** ${bots}`,
        inline: true,
      },
      {
        name: "📺 Channels",
        value: `**Total:** ${guild.channels.cache.size}\n**Text:** ${textChannels}\n**Voice:** ${voiceChannels}`,
        inline: true,
      },
      {
        name: "📁 Categories",
        value: `**Count:** ${categories}\n**Roles:** ${guild.roles.cache.size}\n**Emojis:** ${guild.emojis.cache.size}`,
        inline: true,
      },
      {
        name: "⚡ Boost Status",
        value: `**Level:** ${guild.premiumTier}/3\n**Boosts:** ${guild.premiumSubscriptionCount || 0}`,
        inline: true,
      },
      {
        name: "🔒 Server Info",
        value: `**Verification:** ${guild.verificationLevel}\n**Vanity URL:** ${guild.vanityURLCode || 'None'}`,
        inline: true,
      },
      {
        name: "📊 Total Servers",
        value: `**Active Servers:** ${client.guilds.cache.size}`,
        inline: true,
      }
    ],
    accentColor: parseInt(client.config.EMBED_COLORS.SUCCESS.replace('#', ''), 16),
    buttons: []
  });

  for (const ownerId of client.config.OWNER_IDS) {
    try {
      const owner = await client.users.fetch(ownerId).catch(() => null);
      if (owner) {
        await owner.send(container).catch(() => 
          client.logger.warn(`Failed to send guild join notification to owner ${ownerId}`)
        );
      }
    } catch (error) {
      client.logger.error(`Error sending DM to owner ${ownerId}:`, error);
    }
  }

  if (client.joinLeaveWebhook) {
    client.joinLeaveWebhook.send({
      username: "Join",
      avatarURL: client.user.displayAvatarURL(),
      ...container,
    }).catch(() => {});
  }
};
