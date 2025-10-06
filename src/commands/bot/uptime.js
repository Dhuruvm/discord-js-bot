const { timeformat } = require("@helpers/Utils");
const ModernEmbed = require("@structures/ModernEmbed");
const { EmbedBuilder } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "uptime",
  description: "Shows bot uptime",
  category: "BOT",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [],
  },

  async messageRun(message, args) {
    const client = message.client;
    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setAuthor({
        name: "Uptime Information",
        iconURL: client.user.displayAvatarURL()
      })
      .setDescription(
        `### Bot Uptime\n` +
        `> **Current Uptime:** \`${timeformat(process.uptime())}\`\n` +
        `> **Started:** <t:${parseInt(client.readyTimestamp / 1000)}:R>`
      )
      .setFooter({ text: "Powered by Blackbit Studio" });
    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const client = interaction.client;
    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setAuthor({
        name: "Uptime Information",
        iconURL: client.user.displayAvatarURL()
      })
      .setDescription(
        `### Bot Uptime\n` +
        `> **Current Uptime:** \`${timeformat(process.uptime())}\`\n` +
        `> **Started:** <t:${parseInt(client.readyTimestamp / 1000)}:R>`
      )
      .setFooter({ text: "Powered by Blackbit Studio" });

    await interaction.followUp({ embeds: [embed] });
  },
};