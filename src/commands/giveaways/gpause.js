const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "gpause",
  description: "Pause an active giveaway",
  category: "GIVEAWAY",
  botPermissions: ["SendMessages", "EmbedLinks"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "<message_id>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [
      {
        name: "message_id",
        description: "The message ID of the giveaway to pause",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const messageId = args[0];
    
    if (!messageId) {
      return message.safeReply("❌ Please provide a valid message ID!");
    }

    const giveaway = message.client.giveawaysManager.giveaways.find(
      (g) => g.messageId === messageId && g.guildId === message.guild.id
    );

    if (!giveaway) {
      return message.safeReply(`❌ Could not find a giveaway with message ID: \`${messageId}\``);
    }

    if (giveaway.ended) {
      return message.safeReply("❌ This giveaway has already ended!");
    }

    if (giveaway.pauseOptions?.isPaused) {
      return message.safeReply("❌ This giveaway is already paused!");
    }

    try {
      await giveaway.pause();
      return message.safeReply("✅ Giveaway paused successfully!");
    } catch (error) {
      message.client.logger.error("Giveaway Pause", error);
      return message.safeReply(`❌ An error occurred: ${error.message}`);
    }
  },

  async interactionRun(interaction) {
    const messageId = interaction.options.getString("message_id");

    const giveaway = interaction.client.giveawaysManager.giveaways.find(
      (g) => g.messageId === messageId && g.guildId === interaction.guild.id
    );

    if (!giveaway) {
      return interaction.followUp(`❌ Could not find a giveaway with message ID: \`${messageId}\``);
    }

    if (giveaway.ended) {
      return interaction.followUp("❌ This giveaway has already ended!");
    }

    if (giveaway.pauseOptions?.isPaused) {
      return interaction.followUp("❌ This giveaway is already paused!");
    }

    try {
      await giveaway.pause();
      return interaction.followUp("✅ Giveaway paused successfully!");
    } catch (error) {
      interaction.client.logger.error("Giveaway Pause", error);
      return interaction.followUp(`❌ An error occurred: ${error.message}`);
    }
  },
};
