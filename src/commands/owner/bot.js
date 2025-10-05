const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS, OWNER_IDS } = require("@root/config");
const { getSettings } = require("@schemas/Guild");
const EMOJIS = require("@helpers/EmojiConstants");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "bot",
  description: "Grant full bot access to a user (owner only)",
  category: "OWNER",
  botPermissions: ["EmbedLinks"],
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
        description: "The user to grant bot access",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.safeReply("Please provide a valid user to grant bot access.");
    }

    if (OWNER_IDS.includes(target.id)) {
      return message.safeReply(`${EMOJIS.WARN} | ${target.user.tag} is already a bot owner!`);
    }

    const settings = await getSettings(message.guild);
    
    if (!settings.developers) settings.developers = [];
    
    if (settings.developers.includes(target.id)) {
      return message.safeReply(`${EMOJIS.WARN} | ${target.user.tag} already has bot access!`);
    }

    settings.developers.push(target.id);
    await settings.save();

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(
        `${EMOJIS.SUCCESS} | **Bot Access Granted**\n\n` +
        `**User:** ${target.user.tag}\n` +
        `**Permissions:**\n` +
        `• Can use commands without prefix\n` +
        `• Full command access (except owner commands)\n` +
        `• All bot features enabled`
      )
      .setTimestamp()
      .setFooter({ text: `Granted by ${message.author.tag}` });

    return message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const target = interaction.options.getMember("user");
    
    if (!target) {
      return interaction.followUp({
        content: "User not found in this server.",
        ephemeral: true,
      });
    }

    if (OWNER_IDS.includes(target.id)) {
      return interaction.followUp({
        content: `${EMOJIS.WARN} | ${target.user.tag} is already a bot owner!`,
        ephemeral: true,
      });
    }

    const settings = await getSettings(interaction.guild);
    
    if (!settings.developers) settings.developers = [];
    
    if (settings.developers.includes(target.id)) {
      return interaction.followUp({
        content: `${EMOJIS.WARN} | ${target.user.tag} already has bot access!`,
        ephemeral: true,
      });
    }

    settings.developers.push(target.id);
    await settings.save();

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(
        `${EMOJIS.SUCCESS} | **Bot Access Granted**\n\n` +
        `**User:** ${target.user.tag}\n` +
        `**Permissions:**\n` +
        `• Can use commands without prefix\n` +
        `• Full command access (except owner commands)\n` +
        `• All bot features enabled`
      )
      .setTimestamp()
      .setFooter({ text: `Granted by ${interaction.user.tag}` });

    return interaction.followUp({ embeds: [embed] });
  },
};
