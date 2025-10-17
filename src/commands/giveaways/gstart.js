const {
  ChannelType,
  ComponentType,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const ems = require("enhanced-ms");
const InteractionUtils = require("@helpers/InteractionUtils");
const { EMBED_COLORS } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "gstart",
  description: "Start a giveaway with interactive setup",
  category: "GIVEAWAY",
  botPermissions: ["SendMessages", "EmbedLinks"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "",
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
  },

  async messageRun(message, args) {
    await showSetupMenu(message, false);
  },

  async interactionRun(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await showSetupMenu(interaction, true);
  },
};

/**
 * Show giveaway setup menu
 */
async function showSetupMenu(source, isInteraction) {
  const embed = InteractionUtils.createThemedEmbed({
    title: "🎉 Giveaway Setup",
    description: "Click the button below to start setting up your giveaway:",
    fields: [
      {
        name: "What you'll configure",
        value: "• Prize\n• Duration\n• Number of winners\n• Host (optional)\n• Channel (optional)",
        inline: false,
      },
    ],
    footer: "Setup expires in 2 minutes",
    timestamp: true,
  });

  const row = InteractionUtils.createButtonRow([
    {
      customId: "giveaway_setup",
      label: "Setup Giveaway",
      emoji: "🎁",
      style: ButtonStyle.Success,
    },
  ]);

  const msg = isInteraction
    ? await source.editReply({ embeds: [embed], components: [row] })
    : await source.reply({ embeds: [embed], components: [row] });

  const btnInteraction = await InteractionUtils.awaitComponent(
    msg,
    isInteraction ? source.user.id : source.author.id,
    { customId: "giveaway_setup", componentType: ComponentType.Button },
    120000
  );

  if (!btnInteraction) {
    return msg.edit({
      embeds: [InteractionUtils.createErrorEmbed("Setup timed out. Please try again.")],
      components: [],
    });
  }

  await showMainSetupModal(btnInteraction);
}

/**
 * Show main setup modal
 */
async function showMainSetupModal(interaction) {
  const modal = InteractionUtils.createModal("giveaway_main_modal", "Giveaway Configuration", [
    {
      customId: "prize",
      label: "Prize",
      style: 1, // Short
      placeholder: "What are you giving away?",
      required: true,
      minLength: 1,
      maxLength: 256,
    },
    {
      customId: "duration",
      label: "Duration",
      style: 1, // Short
      placeholder: "e.g., 1h, 1d, 1w, 30m",
      required: true,
      value: "1d",
    },
    {
      customId: "winners",
      label: "Number of Winners",
      style: 1, // Short
      placeholder: "How many winners?",
      required: true,
      value: "1",
    },
    {
      customId: "channel_id",
      label: "Channel ID (optional)",
      style: 1, // Short
      placeholder: "Leave empty for current channel",
      required: false,
    },
    {
      customId: "host_id",
      label: "Host User ID (optional)",
      style: 1, // Short
      placeholder: "Leave empty to be the host",
      required: false,
    },
  ]);

  await interaction.showModal(modal);

  const modalSubmit = await InteractionUtils.awaitModalSubmit(
    interaction,
    "giveaway_main_modal",
    300000
  );

  if (!modalSubmit) return;

  await processGiveawaySetup(modalSubmit);
}

/**
 * Process giveaway setup
 */
async function processGiveawaySetup(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const prize = interaction.fields.getTextInputValue("prize");
  const durationStr = interaction.fields.getTextInputValue("duration");
  const winnersStr = interaction.fields.getTextInputValue("winners");
  const channelId = interaction.fields.getTextInputValue("channel_id");
  const hostId = interaction.fields.getTextInputValue("host_id");

  // Validate duration
  const duration = ems(durationStr);
  if (!duration) {
    return interaction.followUp({
      embeds: [InteractionUtils.createErrorEmbed("Invalid duration format! Use: 1h, 1d, 1w, 30m")],
      ephemeral: true,
    });
  }

  // Validate winners
  const winners = parseInt(winnersStr);
  if (isNaN(winners) || winners < 1) {
    return interaction.followUp({
      embeds: [InteractionUtils.createErrorEmbed("Winners must be a number greater than 0!")],
      ephemeral: true,
    });
  }

  // Get channel
  let giveawayChannel = interaction.channel;
  if (channelId) {
    const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return interaction.followUp({
        embeds: [InteractionUtils.createErrorEmbed("Invalid channel ID! Must be a text channel.")],
        ephemeral: true,
      });
    }
    giveawayChannel = channel;
  }

  // Check permissions
  const perms = ["ViewChannel", "SendMessages", "EmbedLinks"];
  if (!giveawayChannel.permissionsFor(interaction.guild.members.me).has(perms)) {
    return interaction.followUp({
      embeds: [
        InteractionUtils.createErrorEmbed(
          `I need \`${perms.join(", ")}\` permissions in ${giveawayChannel}!`
        ),
      ],
      ephemeral: true,
    });
  }

  // Get host
  let host = interaction.user;
  if (hostId) {
    const hostUser = await interaction.client.users.fetch(hostId).catch(() => null);
    if (!hostUser) {
      return interaction.followUp({
        embeds: [InteractionUtils.createErrorEmbed("Invalid host user ID!")],
        ephemeral: true,
      });
    }
    host = hostUser;
  }

  // Show confirmation
  await showGiveawayConfirmation(interaction, {
    prize,
    duration,
    durationStr,
    winners,
    channel: giveawayChannel,
    host,
  });
}

/**
 * Show giveaway confirmation
 */
async function showGiveawayConfirmation(interaction, data) {
  const embed = InteractionUtils.createThemedEmbed({
    title: "🎉 Giveaway Preview",
    description: "Review your giveaway settings:",
    fields: [
      { name: "Prize", value: data.prize, inline: false },
      { name: "Duration", value: data.durationStr, inline: true },
      { name: "Winners", value: data.winners.toString(), inline: true },
      { name: "Channel", value: data.channel.toString(), inline: true },
      { name: "Host", value: data.host.toString(), inline: true },
    ],
    footer: "Confirm to start the giveaway",
    timestamp: true,
  });

  const row = InteractionUtils.createButtonRow([
    {
      customId: "confirm_giveaway",
      label: "Start Giveaway",
      emoji: "✅",
      style: ButtonStyle.Success,
    },
    {
      customId: "cancel_giveaway",
      label: "Cancel",
      emoji: "❌",
      style: ButtonStyle.Danger,
    },
  ]);

  const msg = await interaction.followUp({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });

  const btnInteraction = await InteractionUtils.awaitComponent(
    msg,
    interaction.user.id,
    { componentType: ComponentType.Button },
    60000
  );

  if (!btnInteraction) {
    return msg.edit({
      embeds: [InteractionUtils.createErrorEmbed("Confirmation timed out.")],
      components: [],
    });
  }

  if (btnInteraction.customId === "cancel_giveaway") {
    await btnInteraction.update({
      embeds: [InteractionUtils.createWarningEmbed("Giveaway cancelled.")],
      components: [],
    });
    return;
  }

  await btnInteraction.deferUpdate();
  await startGiveaway(interaction, data, msg);
}

/**
 * Start the giveaway
 */
async function startGiveaway(interaction, data, confirmMsg) {
  try {
    const options = {
      duration: data.duration,
      prize: data.prize,
      winnerCount: data.winners,
      hostedBy: data.host,
      thumbnail: "https://i.imgur.com/DJuTuxs.png",
      messages: {
        giveaway: "🎉 **GIVEAWAY** 🎉",
        giveawayEnded: "🎉 **GIVEAWAY ENDED** 🎉",
        inviteToParticipate: "React with 🎁 to enter!",
        winMessage: "Congratulations, {winners}! You won **{this.prize}**!",
        embedFooter: "Giveaway Time!",
        noWinner: "Giveaway cancelled, no valid participants.",
        hostedBy: `\nHosted by: ${data.host.tag}`,
        winners: "Winner(s):",
        endedAt: "Ended at",
      },
    };

    const giveaway = await interaction.client.giveawaysManager.start(data.channel, options);

    const successEmbed = InteractionUtils.createThemedEmbed({
      title: "✅ Giveaway Started!",
      description: `Your giveaway has been started in ${data.channel}`,
      fields: [
        { name: "Prize", value: data.prize, inline: true },
        { name: "Duration", value: data.durationStr, inline: true },
        { name: "Winners", value: data.winners.toString(), inline: true },
        { name: "Message ID", value: giveaway.messageId || "N/A", inline: false },
      ],
      footer: "Use /gwin to add preset winners (owner only)",
      color: EMBED_COLORS.SUCCESS,
    });

    await confirmMsg.edit({
      embeds: [successEmbed],
      components: [],
    });
  } catch (error) {
    console.error("Giveaway start error:", error);
    await confirmMsg.edit({
      embeds: [InteractionUtils.createErrorEmbed(`Failed to start giveaway: ${error.message}`)],
      components: [],
    });
  }
}
