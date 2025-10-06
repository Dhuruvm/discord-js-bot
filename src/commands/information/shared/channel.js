const { EmbedBuilder, ChannelType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { stripIndent } = require("common-tags");
const channelTypes = require("@helpers/channelTypes");

/**
 * @param {import('discord.js').GuildChannel} channel
 */
module.exports = (channel) => {
  const { id, name, parent, position, type } = channel;

  let desc = stripIndent`
      ❯ ID: **${id}**
      ❯ Name: **${name}**
      ❯ Type: **${channelTypes(channel.type)}**
      ❯ Category: **${parent || "NA"}**\n
      `;

  if (type === ChannelType.GuildText) {
    const { rateLimitPerUser, nsfw } = channel;
    desc += stripIndent`
      ❯ Topic: **${channel.topic || "No topic set"}**
      ❯ Position: **${position}**
      ❯ Slowmode: **${rateLimitPerUser}**
      ❯ isNSFW: **${nsfw ? "✓" : "✕"}**\n
      `;
  }

  if (type === ChannelType.GuildPublicThread || type === ChannelType.GuildPrivateThread) {
    const { ownerId, archived, locked } = channel;
    desc += stripIndent`
      ❯ Owner Id: **${ownerId}**
      ❯ Is Archived: **${archived ? "✓" : "✕"}**
      ❯ Is Locked: **${locked ? "✓" : "✕"}**\n
      `;
  }

  if (type === ChannelType.GuildNews || type === ChannelType.GuildNewsThread) {
    const { nsfw } = channel;
    desc += stripIndent`
      ❯ isNSFW: **${nsfw ? "✓" : "✕"}**\n
      `;
  }

  if (type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice) {
    const { bitrate, userLimit, full } = channel;
    desc += stripIndent`
      ❯ Position: **${position}**
      ❯ Bitrate: **${bitrate}**
      ❯ User Limit: **${userLimit}**
      ❯ isFull: **${full ? "✓" : "✕"}**\n
      `;
  }

  const embed = new EmbedBuilder()
    .setColor(0xFFFFFF)
    .setAuthor({ 
      name: `${channel.name} Information`,
      iconURL: channel.guild.iconURL()
    })
    .addFields(
      {
        name: "### Channel Information",
        value: stripIndent`
        > **ID:** \`${channel.id}\`
        > **Name:** ${channel.name}
        > **Type:** ${channelTypes[channel.type]}
        > **Category:** ${channel.parent || "None"}
        > **Topic:** ${channel.topic || "No topic set"}
        `,
        inline: true,
      },
      {
        name: "### Channel Details",
        value: stripIndent`
        > **Position:** \`${channel.position}\`
        > **Created:** <t:${createdAtTimestamp}:D>
        > **NSFW:** ${channel.nsfw ? "Yes" : "No"}
        ${channel.type === ChannelType.GuildText ? `> **Rate Limit:** \`${channel.rateLimitPerUser}s\`` : ""}
        `,
        inline: true,
      }
    )
    .setFooter({ text: "Powered by Blackbit Studio" });

  return { embeds: [embed] };
};