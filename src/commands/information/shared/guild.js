const { EmbedBuilder, ChannelType, GuildVerificationLevel } = require("discord.js");
const moment = require("moment");
const { stripIndent } = require("common-tags");

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

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`🏰 ${name}`)
    .setDescription("Comprehensive server information and statistics.")
    .addFields(
      { 
        name: "📋 Server Details", 
        value: stripIndent`
          **Server ID:** \`${id}\`
          **Server Name:** ${name}
          **Owner:** ${owner.user.username}
          **Region:** ${preferredLocale}
        `,
        inline: false 
      },
      { 
        name: `👥 Server Members [${all}]`, 
        value: stripIndent`
          **Members:** ${users}
          **Bots:** ${bots}
          
          **Online Members:** ${onlineUsers}
          **Online Bots:** ${onlineBots}
          **Total Online:** ${onlineAll}
        `,
        inline: false 
      },
      { 
        name: `📢 Channels & Categories [${totalChannels}]`, 
        value: `**Categories:** ${categories} • **Text:** ${textChannels} • **Voice:** ${voiceChannels} • **Threads:** ${threadChannels}`,
        inline: false 
      },
      { 
        name: `🎭 Roles [${rolesCount}]`, 
        value: rolesString || "No roles",
        inline: false 
      },
      { 
        name: "⚙️ Server Configuration", 
        value: stripIndent`
          **Verification Level:** ${verificationEmoji} ${verificationLevel}
          **Boost Level:** 🚀 Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount} boosts)
        `,
        inline: false 
      },
      { 
        name: "📅 Server Created", 
        value: `<t:${Math.floor(guild.createdAt.getTime() / 1000)}:F> (${createdAt.fromNow()})`,
        inline: false 
      }
    )
    .setFooter({ text: "Server Information" })
    .setTimestamp();

  if (guild.iconURL()) {
    embed.setThumbnail(guild.iconURL());
  }

  return { embeds: [embed] };
};
