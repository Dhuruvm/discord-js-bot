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

  let verificationLevelText = guild.verificationLevel;
  switch (guild.verificationLevel) {
    case GuildVerificationLevel.VeryHigh:
      verificationLevelText = "┻?┻ミヽ(ಠ益ಠ)ノ彡┻?┻";
      break;

    case GuildVerificationLevel.High:
      verificationLevelText = "(╯°□°）╯︵ ┻?┻";
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
    .setColor(0xFFFFFF)
    .setAuthor({ 
      name: `${guild.name} Information`,
      iconURL: guild.iconURL()
    })
    .setThumbnail(guild.iconURL())
    .addFields(
      {
        name: "### Guild Information",
        value: stripIndent`
          > **ID:** \`${guild.id}\`
          > **Name:** ${guild.name}
          > **Owner:** <@${guild.ownerId}>
          > **Region:** ${preferredLocale}
          > **Verification:** ${verificationEmoji} ${verificationLevelText}
          > **Created:** <t:${Math.floor(guild.createdAt.getTime() / 1000)}:D>
          `,
        inline: true,
      },
      {
        name: "### Server Statistics",
        value: stripIndent`
          > **Members:** \`${all}\`
          > **Channels:** \`${totalChannels}\`
          > **Roles:** \`${rolesCount}\`
          > **Emojis:** \`${guild.emojis.cache.size}\`
          > **Boosts:** \`${guild.premiumSubscriptionCount}\`
          `,
        inline: true,
      },
      {
        name: "### Additional Details",
        value: stripIndent`
          > **Boost Tier:** ${guild.premiumTier || "None"}
          > **Active Threads:** \`${threadChannels}\`
          > **Sticker Count:** \`${guild.stickers.cache.size}\`
          > **Explicit Filter:** ${guild.explicitContentFilter}
          `,
        inline: true,
      }
    )
    .setFooter({ text: "Powered by Blackbit Studio" })
    .setTimestamp();

  return { embeds: [embed] };
};