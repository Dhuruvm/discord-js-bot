const { softbanTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "softban",
  description: "softban the specified member. Kicks and deletes messages",
  category: "MODERATION",
  botPermissions: ["BanMembers"],
  userPermissions: ["KickMembers"],
  command: {
    enabled: true,
    aliases: ["soft", "softb"],
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
        description: "reason for softban",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = message.content.split(args[0])[1].trim();
    const response = await softban(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await softban(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function softban(issuer, target, reason) {
  const response = await softbanTarget(issuer, target, reason);

  const targetUsername = target.user?.username || target.username;

  if (typeof response === "boolean") {
    return ModernEmbed.success(
      "Member Softbanned",
      `**${targetUsername}** has been softbanned (banned and unbanned to clear messages).\n**Reason:** ${reason || "No reason provided"}`,
      `Softbanned by ${issuer.user.username}`
    );
  }

  if (response === "BOT_PERM") {
    return ModernEmbed.simpleError(
      `I don't have permission to softban ${targetUsername}. Please ensure I have a role higher than the target user.`
    );
  }

  if (response === "MEMBER_PERM") {
    return ModernEmbed.simpleError(
      `You need to have a higher role than ${targetUsername} to execute this command!`
    );
  }

  return ModernEmbed.simpleError(
    `Failed to softban **${targetUsername}**. Please try again or contact an administrator.`
  );
}