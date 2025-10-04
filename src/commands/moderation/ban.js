const { banTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const EMOJIS = require("@helpers/EmojiConstants");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ban",
  description: "bans the specified member",
  category: "MODERATION",
  botPermissions: ["BanMembers"],
  userPermissions: ["BanMembers"],
  command: {
    enabled: true,
    usage: "<ID|@member> [reason]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "the target member",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "reason for ban",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const match = await message.client.resolveUsers(args[0], true);
    const target = match[0];
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = message.content.split(args[0])[1].trim();
    const response = await ban(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    const response = await ban(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

/**
 * @param {import('discord.js').GuildMember} issuer
 * @param {import('discord.js').User} target
 * @param {string} reason
 */
async function ban(issuer, target, reason) {
  const response = await banTarget(issuer, target, reason);
  
  if (typeof response === "boolean") {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(`${EMOJIS.BAN} | **${target.username}** has been banned!`)
      .addFields({ name: "Reason", value: reason || "No reason provided", inline: false })
      .setTimestamp();
    return { embeds: [embed] };
  }
  
  if (response === "BOT_PERM") {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(`${EMOJIS.ERROR} | I do not have permission to ban **${target.username}**!`)
      .setTimestamp();
    return { embeds: [embed] };
  }
  
  if (response === "MEMBER_PERM") {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(`${EMOJIS.ERROR} | You need to have a higher role than me to execute this command!`)
      .setTimestamp();
    return { embeds: [embed] };
  }
  
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.ERROR)
    .setDescription(`${EMOJIS.ERROR} | Failed to ban **${target.username}**`)
    .setTimestamp();
  return { embeds: [embed] };
}
