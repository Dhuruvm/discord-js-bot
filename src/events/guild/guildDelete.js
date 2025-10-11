const ContainerBuilder = require("@helpers/ContainerBuilder");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  if (!guild.available) return;
  client.logger.log(`Guild Left: ${guild.name} Members: ${guild.memberCount}`);

  const settings = await getSettings(guild);
  const leftTimestamp = Math.floor(Date.now() / 1000);
  settings.data.leftAt = new Date();
  await settings.save();

  let ownerTag;
  const ownerId = guild.ownerId || settings.data.owner;
  try {
    const owner = await client.users.fetch(ownerId);
    ownerTag = owner.tag;
  } catch (err) {
    ownerTag = "Deleted User";
  }

  // Gather comprehensive server information
  const humans = guild.members.cache.filter(m => !m.user.bot).size;
  const bots = guild.members.cache.filter(m => m.user.bot).size;
  const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
  const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
  const categories = guild.channels.cache.filter(c => c.type === 4).size;
  const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);

  // Calculate how long the bot was in the server
  const joinedAt = settings.data.joinedAt || guild.joinedAt;
  const joinedTimestamp = joinedAt ? Math.floor(new Date(joinedAt).getTime() / 1000) : null;
  const durationInServer = joinedTimestamp 
    ? Math.floor((Date.now() - new Date(joinedAt).getTime()) / 1000)
    : null;
  
  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.length > 0 ? parts.join(' ') : 'Just now';
  };

  const container = ContainerBuilder.serverInfo({
    title: `👋 Server Left`,
    description: `**${guild.name || "Unknown Server"}**\n\`${guild.id}\`\n\n**Left:** <t:${leftTimestamp}:R>\n**Created:** <t:${createdTimestamp}:F>${joinedTimestamp ? `\n**Joined:** <t:${joinedTimestamp}:F>` : ''}`,
    thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
    fields: [
      {
        name: "👑 Owner",
        value: `${ownerTag}\n<@${ownerId}>\n\`${ownerId}\``,
        inline: true,
      },
      {
        name: "👥 Members",
        value: `**Total:** ${guild.memberCount}\n**Humans:** ${humans}\n**Bots:** ${bots}`,
        inline: true,
      },
      {
        name: "📺 Channels",
        value: `**Total:** ${guild.channels.cache.size}\n**Text:** ${textChannels}\n**Voice:** ${voiceChannels}\n**Categories:** ${categories}`,
        inline: true,
      },
      {
        name: "📊 Server Stats",
        value: `**Roles:** ${guild.roles.cache.size}\n**Emojis:** ${guild.emojis.cache.size}\n**Stickers:** ${guild.stickers?.cache.size || 0}`,
        inline: true,
      },
      {
        name: "⚡ Boost Status",
        value: `**Level:** ${guild.premiumTier}/3\n**Boosts:** ${guild.premiumSubscriptionCount || 0}`,
        inline: true,
      },
      {
        name: "⏱️ Duration in Server",
        value: formatDuration(durationInServer),
        inline: true,
      },
      {
        name: "🔒 Security Info",
        value: `**Verification:** ${guild.verificationLevel}\n**NSFW Level:** ${guild.nsfwLevel}\n**Explicit Filter:** ${guild.explicitContentFilter}`,
        inline: true,
      },
      {
        name: "🌍 Server Details",
        value: `**Locale:** ${guild.preferredLocale}\n**Vanity:** ${guild.vanityURLCode || 'None'}\n**Features:** ${guild.features.length}`,
        inline: true,
      },
      {
        name: "📊 Remaining Servers",
        value: `**Active Servers:** ${client.guilds.cache.size}\n**Total Users:** ${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0).toLocaleString()}`,
        inline: false,
      }
    ],
    accentColor: 0xFF0000,
    buttons: []
  });

  for (const ownerIdConfig of client.config.OWNER_IDS) {
    try {
      const owner = await client.users.fetch(ownerIdConfig).catch(() => null);
      if (owner) {
        await owner.send(container).catch(() => 
          client.logger.warn(`Failed to send guild leave notification to owner ${ownerIdConfig}`)
        );
      }
    } catch (error) {
      client.logger.error(`Error sending DM to owner ${ownerIdConfig}:`, error);
    }
  }

  if (client.joinLeaveWebhook) {
    client.joinLeaveWebhook.send({
      username: "Leave",
      avatarURL: client.user.displayAvatarURL(),
      ...container,
    }).catch(() => {});
  }
};
