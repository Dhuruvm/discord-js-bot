const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * Handle logging system button/select menu interactions
 * @param {import('discord.js').Interaction} interaction
 */
module.exports = async function handleLogsInteraction(interaction) {
  if (!interaction.customId?.startsWith("logs:")) return;

  const [system, action, data] = interaction.customId.split(":");
  const { getSettings } = require("@schemas/Guild");

  if (interaction.isStringSelectMenu()) {
    // Handle channel selection
    const selectedChannel = interaction.values[0];
    const settings = await getSettings(interaction.guild);

    if (!settings.logging) settings.logging = {};

    // Update the appropriate log category
    if (data === "channel") {
      if (!settings.logging.channel_logs) settings.logging.channel_logs = {};
      settings.logging.channel_logs.channel = selectedChannel;
      settings.logging.channel_logs.enabled = true;
    } else if (data === "member") {
      if (!settings.logging.member_logs) settings.logging.member_logs = {};
      settings.logging.member_logs.channel = selectedChannel;
      settings.logging.member_logs.enabled = true;
    } else if (data === "message") {
      if (!settings.logging.message_logs) settings.logging.message_logs = {};
      settings.logging.message_logs.channel = selectedChannel;
      settings.logging.message_logs.enabled = true;
    } else if (data === "mod") {
      if (!settings.logging.mod_logs) settings.logging.mod_logs = {};
      settings.logging.mod_logs.channel = selectedChannel;
      settings.logging.mod_logs.enabled = true;
    } else if (data === "role") {
      if (!settings.logging.role_logs) settings.logging.role_logs = {};
      settings.logging.role_logs.channel = selectedChannel;
      settings.logging.role_logs.enabled = true;
    }

    await settings.save();

    return interaction.update({
      embeds: [ModernEmbed.simpleSuccess(`✅ ${data} logging channel set to <#${selectedChannel}>`).embeds[0]],
      components: []
    });
  }
};
