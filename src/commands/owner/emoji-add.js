const fs = require("fs");
const path = require("path");
const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "emoji-add",
  description: "Add or update an emoji in the config",
  category: "OWNER",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<name> <emoji>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    const name = args[0].toLowerCase();
    const emoji = args.slice(1).join(" ");

    if (!emoji) {
      return message.safeReply(ModernEmbed.simpleError("Please provide an emoji"));
    }

    try {
      const emojisPath = path.join(__dirname, "../../../emojis.json");
      const emojis = JSON.parse(fs.readFileSync(emojisPath, "utf-8"));
      
      const isUpdate = emojis[name] !== undefined;
      emojis[name] = emoji;
      
      fs.writeFileSync(emojisPath, JSON.stringify(emojis, null, 2));
      ModernEmbed.reloadEmojis();

      const action = isUpdate ? "updated" : "added";
      return message.safeReply(ModernEmbed.simpleSuccess(`Emoji **${name}** ${action}: ${emoji}`));
    } catch (error) {
      console.error("Error managing emoji:", error);
      return message.safeReply(ModernEmbed.simpleError("Failed to add emoji to config"));
    }
  },
};
