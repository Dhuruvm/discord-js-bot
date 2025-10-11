const ContainerBuilder = require("@helpers/ContainerBuilder");
const { ChannelType, GuildVerificationLevel } = require("discord.js");
const { stripIndent } = require("common-tags");

/**
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (guild) => {
  const { name, id, preferredLocale, channels, roles, ownerId } = guild;

  const owner = await guild.members.fetch(ownerId);

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
  const rolesCount = roles.cache.size;

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

  return ContainerBuilder.serverInfo({
    title: `${guild.name} Information`,
    description: `Complete information about ${guild.name}`,
    thumbnail: guild.iconURL(),
    fields: [
      {
        name: "🏰 Guild Information",
        value: stripIndent`
          **ID:** \`${guild.id}\`
          **Name:** ${guild.name}
          **Owner:** <@${guild.ownerId}>
          **Region:** ${preferredLocale}
          **Verification:** ${verificationEmoji} ${verificationLevelText}
          **Created:** <t:${Math.floor(guild.createdAt.getTime() / 1000)}:D>
          `,
        inline: true,
      },
      {
        name: "📊 Server Statistics",
        value: stripIndent`
          **Members:** \`${all}\`
          **Channels:** \`${totalChannels}\`
          **Roles:** \`${rolesCount}\`
          **Emojis:** \`${guild.emojis.cache.size}\`
          **Boosts:** \`${guild.premiumSubscriptionCount}\`
          `,
        inline: true,
      },
      {
        name: "✨ Additional Details",
        value: stripIndent`
          **Boost Tier:** ${guild.premiumTier || "None"}
          **Active Threads:** \`${threadChannels}\`
          **Sticker Count:** \`${guild.stickers.cache.size}\`
          **Explicit Filter:** ${guild.explicitContentFilter}
          `,
        inline: true,
      }
    ],
    accentColor: 0xFFFFFF,
    buttons: []
  });
};