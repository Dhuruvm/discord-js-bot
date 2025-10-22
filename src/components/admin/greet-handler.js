const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * Handle greet button/modal interactions
 * @param {import('discord.js').Interaction} interaction
 */
module.exports = async function handleGreetInteraction(interaction) {
  if (!interaction.customId?.startsWith("greet:")) return;

  const [system, action, data] = interaction.customId.split(":");

  // Handle various greet interactions
  if (interaction.isButton()) {
    // Button interactions for greet system
    if (action === "test") {
      const { getSettings } = require("@schemas/Guild");
      const { buildGreeting } = require("@handlers/greeting");
      const settings = await getSettings(interaction.guild);

      if (!settings.welcome?.enabled) {
        return interaction.reply({
          embeds: [ModernEmbed.simpleError("Welcome system is not enabled").embeds[0]],
          ephemeral: true
        });
      }

      const channel = interaction.guild.channels.cache.get(settings.welcome.channels?.[0]);
      if (!channel) {
        return interaction.reply({
          embeds: [ModernEmbed.simpleError("No welcome channel configured").embeds[0]],
          ephemeral: true
        });
      }

      try {
        const greeting = await buildGreeting(interaction.member, "WELCOME", settings.welcome);
        await channel.send(greeting);
        return interaction.reply({
          embeds: [ModernEmbed.simpleSuccess(`Test greeting sent to ${channel}`).embeds[0]],
          ephemeral: true
        });
      } catch (error) {
        return interaction.reply({
          embeds: [ModernEmbed.simpleError(`Failed: ${error.message}`).embeds[0]],
          ephemeral: true
        });
      }
    }
  }
};
