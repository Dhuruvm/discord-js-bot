const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * Handle autorole button interactions
 * @param {import('discord.js').ButtonInteraction} interaction
 */
module.exports = async function handleAutoroleInteraction(interaction) {
  if (!interaction.customId.startsWith("autorole:")) return;

  const [system, action, data] = interaction.customId.split(":");

  // Handle reset confirmation
  if (action === "reset") {
    if (data === "yes") {
      const { getSettings } = require("@schemas/Guild");
      const settings = await getSettings(interaction.guild);

      settings.autorole = { humans: [], bots: [] };
      await settings.save();

      return interaction.update({
        embeds: [ModernEmbed.simpleSuccess("✅ All autoroles have been reset").embeds[0]],
        components: []
      });
    } else if (data === "no") {
      return interaction.update({
        embeds: [ModernEmbed.simpleError("Reset cancelled").embeds[0]],
        components: []
      });
    }
  }
};
