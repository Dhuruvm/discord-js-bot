
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const PinterestScraper = require("@helpers/PinterestScraper");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "cleanup-pfp",
  description: "Clean up duplicate PFPs from storage",
  category: "ADMIN",
  userPermissions: ["Administrator"],
  botPermissions: ["SendMessages", "EmbedLinks"],
  command: {
    enabled: true,
    usage: "",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async messageRun(message, args) {
    const response = await cleanupDuplicates();
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = await cleanupDuplicates();
    await interaction.followUp(response);
  },
};

async function cleanupDuplicates() {
  try {
    await PinterestScraper.cleanupDuplicates();
    
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription("✅ Successfully cleaned up duplicate PFPs from storage!");
    
    return { embeds: [embed] };
  } catch (error) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(`❌ Failed to cleanup duplicates: ${error.message}`);
    
    return { embeds: [embed] };
  }
}
