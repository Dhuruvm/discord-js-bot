const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * Handle automod button/modal interactions
 * @param {import('discord.js').Interaction} interaction
 */
module.exports = async function handleAutomodInteraction(interaction) {
  if (!interaction.customId?.startsWith("automod:")) return;

  const [system, action, data] = interaction.customId.split(":");
  const { getSettings } = require("@schemas/Guild");

  if (interaction.isButton()) {
    // Handle toggle buttons
    if (action === "enable" || action === "disable") {
      const settings = await getSettings(interaction.guild);
      const enabled = action === "enable";

      // Update based on data parameter (which rule)
      if (data === "antispam") {
        if (!settings.automod.anti_spam) settings.automod.anti_spam = {};
        settings.automod.anti_spam.enabled = enabled;
      } else if (data === "antilink") {
        settings.automod.anti_links = enabled;
      } else if (data === "antibadwords") {
        if (!settings.automod.anti_badwords) settings.automod.anti_badwords = {};
        settings.automod.anti_badwords.enabled = enabled;
      } else if (data === "antizalgo") {
        if (!settings.automod.anti_zalgo) settings.automod.anti_zalgo = {};
        settings.automod.anti_zalgo.enabled = enabled;
      } else if (data === "anticaps") {
        if (!settings.automod.anti_caps) settings.automod.anti_caps = {};
        settings.automod.anti_caps.enabled = enabled;
      }

      await settings.save();

      return interaction.update({
        embeds: [ModernEmbed.simpleSuccess(`✅ ${data} ${enabled ? 'enabled' : 'disabled'}`).embeds[0]],
        components: []
      });
    }
  }
};
