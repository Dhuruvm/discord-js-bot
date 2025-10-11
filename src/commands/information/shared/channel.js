const ContainerBuilder = require("@helpers/ContainerBuilder");
const { ChannelType } = require("discord.js");
const { stripIndent } = require("common-tags");
const channelTypes = require("@helpers/channelTypes");

/**
 * @param {import('discord.js').GuildChannel} channel
 */
module.exports = (channel) => {
  const { id, name, parent, position, type } = channel;
  const createdAtTimestamp = Math.floor(channel.createdTimestamp / 1000);

  const fields = [
    {
      name: "📺 Channel Information",
      value: stripIndent`
      **ID:** \`${channel.id}\`
      **Name:** ${channel.name}
      **Type:** ${channelTypes[channel.type] || "Unknown"}
      **Category:** ${channel.parent || "None"}
      ${channel.topic ? `**Topic:** ${channel.topic}` : ""}
      `,
      inline: true,
    },
    {
      name: "⚙️ Channel Details",
      value: stripIndent`
      **Position:** \`${channel.position}\`
      **Created:** <t:${createdAtTimestamp}:D>
      ${channel.nsfw !== undefined ? `**NSFW:** ${channel.nsfw ? "Yes" : "No"}` : ""}
      ${channel.type === ChannelType.GuildText ? `**Rate Limit:** \`${channel.rateLimitPerUser}s\`` : ""}
      `,
      inline: true,
    }
  ];

  if (type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice) {
    fields.push({
      name: "🔊 Voice Details",
      value: stripIndent`
      **Bitrate:** ${channel.bitrate}
      **User Limit:** ${channel.userLimit || "Unlimited"}
      **Full:** ${channel.full ? "Yes" : "No"}
      `,
      inline: true,
    });
  }

  if (type === ChannelType.GuildPublicThread || type === ChannelType.GuildPrivateThread) {
    fields.push({
      name: "🧵 Thread Details",
      value: stripIndent`
      **Owner:** <@${channel.ownerId}>
      **Archived:** ${channel.archived ? "Yes" : "No"}
      **Locked:** ${channel.locked ? "Yes" : "No"}
      `,
      inline: true,
    });
  }

  return ContainerBuilder.serverInfo({
    title: `${channel.name} Information`,
    description: `Channel details for ${channel.name}`,
    thumbnail: null,
    fields,
    accentColor: 0xFFFFFF,
    buttons: []
  });
};