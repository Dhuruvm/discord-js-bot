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
    aliases: ["pong", "latency"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async messageRun(message, args) {
    const ping = Math.floor(message.client.ws.ping);
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setAuthor({ 
        name: "🏓 Pong!",
        iconURL: message.client.user.displayAvatarURL()
      })
      .setDescription(
        `╭─────────────────╮\n` +
        `│  **Websocket Latency**  │\n` +
        `╰─────────────────╯\n\n` +
        `\`\`\`fix\n${ping}ms\`\`\`\n` +
        `**Status:** ${ping < 100 ? '**Excellent** 🟢' : ping < 200 ? '**Good** 🟡' : '**Poor** 🔴'}`
      )
      .setFooter({ 
        text: `Cybork Ping${message.guild ? ` • ${message.guild.name}` : ''}`,
        iconURL: message.client.user.displayAvatarURL()
      })
      .setTimestamp();
    
    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const ping = Math.floor(interaction.client.ws.ping);
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setAuthor({ 
        name: "🏓 Pong!",
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setDescription(
        `╭─────────────────╮\n` +
        `│  **Websocket Latency**  │\n` +
        `╰─────────────────╯\n\n` +
        `\`\`\`fix\n${ping}ms\`\`\`\n` +
        `**Status:** ${ping < 100 ? '**Excellent** 🟢' : ping < 200 ? '**Good** 🟡' : '**Poor** 🔴'}`
      )
      .setFooter({ 
        text: `Cybork Ping${interaction.guild ? ` • ${interaction.guild.name}` : ''}`,
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setTimestamp();
    
    await interaction.followUp({ embeds: [embed] });
  },
};
