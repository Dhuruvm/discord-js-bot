const { EmbedBuilder } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");

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

    const embed = new EmbedBuilder()
      .setColor(0xFFFFFF)
      .setAuthor({ 
        name: "🏓 Pong!",
        iconURL: message.client.user.displayAvatarURL()
      })
      .setDescription(
        `### Latency Information\n` +
        `> **Bot Latency:** \`${Math.floor(message.createdTimestamp - message.createdTimestamp)}ms\`\n` +
        `> **API Latency:** \`${Math.round(message.client.ws.ping)}ms\``
      )
      .setFooter({ text: "Powered by Blackbit Studio" });

    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const ping = Math.floor(interaction.client.ws.ping);
    const status = ping < 100 ? 'Excellent 🟢' : ping < 200 ? 'Good 🟡' : 'Poor 🔴';

    const embed = new EmbedBuilder()
      .setColor(0xFFFFFF)
      .setAuthor({ 
        name: "🏓 Pong!",
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setDescription(
        `### Latency Information\n` +
        `> **Bot Latency:** \`${Math.floor(interaction.createdTimestamp - interaction.createdTimestamp)}ms\`\n` +
        `> **API Latency:** \`${Math.round(interaction.client.ws.ping)}ms\``
      )
      .setFooter({ text: "Powered by Blackbit Studio" });

    await interaction.followUp({ embeds: [embed] });
  },
};