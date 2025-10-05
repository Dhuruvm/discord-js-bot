const { warnTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "warn",
  description: "warns the specified member",
  category: "MODERATION",
  userPermissions: ["KickMembers"],
  command: {
    enabled: true,
    aliases: ["warning", "addwarn"],
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
        description: "reason for warn",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = message.content.split(args[0])[1]?.trim() || "No reason provided";
    const response = await warn(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const target = await interaction.guild.members.fetch(user.id);

    const response = await warn(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function warn(issuer, target, reason) {
  const response = await warnTarget(issuer, target, reason);
  
  const targetUser = target.user || target;
  const targetUsername = targetUser.username || target.username;
  
  if (typeof response === "boolean") {
    return ModernEmbed.warning(
      "Member Warned",
      `**${targetUsername}** has been warned.\n**Reason:** ${reason || "No reason provided"}`,
      `Warned by ${issuer.user.username}`
    );
  }
  
  if (response === "BOT_PERM") {
    return ModernEmbed.simpleError(
      `I do not have permission to warn ${targetUsername}.`
    );
  }
  
  if (response === "MEMBER_PERM") {
    return ModernEmbed.simpleError(
      `You need to have a higher role than me to execute this command.!`
    );
  }
  
  return ModernEmbed.simpleError(
    `Failed to warn ${targetUsername}.`
  );
}
