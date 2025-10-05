const { EmbedBuilder, ChannelType, GuildVerificationLevel, MessageFlags, ComponentType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const moment = require("moment");

/**
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (guild) => {
  const { name, id, preferredLocale, channels, roles, ownerId } = guild;

  const owner = await guild.members.fetch(ownerId);
  const createdAt = moment(guild.createdAt);

  const totalChannels = channels.cache.size;
  const categories = channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;
  const textChannels = channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
  const voiceChannels = channels.cache.filter(
    (c) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice
  ).size;
  const threadChannels = channels.cache.filter(
    (c) => c.type === ChannelType.PrivateThread || c.type === ChannelType.PublicThread
  ).size;

  const memberCache = guild.members.cache;
  const all = memberCache.size;
  const bots = memberCache.filter((m) => m.user.bot).size;
  const users = all - bots;
  const onlineUsers = memberCache.filter((m) => !m.user.bot && m.presence?.status === "online").size;
  const onlineBots = memberCache.filter((m) => m.user.bot && m.presence?.status === "online").size;
  const onlineAll = onlineUsers + onlineBots;
  const rolesCount = roles.cache.size;

  const getMembersInRole = (members, role) => {
    return members.filter((m) => m.roles.cache.has(role.id)).size;
  };

  let rolesString = roles.cache
    .filter((r) => !r.name.includes("everyone"))
    .map((r) => `${r.name}[${getMembersInRole(memberCache, r)}]`)
    .join(", ");

  if (rolesString.length > 1024) rolesString = rolesString.substring(0, 1020) + "...";

  let { verificationLevel } = guild;
  switch (guild.verificationLevel) {
    case GuildVerificationLevel.VeryHigh:
      verificationLevel = "┻�?┻ミヽ(ಠ益ಠ)ノ彡┻�?┻";
      break;

    case GuildVerificationLevel.High:
      verificationLevel = "(╯°□°）╯︵ ┻�?┻";
      break;

    default:
      break;
  }

  const verificationEmoji = {
    [GuildVerificationLevel.None]: "📭",
    [GuildVerificationLevel.Low]: "📬",
    [GuildVerificationLevel.Medium]: "📮",
    [GuildVerificationLevel.High]: "📯",
    [GuildVerificationLevel.VeryHigh]: "🔒"
  }[guild.verificationLevel] || "📋";

  const container = {
    type: ComponentType.Container,
    accent_color: 0x5865F2,
    components: [
      // Header Section
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `# 🏰 ${name}\n\nComprehensive server information and statistics.`
          }
        ],
        accessory: guild.iconURL() ? {
          type: ComponentType.Thumbnail,
          media: { url: guild.iconURL() },
          description: `${name} Server Icon`
        } : undefined
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },
      
      // Basic Info Section
      {
        type: ComponentType.TextDisplay,
        content: `### 📋 Server Details\n\n**Server ID:** \`${id}\`\n**Server Name:** ${name}\n**Owner:** ${owner.user.username}\n**Region:** ${preferredLocale}`
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },
      
      // Members Section
      {
        type: ComponentType.TextDisplay,
        content: `### 👥 Server Members [${all}]\n\n**Members:** ${users}\n**Bots:** ${bots}\n\n**Online Members:** ${onlineUsers}\n**Online Bots:** ${onlineBots}\n**Total Online:** ${onlineAll}`
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },
      
      // Channels Section
      {
        type: ComponentType.TextDisplay,
        content: `### 📢 Channels & Categories [${totalChannels}]\n\n**Categories:** ${categories} • **Text:** ${textChannels} • **Voice:** ${voiceChannels} • **Threads:** ${threadChannels}`
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },
      
      // Roles Section
      {
        type: ComponentType.TextDisplay,
        content: `### 🎭 Roles [${rolesCount}]\n\n${rolesString}`
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },
      
      // Server Stats Section
      {
        type: ComponentType.TextDisplay,
        content: `### ⚙️ Server Configuration\n\n**Verification Level:** ${verificationEmoji} ${verificationLevel}\n**Boost Level:** 🚀 Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount} boosts)`
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },
      
      // Creation Date Section
      {
        type: ComponentType.TextDisplay,
        content: `### 📅 Server Created\n\n<t:${Math.floor(guild.createdAt.getTime() / 1000)}:F> (${createdAt.fromNow()})`
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: false,
        spacing: 1
      },
      
      // Footer
      {
        type: ComponentType.TextDisplay,
        content: `*Server Information* • <t:${Math.floor(Date.now() / 1000)}:R>`
      }
    ]
  };

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
};
