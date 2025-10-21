const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings, updateSettings } = require("@schemas/Guild");
const InteractionUtils = require("@helpers/InteractionUtils");
const { EMBED_COLORS } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "greaction",
  description: "Set custom reaction emoji for giveaways",
  category: "GIVEAWAY",
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "<emoji>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "emoji",
        description: "The emoji to use for giveaways (default, custom, or Unicode emoji)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const emoji = args[0];
    const response = await setGiveawayReaction(message, emoji);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    await interaction.deferReply();
    const emoji = interaction.options.getString("emoji");
    const response = await setGiveawayReaction(interaction, emoji);
    await interaction.followUp(response);
  },
};

/**
 * Set giveaway reaction emoji
 */
async function setGiveawayReaction(context, emoji) {
  const { guild } = context;

  // Validate emoji
  if (!emoji) {
    return {
      embeds: [InteractionUtils.createErrorEmbed("Please provide an emoji!")],
    };
  }

  // Check if it's "default" to reset to default emoji
  if (emoji.toLowerCase() === "default") {
    // Reset to config default (don't mutate the shared config)
    const settings = await getSettings(guild);
    settings.giveaway_reaction = null;
    await settings.save();

    const defaultEmoji = require("@root/config").GIVEAWAYS.REACTION || "🎁";
    
    return {
      embeds: [
        InteractionUtils.createSuccessEmbed(
          `Giveaway reaction emoji has been reset to default: ${defaultEmoji}`
        ),
      ],
    };
  }

  // Validate if it's a valid emoji (Unicode or custom)
  const emojiRegex = /^(?:<a?:\w+:\d+>|[\p{Emoji}\u200d]+)$/u;
  if (!emojiRegex.test(emoji)) {
    return {
      embeds: [
        InteractionUtils.createErrorEmbed(
          "Invalid emoji! Please provide a valid Unicode emoji or custom server emoji."
        ),
      ],
    };
  }

  // Extract custom emoji ID if it's a custom emoji
  let emojiToSave = emoji;
  const customEmojiMatch = emoji.match(/<a?:(\w+):(\d+)>/);
  if (customEmojiMatch) {
    const emojiId = customEmojiMatch[2];
    const emojiObj = guild.emojis.cache.get(emojiId);
    
    if (!emojiObj) {
      return {
        embeds: [
          InteractionUtils.createErrorEmbed(
            "Custom emoji must be from this server! Please use a server emoji or Unicode emoji."
          ),
        ],
      };
    }
    
    emojiToSave = emoji; // Store the full emoji format
  }

  // Save to database (don't mutate the shared config object)
  const settings = await getSettings(guild);
  settings.giveaway_reaction = emojiToSave;
  await settings.save();

  const defaultEmoji = require("@root/config").GIVEAWAYS.REACTION || "🎁";

  return {
    embeds: [
      InteractionUtils.createThemedEmbed({
        title: "✅ Giveaway Reaction Updated",
        description: `Giveaway reaction emoji has been set to: ${emojiToSave}`,
        fields: [
          {
            name: "Note",
            value: "This emoji will be used for all new giveaways in this server. Existing giveaways will keep their current reaction.",
            inline: false,
          },
          {
            name: "Usage",
            value: `Use \`greaction default\` to reset to the default emoji (${defaultEmoji})`,
            inline: false,
          },
        ],
        color: EMBED_COLORS.SUCCESS,
        timestamp: true,
      }),
    ],
  };
}
