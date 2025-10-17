const {
  ChannelType,
  ComponentType,
  ButtonStyle,
  TextInputStyle,
} = require("discord.js");
const { buildGreeting } = require("@handlers/greeting");
const GuildSettings = require("@schemas/Guild");
const InteractionUtils = require("@helpers/InteractionUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "welcomesetup",
  description: "Interactive welcome message setup",
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
    await showWelcomeSetupMenu(message, false);
  },

  async interactionRun(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await showWelcomeSetupMenu(interaction, true);
  },
};

/**
 * Show welcome setup menu
 */
async function showWelcomeSetupMenu(source, isInteraction) {
  const settings = await GuildSettings.findOne({ guildId: source.guild.id });
  const welcomeConfig = settings?.welcome || {};

  const statusEmoji = welcomeConfig.enabled ? "✅" : "❌";
  const channelMention = welcomeConfig.channel
    ? `<#${welcomeConfig.channel}>`
    : "Not set";

  const embed = InteractionUtils.createThemedEmbed({
    title: "👋 Welcome Message Setup",
    description: "Configure your server's welcome messages with an interactive setup:",
    fields: [
      {
        name: "Current Status",
        value: `${statusEmoji} ${welcomeConfig.enabled ? "Enabled" : "Disabled"}`,
        inline: true,
      },
      {
        name: "Welcome Channel",
        value: channelMention,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
    ],
    footer: "Click a button below to configure",
    timestamp: true,
  });

  const row1 = InteractionUtils.createButtonRow([
    {
      customId: "welcome_toggle",
      label: welcomeConfig.enabled ? "Disable" : "Enable",
      emoji: welcomeConfig.enabled ? "🔴" : "🟢",
      style: welcomeConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success,
    },
    {
      customId: "welcome_channel",
      label: "Set Channel",
      emoji: "📝",
      style: ButtonStyle.Primary,
    },
  ]);

  const row2 = InteractionUtils.createButtonRow([
    {
      customId: "welcome_message",
      label: "Configure Message",
      emoji: "✉️",
      style: ButtonStyle.Primary,
    },
    {
      customId: "welcome_preview",
      label: "Preview",
      emoji: "👁️",
      style: ButtonStyle.Secondary,
    },
  ]);

  const msg = isInteraction
    ? await source.editReply({ embeds: [embed], components: [row1, row2] })
    : await source.reply({ embeds: [embed], components: [row1, row2] });

  setupCollector(msg, source, isInteraction);
}

/**
 * Refresh menu display
 */
async function refreshMenu(message, source, isSlashCommand) {
  const settings = await GuildSettings.findOne({ guildId: source.guild?.id || message.guild.id });
  const welcomeConfig = settings?.welcome || {};

  const statusEmoji = welcomeConfig.enabled ? "✅" : "❌";
  const channelMention = welcomeConfig.channel
    ? `<#${welcomeConfig.channel}>`
    : "Not set";

  const embed = InteractionUtils.createThemedEmbed({
    title: "👋 Welcome Message Setup",
    description: "Configure your server's welcome messages with an interactive setup:",
    fields: [
      {
        name: "Current Status",
        value: `${statusEmoji} ${welcomeConfig.enabled ? "Enabled" : "Disabled"}`,
        inline: true,
      },
      {
        name: "Welcome Channel",
        value: channelMention,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
    ],
    footer: "Click a button below to configure",
    timestamp: true,
  });

  const row1 = InteractionUtils.createButtonRow([
    {
      customId: "welcome_toggle",
      label: welcomeConfig.enabled ? "Disable" : "Enable",
      emoji: welcomeConfig.enabled ? "🔴" : "🟢",
      style: welcomeConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success,
    },
    {
      customId: "welcome_channel",
      label: "Set Channel",
      emoji: "📝",
      style: ButtonStyle.Primary,
    },
  ]);

  const row2 = InteractionUtils.createButtonRow([
    {
      customId: "welcome_message",
      label: "Configure Message",
      emoji: "✉️",
      style: ButtonStyle.Primary,
    },
    {
      customId: "welcome_preview",
      label: "Preview",
      emoji: "👁️",
      style: ButtonStyle.Secondary,
    },
  ]);

  if (isSlashCommand) {
    await source.editReply({ embeds: [embed], components: [row1, row2] });
  } else {
    await message.edit({ embeds: [embed], components: [row1, row2] });
  }
}

/**
 * Setup button collector
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
        case "welcome_toggle":
          await handleToggle(interaction);
          await refreshMenu(message, source, isSlashCommand);
          break;
        case "welcome_channel":
          await handleChannelSetup(interaction);
          await refreshMenu(message, source, isSlashCommand);
          break;
        case "welcome_message":
          await handleMessageSetup(interaction);
          await refreshMenu(message, source, isSlashCommand);
          break;
        case "welcome_preview":
          await handlePreview(interaction);
          break;
      }
    } catch (error) {
      console.error("Welcome setup error:", error);
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
      .edit({ components: InteractionUtils.disableComponents(message.components) })
      .catch(() => {});
  });
}

/**
 * Handle toggle
 */
async function handleToggle(interaction) {
  const settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
  const isEnabled = settings?.welcome?.enabled || false;

  await GuildSettings.updateOne(
    { guildId: interaction.guild.id },
    {
      $set: {
        "welcome.enabled": !isEnabled,
      },
    },
    { upsert: true }
  );

  await interaction.reply({
    embeds: [
      InteractionUtils.createSuccessEmbed(
        `Welcome messages ${!isEnabled ? "enabled" : "disabled"}!`
      ),
    ],
    ephemeral: true,
  });
}

/**
 * Handle channel setup
 */
async function handleChannelSetup(interaction) {
  const modal = InteractionUtils.createModal(
    "welcome_channel_modal",
    "Welcome Channel Setup",
    [
      {
        customId: "channel_id",
        label: "Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Enter the channel ID",
        required: true,
      },
    ]
  );

  await interaction.showModal(modal);

  const modalSubmit = await InteractionUtils.awaitModalSubmit(
    interaction,
    "welcome_channel_modal"
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
        "welcome.channel": channel.id,
      },
    },
    { upsert: true }
  );

  await modalSubmit.reply({
    embeds: [
      InteractionUtils.createSuccessEmbed(
        `Welcome channel set to ${channel}!`
      ),
    ],
    ephemeral: true,
  });
}

/**
 * Handle message setup
 */
async function handleMessageSetup(interaction) {
  const settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
  const currentDesc = settings?.welcome?.embed?.description || "";
  const currentFooter = settings?.welcome?.embed?.footer || "";
  const currentColor = settings?.welcome?.embed?.color || "#5865F2";

  const modal = InteractionUtils.createModal(
    "welcome_message_modal",
    "Welcome Message Configuration",
    [
      {
        customId: "description",
        label: "Message Description",
        style: TextInputStyle.Paragraph,
        placeholder: "Use {user}, {server}, {members} as placeholders",
        required: false,
        value: currentDesc,
        maxLength: 1024,
      },
      {
        customId: "footer",
        label: "Footer Text",
        style: TextInputStyle.Short,
        placeholder: "Footer text (optional)",
        required: false,
        value: currentFooter,
        maxLength: 256,
      },
      {
        customId: "color",
        label: "Embed Color (Hex)",
        style: TextInputStyle.Short,
        placeholder: "#5865F2",
        required: false,
        value: currentColor,
      },
      {
        customId: "thumbnail",
        label: "Show Thumbnail (yes/no)",
        style: TextInputStyle.Short,
        placeholder: "yes or no",
        required: false,
        value: settings?.welcome?.embed?.thumbnail ? "yes" : "no",
      },
    ]
  );

  await interaction.showModal(modal);

  const modalSubmit = await InteractionUtils.awaitModalSubmit(
    interaction,
    "welcome_message_modal"
  );

  if (!modalSubmit) return;

  const description = modalSubmit.fields.getTextInputValue("description");
  const footer = modalSubmit.fields.getTextInputValue("footer");
  const color = modalSubmit.fields.getTextInputValue("color");
  const thumbnail = modalSubmit.fields.getTextInputValue("thumbnail").toLowerCase() === "yes";

  await GuildSettings.updateOne(
    { guildId: interaction.guild.id },
    {
      $set: {
        "welcome.embed.description": description,
        "welcome.embed.footer": footer,
        "welcome.embed.color": color,
        "welcome.embed.thumbnail": thumbnail,
      },
    },
    { upsert: true }
  );

  await modalSubmit.reply({
    embeds: [
      InteractionUtils.createSuccessEmbed("Welcome message configured successfully!"),
    ],
    ephemeral: true,
  });
}

/**
 * Handle preview
 */
async function handlePreview(interaction) {
  await interaction.reply({
    embeds: [
      InteractionUtils.createLoadingEmbed("Generating preview..."),
    ],
    ephemeral: true,
  });

  try {
    const response = await buildGreeting(interaction.guild, interaction.member, "welcome");
    
    if (typeof response === "string") {
      await interaction.editReply({ content: response, embeds: [] });
    } else {
      await interaction.editReply({ content: "", embeds: [response.embed] });
    }
  } catch (error) {
    await interaction.editReply({
      embeds: [
        InteractionUtils.createErrorEmbed(`Preview failed: ${error.message}`),
      ],
    });
  }
}
