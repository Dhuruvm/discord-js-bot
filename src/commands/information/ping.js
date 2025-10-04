const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ping",
  description: "Shows the current latency from the bot to Discord servers",
  category: "INFORMATION",
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async messageRun(message, args) {
    const ping = Math.floor(message.client.ws.ping);
    const embed = new EmbedBuilder()
      .setColor(ping < 100 ? EMBED_COLORS.SUCCESS : ping < 200 ? EMBED_COLORS.WARNING : EMBED_COLORS.ERROR)
      .setDescription(`🏓 **Pong!**\n\nLatency: \`${ping}ms\``)
      .setFooter({ text: `Cybork Ping` })
      .setTimestamp();
    
    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const ping = Math.floor(interaction.client.ws.ping);
    const embed = new EmbedBuilder()
      .setColor(ping < 100 ? EMBED_COLORS.SUCCESS : ping < 200 ? EMBED_COLORS.WARNING : EMBED_COLORS.ERROR)
      .setDescription(`🏓 **Pong!**\n\nLatency: \`${ping}ms\``)
      .setFooter({ text: `Cybork Ping` })
      .setTimestamp();
    
    await interaction.followUp({ embeds: [embed] });
  },
};
