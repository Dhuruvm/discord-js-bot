const {
  ChannelType,
  ComponentType,
  ButtonStyle,
  PermissionFlagsBits,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");
const ems = require("enhanced-ms");
const InteractionUtils = require("@helpers/InteractionUtils");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const { getSettings } = require("@schemas/Guild");
const { EMBED_COLORS, GIVEAWAYS } = require("@root/config");

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
      style: TextInputStyle.Short,
      placeholder: "What are you giving away?",
      required: true,
      minLength: 1,
      maxLength: 256,
    },
    {
      customId: "duration",
      label: "Duration",
      style: TextInputStyle.Short,
      placeholder: "e.g., 1h, 1d, 1w, 30m",
      required: true,
      value: "1d",
    },
    {
      customId: "winners",
      label: "Number of Winners",
      style: TextInputStyle.Short,
      placeholder: "How many winners?",
      required: true,
      value: "1",
    },
    {
      customId: "channel_id",
      label: "Channel ID (optional)",
      style: TextInputStyle.Short,
      placeholder: "Leave empty for current channel",
      required: false,
    },
    {
      customId: "host_id",
      label: "Host User ID (optional)",
      style: TextInputStyle.Short,
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
  await startGiveaway(interaction, data, btnInteraction);
}

/**
 * Create custom giveaway embed with Container design
 */
function createGiveawayEmbed(options) {
  const {
    prize,
    winnerCount,
    endTime,
    hostedBy,
    isEnded = false,
    winners = null,
    reaction = "🎁", // Pass the resolved reaction emoji from caller
  } = options;

  const endTimestamp = Math.floor(endTime.getTime() / 1000);
  
  if (isEnded) {
    // Ended giveaway embed with Container
    const components = [];
    
    components.push(ContainerBuilder.createTextDisplay(`# 🎉 GIVEAWAY ENDED 🎉`));
    components.push(ContainerBuilder.createTextDisplay(`## ${prize}`));
    components.push(ContainerBuilder.createSeparator());
    
    if (winners && winners.length > 0) {
      components.push(ContainerBuilder.createTextDisplay(`**Winner(s)**\n${winners.map(w => `<@${w}>`).join(", ")}`));
    } else {
      components.push(ContainerBuilder.createTextDisplay(`**Winner(s)**\nNo valid participants`));
    }
    
    components.push(ContainerBuilder.createTextDisplay(`**Ended**\n<t:${endTimestamp}:R>`));
    components.push(ContainerBuilder.createTextDisplay(`**Hosted by**\n${hostedBy}`));
    
    return new ContainerBuilder()
      .addContainer({ 
        accentColor: parseInt(GIVEAWAYS.END_EMBED?.replace("#", "0x") || "0xFF0000", 16),
        components 
      })
      .build();
  }
  
  // Active giveaway embed with Container
  const components = [];
  
  components.push(ContainerBuilder.createTextDisplay(`# 🎉 GIVEAWAY 🎉`));
  components.push(ContainerBuilder.createTextDisplay(`## ${prize}`));
  components.push(ContainerBuilder.createSeparator());
  components.push(ContainerBuilder.createTextDisplay(`**React with ${reaction} to enter!**`));
  components.push(ContainerBuilder.createTextDisplay(`**Winners:** ${winnerCount}`));
  components.push(ContainerBuilder.createTextDisplay(`**Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)`));
  components.push(ContainerBuilder.createTextDisplay(`**Hosted by:** ${hostedBy}`));
  
  return new ContainerBuilder()
    .addContainer({ 
      accentColor: parseInt(GIVEAWAYS.START_EMBED?.replace("#", "0x") || "0x00FF00", 16),
      components 
    })
    .build();
}

/**
 * Start the giveaway
 */
async function startGiveaway(interaction, data, btnInteraction) {
  try {
    const endTime = new Date(Date.now() + data.duration);
    
    // Get guild settings to check for custom reaction emoji
    const settings = await getSettings(interaction.guild);
    const reactionEmoji = settings.giveaway_reaction || GIVEAWAYS.REACTION || "🎁";
    
    // Create custom giveaway message with Container
    const giveawayMessage = createGiveawayEmbed({
      prize: data.prize,
      winnerCount: data.winners,
      endTime: endTime,
      hostedBy: data.host,
      reaction: reactionEmoji, // Pass the resolved emoji
    });

    const options = {
      duration: data.duration,
      prize: data.prize,
      winnerCount: data.winners,
      hostedBy: data.host,
      thumbnail: "https://i.imgur.com/DJuTuxs.png",
      reaction: reactionEmoji, // Use custom reaction from settings
      messages: {
        giveaway: "🎉 **GIVEAWAY** 🎉",
        giveawayEnded: "🎉 **GIVEAWAY ENDED** 🎉",
        inviteToParticipate: `React with ${reactionEmoji} to enter!`,
        winMessage: "Congratulations, {winners}! You won **{this.prize}**!",
        embedFooter: "Giveaway Time!",
        noWinner: "Giveaway cancelled, no valid participants.",
        hostedBy: `\nHosted by: ${data.host.tag}`,
        winners: "Winner(s):",
        endedAt: "Ended at",
      },
    };

    const giveaway = await interaction.client.giveawaysManager.start(data.channel, options);
    
    // Update the giveaway message to use Container design
    try {
      const message = await data.channel.messages.fetch(giveaway.messageId);
      await message.edit(giveawayMessage);
    } catch (err) {
      console.error("Failed to update giveaway message with Container design:", err);
    }

    const successEmbed = InteractionUtils.createThemedEmbed({
      title: "✅ Giveaway Started!",
      description: `Your giveaway has been started in ${data.channel}`,
      fields: [
        { name: "Prize", value: data.prize, inline: true },
        { name: "Duration", value: data.durationStr, inline: true },
        { name: "Winners", value: data.winners.toString(), inline: true },
        { name: "Reaction", value: reactionEmoji, inline: true },
        { name: "Message ID", value: giveaway.messageId || "N/A", inline: false },
      ],
      color: EMBED_COLORS.SUCCESS,
    });

    await btnInteraction.editReply({
      embeds: [successEmbed],
      components: [],
    });
  } catch (error) {
    console.error("Giveaway start error:", error);
    await btnInteraction.editReply({
      embeds: [InteractionUtils.createErrorEmbed(`Failed to start giveaway: ${error.message}`)],
      components: [],
    });
  }
}
