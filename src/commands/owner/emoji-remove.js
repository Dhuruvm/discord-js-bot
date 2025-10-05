const fs = require("fs");
const path = require("path");
const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "emoji-remove",
  description: "Remove an emoji from the config",
  category: "OWNER",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<name>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    const name = args[0].toLowerCase();

    try {
      const emojisPath = path.join(__dirname, "../../../emojis.json");
      const emojis = JSON.parse(fs.readFileSync(emojisPath, "utf-8"));
      
      if (!emojis[name]) {
        return message.safeReply(ModernEmbed.simpleError(`Emoji **${name}** not found in config`));
      }

      delete emojis[name];
      
      fs.writeFileSync(emojisPath, JSON.stringify(emojis, null, 2));
      ModernEmbed.reloadEmojis();

      return message.safeReply(ModernEmbed.simpleSuccess(`Emoji **${name}** removed from config`));
    } catch (error) {
      console.error("Error removing emoji:", error);
      return message.safeReply(ModernEmbed.simpleError("Failed to remove emoji from config"));
    }
  },
};
