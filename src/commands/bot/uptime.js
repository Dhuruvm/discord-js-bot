const { timeformat } = require("@helpers/Utils");
const ModernEmbed = require("@helpers/ModernEmbed");

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
    await message.safeReply(
      ModernEmbed.simpleSuccess(`Bot uptime: \`${timeformat(process.uptime())}\``)
    );
  },

  async interactionRun(interaction) {
    await interaction.followUp(
      ModernEmbed.simpleSuccess(`Bot uptime: \`${timeformat(process.uptime())}\``)
    );
  },
};
