const { ApplicationCommandOptionType } = require("discord.js");
const ems = require("enhanced-ms");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "gedit",
  description: "Edit an active giveaway",
  category: "GIVEAWAY",
  botPermissions: ["SendMessages", "EmbedLinks"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "<message_id> <add_time/new_prize/new_winners> <value>",
    minArgsCount: 3,
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [
      {
        name: "message_id",
        description: "The message ID of the giveaway to edit",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "add_time",
        description: "Add time to the giveaway (e.g., 1h, 30m)",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "new_prize",
        description: "Change the prize",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "new_winners",
        description: "Change the number of winners",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        minValue: 1,
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
      return message.safeReply("❌ Cannot edit an ended giveaway!");
    }

    const editType = args[1]?.toLowerCase();
    const value = args.slice(2).join(" ");

    if (!editType || !value) {
      return message.safeReply("❌ Usage: `gedit <message_id> <add_time/new_prize/new_winners> <value>`");
    }

    try {
      if (editType === "add_time" || editType === "addtime" || editType === "time") {
        const addDuration = ems(value);
        if (!addDuration) {
          return message.safeReply("❌ Invalid duration! Examples: `1h`, `30m`, `1d`");
        }
        await giveaway.edit({
          addTime: addDuration,
        });
        return message.safeReply(`✅ Added ${value} to the giveaway duration!`);
      } 
      else if (editType === "new_prize" || editType === "prize") {
        await giveaway.edit({
          newPrize: value,
        });
        return message.safeReply(`✅ Prize updated to: **${value}**`);
      } 
      else if (editType === "new_winners" || editType === "winners") {
        const newWinners = parseInt(value);
        if (isNaN(newWinners) || newWinners < 1) {
          return message.safeReply("❌ Invalid number of winners!");
        }
        await giveaway.edit({
          newWinnerCount: newWinners,
        });
        return message.safeReply(`✅ Number of winners updated to: **${newWinners}**`);
      } 
      else {
        return message.safeReply("❌ Invalid edit type! Use: `add_time`, `new_prize`, or `new_winners`");
      }
    } catch (error) {
      message.client.logger.error("Giveaway Edit", error);
      return message.safeReply(`❌ An error occurred: ${error.message}`);
    }
  },

  async interactionRun(interaction) {
    const messageId = interaction.options.getString("message_id");
    const addTime = interaction.options.getString("add_time");
    const newPrize = interaction.options.getString("new_prize");
    const newWinners = interaction.options.getInteger("new_winners");

    if (!addTime && !newPrize && !newWinners) {
      return interaction.followUp("❌ Please provide at least one option to edit (add_time, new_prize, or new_winners)!");
    }

    const giveaway = interaction.client.giveawaysManager.giveaways.find(
      (g) => g.messageId === messageId && g.guildId === interaction.guild.id
    );

    if (!giveaway) {
      return interaction.followUp(`❌ Could not find a giveaway with message ID: \`${messageId}\``);
    }

    if (giveaway.ended) {
      return interaction.followUp("❌ Cannot edit an ended giveaway!");
    }

    try {
      const editOptions = {};
      const changes = [];

      if (addTime) {
        const addDuration = ems(addTime);
        if (!addDuration) {
          return interaction.followUp("❌ Invalid duration! Examples: `1h`, `30m`, `1d`");
        }
        editOptions.addTime = addDuration;
        changes.push(`Added ${addTime} to duration`);
      }

      if (newPrize) {
        editOptions.newPrize = newPrize;
        changes.push(`Prize changed to: ${newPrize}`);
      }

      if (newWinners) {
        editOptions.newWinnerCount = newWinners;
        changes.push(`Winners changed to: ${newWinners}`);
      }

      await giveaway.edit(editOptions);
      return interaction.followUp(`✅ Giveaway updated!\n${changes.map(c => `• ${c}`).join("\n")}`);
    } catch (error) {
      interaction.client.logger.error("Giveaway Edit", error);
      return interaction.followUp(`❌ An error occurred: ${error.message}`);
    }
  },
};
