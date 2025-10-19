const { ApplicationCommandOptionType } = require("discord.js");
const emojis = require("@root/emojis.json");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "gwin",
  description: "Add preset winners to a giveaway (Owner only)",
  category: "OWNER",
  botPermissions: ["SendMessages"],
  command: {
    enabled: true,
    usage: "add/remove/list <message_id> [@user]",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "add",
        description: "Add a preset winner to a giveaway",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "The message ID of the giveaway",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "user",
            description: "The user to add as a preset winner",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "Remove a preset winner from a giveaway",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "The message ID of the giveaway",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "user",
            description: "The user to remove as a preset winner",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: "list",
        description: "List all preset winners for a giveaway",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "The message ID of the giveaway",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const subCmd = args[0]?.toLowerCase();
    const messageId = args[1];

    if (!messageId) {
      return message.safeReply(`${emojis.error} Please provide a giveaway message ID!`);
    }

    const giveaway = message.client.giveawaysManager.giveaways.find(
      (g) => g.messageId === messageId && g.guildId === message.guild.id
    );

    if (!giveaway) {
      return message.safeReply(`${emojis.error} Could not find a giveaway with message ID: \`${messageId}\``);
    }

    if (giveaway.ended) {
      return message.safeReply(`${emojis.error} Cannot modify preset winners for an ended giveaway!`);
    }

    if (subCmd === "add") {
      const user = await message.guild.members.fetch(args[2]?.replace(/[<@!>]/g, "")).catch(() => null);
      
      if (!user) {
        return message.safeReply(`${emojis.error} Please provide a valid user mention or ID!`);
      }

      // Initialize preset winners array if it doesn't exist
      if (!giveaway.extraData) {
        giveaway.extraData = {};
      }
      if (!giveaway.extraData.presetWinners) {
        giveaway.extraData.presetWinners = [];
      }

      if (giveaway.extraData.presetWinners.includes(user.id)) {
        return message.safeReply(`${emojis.error} ${user.user.tag} is already a preset winner!`);
      }

      giveaway.extraData.presetWinners.push(user.id);

      try {
        message.client.logger.debug(`[GWIN DEBUG] Adding preset winner ${user.id} for giveaway ${messageId}`);
        message.client.logger.debug(`[GWIN DEBUG] Current presetWinners array:`, giveaway.extraData.presetWinners);
        
        await giveaway.edit({
          newExtraData: giveaway.extraData,
        });
        
        message.client.logger.debug(`[GWIN DEBUG] Giveaway edited successfully. Verifying save...`);
        
        // Verify the data was saved by fetching the giveaway again
        const verifyGiveaway = message.client.giveawaysManager.giveaways.find(
          (g) => g.messageId === messageId && g.guildId === message.guild.id
        );
        message.client.logger.debug(`[GWIN DEBUG] Verification - presetWinners after save:`, verifyGiveaway?.extraData?.presetWinners);
        
        return message.safeReply(`${emojis.success} Added ${user.user.tag} as a preset winner for the giveaway!`);
      } catch (error) {
        message.client.logger.error("Giveaway Preset Winner Add", error);
        return message.safeReply(`${emojis.error} An error occurred: ${error.message}`);
      }
    } else if (subCmd === "remove") {
      const user = await message.guild.members.fetch(args[2]?.replace(/[<@!>]/g, "")).catch(() => null);
      
      if (!user) {
        return message.safeReply(`${emojis.error} Please provide a valid user mention or ID!`);
      }

      if (!giveaway.extraData?.presetWinners || !giveaway.extraData.presetWinners.includes(user.id)) {
        return message.safeReply(`${emojis.error} ${user.user.tag} is not a preset winner!`);
      }

      giveaway.extraData.presetWinners = giveaway.extraData.presetWinners.filter(id => id !== user.id);

      try {
        await giveaway.edit({
          newExtraData: giveaway.extraData,
        });
        return message.safeReply(`${emojis.success} Removed ${user.user.tag} from preset winners!`);
      } catch (error) {
        message.client.logger.error("Giveaway Preset Winner Remove", error);
        return message.safeReply(`${emojis.error} An error occurred: ${error.message}`);
      }
    } else if (subCmd === "list") {
      if (!giveaway.extraData?.presetWinners || giveaway.extraData.presetWinners.length === 0) {
        return message.safeReply(`${emojis.clipboard} No preset winners for this giveaway.`);
      }

      const winners = await Promise.all(
        giveaway.extraData.presetWinners.map(async (id) => {
          const user = await message.client.users.fetch(id).catch(() => null);
          return user ? user.tag : `Unknown User (${id})`;
        })
      );

      return message.safeReply(
        `${emojis.clipboard} **Preset Winners:**\n\n` +
        `${winners.map((w, i) => `${i + 1}. ${w}`).join("\n")}`
      );
    } else {
      return message.safeReply(`${emojis.error} Invalid subcommand! Use: \`gwin add/remove/list <message_id> [@user]\``);
    }
  },

  async interactionRun(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const subCmd = interaction.options.getSubcommand();
    const messageId = interaction.options.getString("message_id");

    const giveaway = interaction.client.giveawaysManager.giveaways.find(
      (g) => g.messageId === messageId && g.guildId === interaction.guild.id
    );

    if (!giveaway) {
      return interaction.editReply(`${emojis.error} Could not find a giveaway with message ID: \`${messageId}\``);
    }

    if (giveaway.ended) {
      return interaction.editReply(`${emojis.error} Cannot modify preset winners for an ended giveaway!`);
    }

    if (subCmd === "add") {
      const user = interaction.options.getUser("user");

      // Initialize preset winners array if it doesn't exist
      if (!giveaway.extraData) {
        giveaway.extraData = {};
      }
      if (!giveaway.extraData.presetWinners) {
        giveaway.extraData.presetWinners = [];
      }

      if (giveaway.extraData.presetWinners.includes(user.id)) {
        return interaction.editReply(`${emojis.error} ${user.tag} is already a preset winner!`);
      }

      giveaway.extraData.presetWinners.push(user.id);

      try {
        interaction.client.logger.debug(`[GWIN DEBUG] Adding preset winner ${user.id} for giveaway ${messageId}`);
        interaction.client.logger.debug(`[GWIN DEBUG] Current presetWinners array:`, giveaway.extraData.presetWinners);
        
        await giveaway.edit({
          newExtraData: giveaway.extraData,
        });
        
        interaction.client.logger.debug(`[GWIN DEBUG] Giveaway edited successfully. Verifying save...`);
        
        // Verify the data was saved by fetching the giveaway again
        const verifyGiveaway = interaction.client.giveawaysManager.giveaways.find(
          (g) => g.messageId === messageId && g.guildId === interaction.guild.id
        );
        interaction.client.logger.debug(`[GWIN DEBUG] Verification - presetWinners after save:`, verifyGiveaway?.extraData?.presetWinners);
        
        return interaction.editReply(`${emojis.success} Added ${user.tag} as a preset winner for the giveaway!`);
      } catch (error) {
        interaction.client.logger.error("Giveaway Preset Winner Add", error);
        return interaction.editReply(`${emojis.error} An error occurred: ${error.message}`);
      }
    } else if (subCmd === "remove") {
      const user = interaction.options.getUser("user");

      if (!giveaway.extraData?.presetWinners || !giveaway.extraData.presetWinners.includes(user.id)) {
        return interaction.editReply(`${emojis.error} ${user.tag} is not a preset winner!`);
      }

      giveaway.extraData.presetWinners = giveaway.extraData.presetWinners.filter(id => id !== user.id);

      try {
        await giveaway.edit({
          newExtraData: giveaway.extraData,
        });
        return interaction.editReply(`${emojis.success} Removed ${user.tag} from preset winners!`);
      } catch (error) {
        interaction.client.logger.error("Giveaway Preset Winner Remove", error);
        return interaction.editReply(`${emojis.error} An error occurred: ${error.message}`);
      }
    } else if (subCmd === "list") {
      if (!giveaway.extraData?.presetWinners || giveaway.extraData.presetWinners.length === 0) {
        return interaction.editReply(`${emojis.clipboard} No preset winners for this giveaway.`);
      }

      const winners = await Promise.all(
        giveaway.extraData.presetWinners.map(async (id) => {
          const user = await interaction.client.users.fetch(id).catch(() => null);
          return user ? user.tag : `Unknown User (${id})`;
        })
      );

      return interaction.editReply(
        `${emojis.clipboard} **Preset Winners:**\n\n` +
        `${winners.map((w, i) => `${i + 1}. ${w}`).join("\n")}`
      );
    }
  },
};
