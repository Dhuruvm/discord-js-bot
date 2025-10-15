const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "greroll",
  description: "Reroll a giveaway to pick new winner(s)",
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
        description: "The message ID of the giveaway to reroll",
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

    if (!giveaway.ended) {
      return message.safeReply("❌ This giveaway hasn't ended yet! Use `gend` to end it first.");
    }

    try {
      await giveaway.reroll();
      return message.safeReply("✅ Giveaway rerolled successfully!");
    } catch (error) {
      message.client.logger.error("Giveaway Reroll", error);
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

    if (!giveaway.ended) {
      return interaction.followUp("❌ This giveaway hasn't ended yet! Use `/gend` to end it first.");
    }

    try {
      await giveaway.reroll();
      return interaction.followUp("✅ Giveaway rerolled successfully!");
    } catch (error) {
      interaction.client.logger.error("Giveaway Reroll", error);
      return interaction.followUp(`❌ An error occurred: ${error.message}`);
    }
  },
};
