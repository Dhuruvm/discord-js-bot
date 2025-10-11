const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const { createSetupPanel } = require("./setup-panel");

/**
 * Handle all antinuke button/select menu interactions
 */
module.exports = async (interaction) => {
  const { customId } = interaction;

  // Toggle antinuke on/off
  if (customId === "antinuke_toggle") {
    await interaction.deferUpdate();
    const settings = await getSettings(interaction.guild);
    
    if (!settings.antinuke) {
      settings.antinuke = { enabled: true, whitelist: [] };
    } else {
      settings.antinuke.enabled = !settings.antinuke.enabled;
    }
    
    await settings.save();
    
    const response = await createSetupPanel(interaction.guild);
    return interaction.editReply(response);
  }

  // Configure modules
  if (customId === "antinuke_configure") {
    const modal = new ModalBuilder()
      .setCustomId("antinuke_module_config")
      .setTitle("Configure Protection Modules");

    const limitInput = new TextInputBuilder()
      .setCustomId("module_limit")
      .setLabel("Action Limit (per timeframe)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("3")
      .setRequired(true)
      .setValue("3");

    const timeframeInput = new TextInputBuilder()
      .setCustomId("module_timeframe")
      .setLabel("Timeframe (in seconds)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("10")
      .setRequired(true)
      .setValue("10");

    modal.addComponents(
      new ActionRowBuilder().addComponents(limitInput),
      new ActionRowBuilder().addComponents(timeframeInput)
    );

    return interaction.showModal(modal);
  }

  // Punishment settings
  if (customId === "antinuke_punishment") {
    const modal = new ModalBuilder()
      .setCustomId("antinuke_punishment_modal")
      .setTitle("Punishment Settings");

    const punishmentInput = new TextInputBuilder()
      .setCustomId("punishment_type")
      .setLabel("Punishment Type")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("BAN, KICK, or STRIP_ROLES")
      .setRequired(true)
      .setValue("BAN");

    modal.addComponents(
      new ActionRowBuilder().addComponents(punishmentInput)
    );

    return interaction.showModal(modal);
  }

  // Module selection
  if (customId === "antinuke_module_select") {
    await interaction.deferUpdate();
    const settings = await getSettings(interaction.guild);
    const selected = interaction.values;

    if (!settings.antinuke) {
      settings.antinuke = { enabled: false, whitelist: [] };
    }

    // Enable selected modules
    for (const module of selected) {
      if (module === "anti_role") {
        settings.antinuke.anti_role_create = { enabled: true, limit: 3, timeframe: 10 };
        settings.antinuke.anti_role_delete = { enabled: true, limit: 3, timeframe: 10 };
      } else if (module === "anti_channel") {
        settings.antinuke.anti_channel_create = { enabled: true, limit: 3, timeframe: 10 };
        settings.antinuke.anti_channel_delete = { enabled: true, limit: 3, timeframe: 10 };
      } else {
        settings.antinuke[module] = { enabled: true, limit: 3, timeframe: 10 };
      }
    }

    await settings.save();

    const response = await createSetupPanel(interaction.guild);
    return interaction.editReply(response);
  }

  // Add to whitelist
  if (customId === "antinuke_whitelist_add") {
    const modal = new ModalBuilder()
      .setCustomId("antinuke_whitelist_add_modal")
      .setTitle("Add User to Whitelist");

    const userInput = new TextInputBuilder()
      .setCustomId("user_id")
      .setLabel("User ID or Mention")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("123456789012345678")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(userInput)
    );

    return interaction.showModal(modal);
  }

  // View whitelist
  if (customId === "antinuke_whitelist_view") {
    await interaction.deferReply({ ephemeral: true });
    const settings = await getSettings(interaction.guild);
    const whitelist = settings.antinuke?.whitelist || [];

    if (whitelist.length === 0) {
      return interaction.editReply({
        content: "📋 **Whitelist is empty**\n\nNo users are currently whitelisted.",
        ephemeral: true
      });
    }

    const userList = await Promise.all(
      whitelist.map(async (userId) => {
        try {
          const user = await interaction.client.users.fetch(userId);
          return `• ${user.tag} (${userId})`;
        } catch {
          return `• Unknown User (${userId})`;
        }
      })
    );

    return interaction.editReply({
      content: `📋 **Antinuke Whitelist**\n\n${userList.join('\n')}`,
      ephemeral: true
    });
  }

  // Set log channel
  if (customId === "antinuke_log_channel") {
    const modal = new ModalBuilder()
      .setCustomId("antinuke_log_channel_modal")
      .setTitle("Set Log Channel");

    const channelInput = new TextInputBuilder()
      .setCustomId("channel_id")
      .setLabel("Channel ID or Mention")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("#antinuke-logs or channel ID")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(channelInput)
    );

    return interaction.showModal(modal);
  }

  // Preset configurations
  if (customId === "antinuke_preset_high") {
    await interaction.deferUpdate();
    const settings = await getSettings(interaction.guild);

    settings.antinuke = {
      enabled: true,
      whitelist: settings.antinuke?.whitelist || [],
      punishment: "BAN",
      log_channel: settings.antinuke?.log_channel,
      anti_ban: { enabled: true, limit: 2, timeframe: 10 },
      anti_kick: { enabled: true, limit: 2, timeframe: 10 },
      anti_role_create: { enabled: true, limit: 2, timeframe: 10 },
      anti_role_delete: { enabled: true, limit: 2, timeframe: 10 },
      anti_channel_create: { enabled: true, limit: 2, timeframe: 10 },
      anti_channel_delete: { enabled: true, limit: 2, timeframe: 10 },
      anti_webhook: { enabled: true, limit: 1, timeframe: 10 },
      anti_bot: { enabled: true, action: "KICK" },
      anti_server_update: { enabled: true },
      anti_emoji_delete: { enabled: true, limit: 3, timeframe: 10 },
      anti_prune: { enabled: true },
    };

    await settings.save();

    const response = await createSetupPanel(interaction.guild);
    return interaction.editReply(response);
  }

  if (customId === "antinuke_preset_medium") {
    await interaction.deferUpdate();
    const settings = await getSettings(interaction.guild);

    settings.antinuke = {
      enabled: true,
      whitelist: settings.antinuke?.whitelist || [],
      punishment: "KICK",
      log_channel: settings.antinuke?.log_channel,
      anti_ban: { enabled: true, limit: 3, timeframe: 10 },
      anti_kick: { enabled: true, limit: 3, timeframe: 10 },
      anti_role_create: { enabled: true, limit: 3, timeframe: 10 },
      anti_role_delete: { enabled: true, limit: 3, timeframe: 10 },
      anti_channel_create: { enabled: true, limit: 3, timeframe: 10 },
      anti_channel_delete: { enabled: true, limit: 3, timeframe: 10 },
      anti_webhook: { enabled: true, limit: 2, timeframe: 10 },
      anti_bot: { enabled: true, action: "KICK" },
      anti_server_update: { enabled: false },
      anti_emoji_delete: { enabled: true, limit: 5, timeframe: 10 },
      anti_prune: { enabled: true },
    };

    await settings.save();

    const response = await createSetupPanel(interaction.guild);
    return interaction.editReply(response);
  }

  // Refresh panel
  if (customId === "antinuke_refresh") {
    await interaction.deferUpdate();
    const response = await createSetupPanel(interaction.guild);
    return interaction.editReply(response);
  }
};
