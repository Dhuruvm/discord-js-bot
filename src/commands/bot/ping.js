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

    const response = new ModernEmbed()
      .setColor(0xFFFFFF)
      .setHeader("🏓 Pong!", "Latency Information")
      .addField("Bot Latency", `\`${Math.floor(message.createdTimestamp - message.createdTimestamp)}ms\``, true)
      .addField("API Latency", `\`${Math.round(message.client.ws.ping)}ms\` - ${status}`, true)
      .setFooter("Powered by Blackbit Studio")
      .setTimestamp()
      .toMessage();

    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const ping = Math.floor(interaction.client.ws.ping);
    const status = ping < 100 ? 'Excellent 🟢' : ping < 200 ? 'Good 🟡' : 'Poor 🔴';

    const response = new ModernEmbed()
      .setColor(0xFFFFFF)
      .setHeader("🏓 Pong!", "Latency Information")
      .addField("Bot Latency", `\`${Math.floor(interaction.createdTimestamp - interaction.createdTimestamp)}ms\``, true)
      .addField("API Latency", `\`${Math.round(interaction.client.ws.ping)}ms\` - ${status}`, true)
      .setFooter("Powered by Blackbit Studio")
      .setTimestamp()
      .toMessage();

    await interaction.followUp(response);
  },
};