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
      .setColor(ping < 100 ? 0x57F287 : ping < 200 ? 0xFEE75C : 0xED4245)
      .setTitle(`${ModernEmbed.getEmoji("bot")} Pong!`)
      .addFields(
        { name: "📡 Websocket Latency", value: `\`${ping}ms\``, inline: true },
        { name: "📊 Status", value: status, inline: true }
      )
      .setFooter({ text: message.guild ? message.guild.name : 'Direct Message' })
      .setTimestamp();
    
    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const ping = Math.floor(interaction.client.ws.ping);
    const status = ping < 100 ? 'Excellent 🟢' : ping < 200 ? 'Good 🟡' : 'Poor 🔴';
    
    const embed = new EmbedBuilder()
      .setColor(ping < 100 ? 0x57F287 : ping < 200 ? 0xFEE75C : 0xED4245)
      .setTitle(`${ModernEmbed.getEmoji("bot")} Pong!`)
      .addFields(
        { name: "📡 Websocket Latency", value: `\`${ping}ms\``, inline: true },
        { name: "📊 Status", value: status, inline: true }
      )
      .setFooter({ text: interaction.guild ? interaction.guild.name : 'Direct Message' })
      .setTimestamp();
    
    await interaction.followUp({ embeds: [embed] });
  },
};
