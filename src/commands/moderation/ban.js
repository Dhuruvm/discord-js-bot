const { banTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");

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
    aliases: ["banuser", "banmember"],
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
    const reason = message.content.split(args[0])[1]?.trim() || "No reason provided";
    const response = await ban(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";

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
  
  const targetUser = target.user || target;
  const targetUsername = targetUser.username || target.username;
  
  if (typeof response === "boolean") {
    const embed = new ModernEmbed()
      .setColor(0xFFFFFF)
      .setHeader("🔨 Member Banned", `User has been permanently banned from the server.`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addField("📋 Ban Details", `**User:** ${targetUsername}\n**Action:** Permanently banned\n**Reason:** ${reason || "No reason provided"}`, false)
      .setFooter(`Banned by ${issuer.user.username}`)
      .setTimestamp()
      .addButton({
        customId: 'view-modlogs',
        label: 'View Mod Logs',
        style: 'Secondary',
        emoji: '📜'
      })
      .addButton({
        customId: 'appeal-info',
        label: 'Appeal Info',
        style: 'Secondary',
        emoji: 'ℹ️'
      });
    
    return embed.toMessage();
  }
  
  if (response === "BOT_PERM") {
    return ModernEmbed.error(
      "Bot Missing Permissions",
      `I don't have permission to ban **${targetUsername}**. Please ensure I have the **Ban Members** permission and a role higher than the target user.`,
      `Requested by ${issuer.user.username}`
    );
  }
  
  if (response === "MEMBER_PERM") {
    return ModernEmbed.error(
      "Insufficient Permissions",
      `You need to have a higher role than **${targetUsername}** to execute this command.`,
      `Requested by ${issuer.user.username}`
    );
  }
  
  return ModernEmbed.error(
    "Action Failed",
    `Failed to ban **${targetUsername}**. Please try again or contact an administrator.`,
    `Requested by ${issuer.user.username}`
  );
}
