const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const { createSetupPanel } = require("./setup-panel");

/**
 * Handle antinuke modal submissions
 */
module.exports = async (interaction) => {
  const { customId } = interaction;

  // Module configuration modal
  if (customId === "antinuke_module_config") {
    await interaction.deferUpdate();
    const limit = parseInt(interaction.fields.getTextInputValue("module_limit"));
    const timeframe = parseInt(interaction.fields.getTextInputValue("module_timeframe"));

    if (isNaN(limit) || isNaN(timeframe) || limit < 1 || timeframe < 1) {
      return interaction.followUp({
        content: "❌ Invalid values! Please enter valid numbers.",
        ephemeral: true
      });
    }

    const settings = await getSettings(interaction.guild);
    if (!settings.antinuke) settings.antinuke = { enabled: false, whitelist: [] };

    // Update all protection modules with new values
    const modules = [
      'anti_ban', 'anti_kick', 'anti_role_create', 'anti_role_delete',
      'anti_channel_create', 'anti_channel_delete', 'anti_webhook', 'anti_emoji_delete'
    ];

    modules.forEach(module => {
      if (settings.antinuke[module]) {
        settings.antinuke[module].limit = limit;
        settings.antinuke[module].timeframe = timeframe;
      }
    });

    await settings.save();

    const response = await createSetupPanel(interaction.guild);
    return interaction.editReply(response);
  }

  // Punishment settings modal
  if (customId === "antinuke_punishment_modal") {
    await interaction.deferUpdate();
    const punishment = interaction.fields.getTextInputValue("punishment_type").toUpperCase();

    if (!["BAN", "KICK", "STRIP_ROLES"].includes(punishment)) {
      return interaction.followUp({
        content: "❌ Invalid punishment type! Use: BAN, KICK, or STRIP_ROLES",
        ephemeral: true
      });
    }

    const settings = await getSettings(interaction.guild);
    if (!settings.antinuke) settings.antinuke = { enabled: false, whitelist: [] };

    settings.antinuke.punishment = punishment;
    await settings.save();

    const response = await createSetupPanel(interaction.guild);
    return interaction.editReply(response);
  }

  // Add user to whitelist modal
  if (customId === "antinuke_whitelist_add_modal") {
    await interaction.deferUpdate();
    let userId = interaction.fields.getTextInputValue("user_id").trim();

    // Extract user ID from mention if needed
    const mentionMatch = userId.match(/<@!?(\d+)>/);
    if (mentionMatch) {
      userId = mentionMatch[1];
    }

    // Validate user ID
    if (!/^\d{17,19}$/.test(userId)) {
      return interaction.followUp({
        content: "❌ Invalid user ID! Please provide a valid Discord user ID.",
        ephemeral: true
      });
    }

    try {
      const user = await interaction.client.users.fetch(userId);
      const settings = await getSettings(interaction.guild);

      if (!settings.antinuke) settings.antinuke = { enabled: false, whitelist: [] };
      if (!settings.antinuke.whitelist) settings.antinuke.whitelist = [];

      if (settings.antinuke.whitelist.includes(userId)) {
        return interaction.followUp({
          content: `❌ **${user.tag}** is already whitelisted!`,
          ephemeral: true
        });
      }

      settings.antinuke.whitelist.push(userId);
      await settings.save();

      const response = await createSetupPanel(interaction.guild);
      await interaction.editReply(response);

      return interaction.followUp({
        content: `✅ Added **${user.tag}** to the antinuke whitelist!`,
        ephemeral: true
      });
    } catch (error) {
      return interaction.followUp({
        content: "❌ Could not find that user! Please check the ID and try again.",
        ephemeral: true
      });
    }
  }

  // Set log channel modal
  if (customId === "antinuke_log_channel_modal") {
    await interaction.deferUpdate();
    let channelId = interaction.fields.getTextInputValue("channel_id").trim();

    // Extract channel ID from mention if needed
    const mentionMatch = channelId.match(/<#(\d+)>/);
    if (mentionMatch) {
      channelId = mentionMatch[1];
    }

    // Validate channel
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
      return interaction.followUp({
        content: "❌ Invalid channel! Please provide a valid text channel.",
        ephemeral: true
      });
    }

    const settings = await getSettings(interaction.guild);
    if (!settings.antinuke) settings.antinuke = { enabled: false, whitelist: [] };

    settings.antinuke.log_channel = channelId;
    await settings.save();

    const response = await createSetupPanel(interaction.guild);
    await interaction.editReply(response);

    return interaction.followUp({
      content: `✅ Set antinuke log channel to ${channel}`,
      ephemeral: true
    });
  }
};
