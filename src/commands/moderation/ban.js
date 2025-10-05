const { banTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType, MessageFlags, ComponentType } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");
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
  
  const targetUser = target.user || target;
  const targetUsername = targetUser.username || target.username;
  
  if (typeof response === "boolean") {
    const container = {
      type: ComponentType.Container,
      accent_color: 0xED4245,
      components: [
        {
          type: ComponentType.Section,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `# 🔨 Member Banned\n\nUser has been permanently banned from the server.`
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
          content: `### 📋 Ban Details\n\n**User:** ${targetUsername}\n**Action:** Permanently banned\n**Reason:** ${reason || "No reason provided"}`
        },
        {
          type: ComponentType.Separator,
          divider: false,
          spacing: 1
        },
        {
          type: ComponentType.TextDisplay,
          content: `*Banned by ${issuer.user.username}* • <t:${Math.floor(Date.now() / 1000)}:R>`
        }
      ]
    };
    return { components: [container], flags: MessageFlags.IsComponentsV2 };
  }
  
  if (response === "BOT_PERM") {
    return ModernEmbed.error(
      "Missing Permissions",
      `You're missing the **Ban Members** permission. Please contact a server administrator.`,
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
