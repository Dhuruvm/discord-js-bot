const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "emoji-list",
  description: "List all emojis in the config",
  category: "OWNER",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["emojis"],
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    try {
      const emojisPath = path.join(__dirname, "../../../emojis.json");
      const emojis = JSON.parse(fs.readFileSync(emojisPath, "utf-8"));
      
      const entries = Object.entries(emojis);
      
      if (entries.length === 0) {
        return message.safeReply(ModernEmbed.simpleError("No emojis found in config"));
      }

      const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle(`${ModernEmbed.getEmoji("bot")} Bot Emojis Config`)
        .setDescription(
          entries
            .map(([key, value]) => `**${key}:** ${value}`)
            .join("\n")
        )
        .setFooter({ text: `Total: ${entries.length} emojis` })
        .setTimestamp();

      return message.safeReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error listing emojis:", error);
      return message.safeReply(ModernEmbed.simpleError("Failed to list emojis from config"));
    }
  },
};
