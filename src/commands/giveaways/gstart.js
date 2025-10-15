const { ChannelType, ApplicationCommandOptionType } = require("discord.js");
const ems = require("enhanced-ms");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "gstart",
  description: "Start a new giveaway",
  category: "GIVEAWAY",
  botPermissions: ["SendMessages", "EmbedLinks"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "<duration> <winners> <prize> [#channel]",
    minArgsCount: 3,
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [
      {
        name: "duration",
        description: "Duration of the giveaway (e.g., 1h, 1d, 1w)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "winners",
        description: "Number of winners",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        minValue: 1,
      },
      {
        name: "prize",
        description: "The prize for the giveaway",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "channel",
        description: "Channel to host the giveaway (defaults to current channel)",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText],
        required: false,
      },
      {
        name: "host",
        description: "User hosting the giveaway (defaults to you)",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const duration = ems(args[0]);
    if (!duration) {
      return message.safeReply("❌ Invalid duration! Examples: `1h`, `1d`, `1w`, `30m`");
    }

    const winners = parseInt(args[1]);
    if (isNaN(winners) || winners < 1) {
      return message.safeReply("❌ Invalid number of winners! Must be at least 1.");
    }

    // Get prize (everything after winners, or until channel mention)
    let prizeEndIndex = args.length;
    let channelArg = null;
    
    // Check if last argument is a channel mention
    if (args[args.length - 1].match(/<#(\d+)>/)) {
      channelArg = args[args.length - 1];
      prizeEndIndex = args.length - 1;
    }

    const prize = args.slice(2, prizeEndIndex).join(" ");
    if (!prize) {
      return message.safeReply("❌ Please provide a prize for the giveaway!");
    }

    let giveawayChannel = message.channel;
    if (channelArg) {
      const match = message.guild.findMatchingChannels(channelArg);
      if (!match.length) {
        return message.safeReply(`❌ Could not find channel ${channelArg}`);
      }
      giveawayChannel = match[0];
    }

    if (giveawayChannel.type !== ChannelType.GuildText) {
      return message.safeReply("❌ Giveaways can only be hosted in text channels!");
    }

    const perms = ["ViewChannel", "SendMessages", "EmbedLinks"];
    if (!giveawayChannel.permissionsFor(message.guild.members.me).has(perms)) {
      return message.safeReply(`❌ I need \`${perms.join(", ")}\` permissions in ${giveawayChannel}`);
    }

    try {
      const options = {
        duration: duration,
        prize: prize,
        winnerCount: winners,
        hostedBy: message.author,
        thumbnail: "https://i.imgur.com/DJuTuxs.png",
        messages: {
          giveaway: "🎉 **GIVEAWAY** 🎉",
          giveawayEnded: "🎉 **GIVEAWAY ENDED** 🎉",
          inviteToParticipate: "React with 🎁 to enter!",
          winMessage: "Congratulations, {winners}! You won **{this.prize}**!",
          embedFooter: "Giveaway Time!",
          noWinner: "Giveaway cancelled, no valid participants.",
          hostedBy: `\nHosted by: ${message.author.tag}`,
          winners: "Winner(s):",
          endedAt: "Ended at",
        },
      };

      await message.client.giveawaysManager.start(giveawayChannel, options);
      return message.safeReply(`✅ Giveaway started in ${giveawayChannel}!\n**Prize:** ${prize}\n**Duration:** ${args[0]}\n**Winners:** ${winners}`);
    } catch (error) {
      message.client.logger.error("Giveaway Start", error);
      return message.safeReply(`❌ An error occurred: ${error.message}`);
    }
  },

  async interactionRun(interaction) {
    const duration = ems(interaction.options.getString("duration"));
    if (!duration) {
      return interaction.followUp("❌ Invalid duration! Examples: `1h`, `1d`, `1w`, `30m`");
    }

    const winners = interaction.options.getInteger("winners");
    if (winners < 1) {
      return interaction.followUp("❌ Number of winners must be at least 1!");
    }

    const prize = interaction.options.getString("prize");
    const giveawayChannel = interaction.options.getChannel("channel") || interaction.channel;
    const host = interaction.options.getUser("host") || interaction.user;

    if (giveawayChannel.type !== ChannelType.GuildText) {
      return interaction.followUp("❌ Giveaways can only be hosted in text channels!");
    }

    const perms = ["ViewChannel", "SendMessages", "EmbedLinks"];
    if (!giveawayChannel.permissionsFor(interaction.guild.members.me).has(perms)) {
      return interaction.followUp(`❌ I need \`${perms.join(", ")}\` permissions in ${giveawayChannel}`);
    }

    try {
      const options = {
        duration: duration,
        prize: prize,
        winnerCount: winners,
        hostedBy: host,
        thumbnail: "https://i.imgur.com/DJuTuxs.png",
        messages: {
          giveaway: "🎉 **GIVEAWAY** 🎉",
          giveawayEnded: "🎉 **GIVEAWAY ENDED** 🎉",
          inviteToParticipate: "React with 🎁 to enter!",
          winMessage: "Congratulations, {winners}! You won **{this.prize}**!",
          embedFooter: "Giveaway Time!",
          noWinner: "Giveaway cancelled, no valid participants.",
          hostedBy: `\nHosted by: ${host.tag}`,
          winners: "Winner(s):",
          endedAt: "Ended at",
        },
      };

      await interaction.client.giveawaysManager.start(giveawayChannel, options);
      return interaction.followUp(`✅ Giveaway started in ${giveawayChannel}!\n**Prize:** ${prize}\n**Duration:** ${interaction.options.getString("duration")}\n**Winners:** ${winners}`);
    } catch (error) {
      interaction.client.logger.error("Giveaway Start", error);
      return interaction.followUp(`❌ An error occurred: ${error.message}`);
    }
  },
};
