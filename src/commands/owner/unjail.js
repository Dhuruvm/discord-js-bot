
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const EMOJIS = require("@helpers/EmojiConstants");
const { jailedUsers } = require("./jail");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "unjail",
  description: "Unlock a user from voice channel jail (owner only)",
  category: "OWNER",
  command: {
    enabled: true,
    usage: "<@user>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The user to unjail",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.safeReply("Please provide a valid user to unjail.");
    }

    const response = await unjailUser(target, message.member);
    return message.safeReply(response);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getMember("user");
    
    if (!target) {
      return interaction.followUp({
        content: "User not found in this server.",
        ephemeral: true,
      });
    }

    const response = await unjailUser(target, interaction.member);
    return interaction.followUp(response);
  },
};

async function unjailUser(target, issuer) {
  if (!jailedUsers.has(target.id)) {
    return `${EMOJIS.WARN} | ${target.user.tag} is not jailed!`;
  }

  jailedUsers.delete(target.id);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(
      `${EMOJIS.SUCCESS} | **User Unjailed**\n\n` +
      `**User:** ${target.user.tag}\n` +
      `**Unjailed by:** ${issuer.user.tag}\n\n` +
      `This user can now freely move between voice channels.`
    )
    .setTimestamp();

  return { embeds: [embed] };
}
