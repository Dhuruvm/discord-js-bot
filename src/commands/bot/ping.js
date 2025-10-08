const ContainerBuilder = require("@helpers/ContainerBuilder");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ping",
  description: "Shows the current latency from the bot to Discord servers",
  category: "BOT",
  command: {
    enabled: true,
    aliases: ["pong", "latency"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async messageRun(message, args) {
    const ping = Math.floor(message.client.ws.ping);
    const status = ping < 100 ? 'Excellent 🟢' : ping < 200 ? 'Good 🟡' : 'Poor 🔴';

    const response = ContainerBuilder.quickMessage(
      "🏓 Pong!",
      `Latency measurements for ${message.client.user.username}`,
      [
        { name: "Bot Latency", value: `\`${Math.floor(message.createdTimestamp - message.createdTimestamp)}ms\``, inline: true },
        { name: "API Latency", value: `\`${Math.round(message.client.ws.ping)}ms\` - ${status}`, inline: true }
      ],
      0x5865F2
    );

    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const ping = Math.floor(interaction.client.ws.ping);
    const status = ping < 100 ? 'Excellent 🟢' : ping < 200 ? 'Good 🟡' : 'Poor 🔴';

    const response = ContainerBuilder.quickMessage(
      "🏓 Pong!",
      `Latency measurements for ${interaction.client.user.username}`,
      [
        { name: "Bot Latency", value: `\`${Math.floor(interaction.createdTimestamp - interaction.createdTimestamp)}ms\``, inline: true },
        { name: "API Latency", value: `\`${Math.round(interaction.client.ws.ping)}ms\` - ${status}`, inline: true }
      ],
      0x5865F2
    );

    await interaction.followUp(response);
  },
};