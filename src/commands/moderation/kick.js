const { kickTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType, MessageFlags, ComponentType } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");
const EMOJIS = require("@helpers/EmojiConstants");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "kick",
  description: "kicks the specified member",
  category: "MODERATION",
  botPermissions: ["KickMembers"],
  userPermissions: ["KickMembers"],
  command: {
    enabled: true,
    aliases: ["kickuser", "kickmember"],
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
        description: "reason for kick",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);
    const reason = message.content.split(args[0])[1]?.trim() || "No reason provided";
    const response = await kick(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await kick(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function kick(issuer, target, reason) {
  const response = await kickTarget(issuer, target, reason);
  
  const targetUser = target.user || target;
  const targetUsername = targetUser.username || target.username;
  
  if (typeof response === "boolean") {
    const container = {
      type: ComponentType.Container,
      accent_color: 0x57F287,
      components: [
        {
          type: ComponentType.Section,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `# ✅ Member Kicked\n\nSuccessfully removed member from the server.`
            }
          ],
          accessory: {
            type: ComponentType.Thumbnail,
            media: { url: targetUser.displayAvatarURL() },
            description: `${targetUsername} Avatar`
          }
        },
        {
          type: ComponentType.Separator,
          divider: true,
          spacing: 2
        },
        {
          type: ComponentType.TextDisplay,
          content: `### 📋 Action Details\n\n**User:** ${targetUsername}\n**Action:** Kicked from server\n**Reason:** ${reason || "No reason provided"}`
        },
        {
          type: ComponentType.Separator,
          divider: false,
          spacing: 1
        },
        {
          type: ComponentType.TextDisplay,
          content: `*Kicked by ${issuer.user.username}* • <t:${Math.floor(Date.now() / 1000)}:R>`
        }
      ]
    };
    return { components: [container], flags: MessageFlags.IsComponentsV2 };
  }
  
  if (response === "BOT_PERM") {
    return ModernEmbed.error(
      "Permission Denied",
      `I do not have permission to kick **${targetUsername}**. Please ensure I have the proper role hierarchy.`,
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
    `Failed to kick **${targetUsername}**. Please try again or contact an administrator.`,
    `Requested by ${issuer.user.username}`
  );
}
