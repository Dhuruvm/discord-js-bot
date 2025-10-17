const {
  ChannelType,
  ComponentType,
  ButtonStyle,
  TextInputStyle,
} = require("discord.js");
const GuildSettings = require("@schemas/Guild");
const InteractionUtils = require("@helpers/InteractionUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "loggingsetup",
  description: "Interactive server logging setup",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "",
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
  },

  async messageRun(message, args) {
    await showLoggingSetupMenu(message, false);
  },

  async interactionRun(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await showLoggingSetupMenu(interaction, true);
  },
};

/**
 * Show logging setup menu
 */
async function showLoggingSetupMenu(source, isInteraction) {
  const settings = await GuildSettings.findOne({ guildId: source.guild.id });
  const modlogChannel = settings?.modlog_channel
    ? `<#${settings.modlog_channel}>`
    : "Not set";
  const automodChannel = settings?.automod?.log_channel
    ? `<#${settings.automod.log_channel}>`
    : "Not set";

  const embed = InteractionUtils.createThemedEmbed({
    title: "📋 Logging Setup",
    description: "Configure server logging channels:",
    fields: [
      {
        name: "Moderation Log",
        value: modlogChannel,
        inline: true,
      },
      {
        name: "AutoMod Log",
        value: automodChannel,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: "What gets logged?",
        value:
          "• Mod actions (ban, kick, mute, etc.)\n• AutoMod violations\n• Member events\n• Message events",
        inline: false,
      },
    ],
    footer: "Click buttons below to configure",
    timestamp: true,
  });

  const row = InteractionUtils.createButtonRow([
    {
      customId: "log_modlog",
      label: "Mod Log",
      emoji: "🛡️",
      style: ButtonStyle.Primary,
    },
    {
      customId: "log_automod",
      label: "AutoMod Log",
      emoji: "🤖",
      style: ButtonStyle.Primary,
    },
    {
      customId: "log_disable",
      label: "Disable All",
      emoji: "🔴",
      style: ButtonStyle.Danger,
    },
  ]);

  const msg = isInteraction
    ? await source.editReply({ embeds: [embed], components: [row] })
    : await source.reply({ embeds: [embed], components: [row] });

  setupCollector(msg, source, isInteraction);
}

/**
 * Refresh menu display
 */
async function refreshMenu(message, source, isSlashCommand) {
  const settings = await GuildSettings.findOne({ guildId: source.guild?.id || message.guild.id });
  const modlogChannel = settings?.modlog_channel
    ? `<#${settings.modlog_channel}>`
    : "Not set";
  const automodChannel = settings?.automod?.log_channel
    ? `<#${settings.automod.log_channel}>`
    : "Not set";

  const embed = InteractionUtils.createThemedEmbed({
    title: "📋 Logging Setup",
    description: "Configure server logging channels:",
    fields: [
      {
        name: "Moderation Log",
        value: modlogChannel,
        inline: true,
      },
      {
        name: "AutoMod Log",
        value: automodChannel,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: "What gets logged?",
        value:
          "• Mod actions (ban, kick, mute, etc.)\n• AutoMod violations\n• Member events\n• Message events",
        inline: false,
      },
    ],
    footer: "Click buttons below to configure",
    timestamp: true,
  });

  const row = InteractionUtils.createButtonRow([
    {
      customId: "log_modlog",
      label: "Mod Log",
      emoji: "🛡️",
      style: ButtonStyle.Primary,
    },
    {
      customId: "log_automod",
      label: "AutoMod Log",
      emoji: "🤖",
      style: ButtonStyle.Primary,
    },
    {
      customId: "log_disable",
      label: "Disable All",
      emoji: "🔴",
      style: ButtonStyle.Danger,
    },
  ]);

  if (isSlashCommand) {
    await source.editReply({ embeds: [embed], components: [row] });
  } else {
    await message.edit({ embeds: [embed], components: [row] });
  }
}

/**
 * Setup collector
 */
function setupCollector(message, source, isSlashCommand) {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) =>
      i.user.id === (isSlashCommand ? source.user.id : source.author.id),
    time: 300000,
  });

  collector.on("collect", async (interaction) => {
    try {
      switch (interaction.customId) {
        case "log_modlog":
          await handleModLogSetup(interaction);
          await refreshMenu(message, source, isSlashCommand);
          break;
        case "log_automod":
          await handleAutoModLogSetup(interaction);
          await refreshMenu(message, source, isSlashCommand);
          break;
        case "log_disable":
          await handleDisableAll(interaction);
          await refreshMenu(message, source, isSlashCommand);
          break;
      }
    } catch (error) {
      console.error("Logging setup error:", error);
      await interaction.reply({
        embeds: [
          InteractionUtils.createErrorEmbed(`Error: ${error.message}`),
        ],
        ephemeral: true,
      }).catch(() => {});
    }
  });

  collector.on("end", () => {
    message
      .edit({
        components: InteractionUtils.disableComponents(message.components),
      })
      .catch(() => {});
  });
}

/**
 * Handle mod log setup
 */
async function handleModLogSetup(interaction) {
  const modal = InteractionUtils.createModal(
    "modlog_channel_modal",
    "Moderation Log Setup",
    [
      {
        customId: "channel_id",
        label: "Mod Log Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Enter channel ID for moderation logs",
        required: true,
      },
    ]
  );

  await interaction.showModal(modal);

  const modalSubmit = await InteractionUtils.awaitModalSubmit(
    interaction,
    "modlog_channel_modal"
  );

  if (!modalSubmit) return;

  const channelId = modalSubmit.fields.getTextInputValue("channel_id");
  const channel = await interaction.guild.channels
    .fetch(channelId)
    .catch(() => null);

  if (!channel || channel.type !== ChannelType.GuildText) {
    return modalSubmit.reply({
      embeds: [InteractionUtils.createErrorEmbed("Invalid text channel ID!")],
      ephemeral: true,
    });
  }

  await GuildSettings.updateOne(
    { guildId: interaction.guild.id },
    {
      $set: {
        modlog_channel: channel.id,
      },
    },
    { upsert: true }
  );

  await modalSubmit.reply({
    embeds: [
      InteractionUtils.createSuccessEmbed(
        `Moderation log channel set to ${channel}!`
      ),
    ],
    ephemeral: true,
  });
}

/**
 * Handle automod log setup
 */
async function handleAutoModLogSetup(interaction) {
  const modal = InteractionUtils.createModal(
    "automod_log_modal",
    "AutoMod Log Setup",
    [
      {
        customId: "channel_id",
        label: "AutoMod Log Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Enter channel ID for automod logs",
        required: true,
      },
    ]
  );

  await interaction.showModal(modal);

  const modalSubmit = await InteractionUtils.awaitModalSubmit(
    interaction,
    "automod_log_modal"
  );

  if (!modalSubmit) return;

  const channelId = modalSubmit.fields.getTextInputValue("channel_id");
  const channel = await interaction.guild.channels
    .fetch(channelId)
    .catch(() => null);

  if (!channel || channel.type !== ChannelType.GuildText) {
    return modalSubmit.reply({
      embeds: [InteractionUtils.createErrorEmbed("Invalid text channel ID!")],
      ephemeral: true,
    });
  }

  await GuildSettings.updateOne(
    { guildId: interaction.guild.id },
    {
      $set: {
        "automod.log_channel": channel.id,
      },
    },
    { upsert: true }
  );

  await modalSubmit.reply({
    embeds: [
      InteractionUtils.createSuccessEmbed(
        `AutoMod log channel set to ${channel}!`
      ),
    ],
    ephemeral: true,
  });
}

/**
 * Handle disable all
 */
async function handleDisableAll(interaction) {
  await GuildSettings.updateOne(
    { guildId: interaction.guild.id },
    {
      $unset: {
        modlog_channel: "",
        "automod.log_channel": "",
      },
    },
    { upsert: true }
  );

  await interaction.reply({
    embeds: [
      InteractionUtils.createSuccessEmbed("All logging channels disabled!"),
    ],
    ephemeral: true,
  });
}
