const { warnTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const EMOJIS = require("@helpers/EmojiConstants");

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
    const reason = interaction.options.getString("reason");
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
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setAuthor({ name: "Member Warned", iconURL: targetUser.displayAvatarURL() })
      .setDescription(
        `╭───── **Moderation Action** ─────╮\n\n` +
        `👤 **User:** ${targetUsername}\n` +
        `⚠️ **Action:** Warned\n` +
        `📝 **Reason:** ${reason || "No reason provided"}\n\n` +
        `╰────────────────────────╯`
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({ text: `Warned by ${issuer.user.username}`, iconURL: issuer.user.displayAvatarURL() })
      .setTimestamp();
    return { embeds: [embed] };
  }
  
  if (response === "BOT_PERM") {
    const embed = new EmbedBuilder()
      .setColor("#2B2D31");
    
    if (issuer?.user) {
      embed.setAuthor({ 
        name: issuer.user.username,
        iconURL: issuer.user.displayAvatarURL()
      });
    }
    
    embed.setDescription(`${EMOJIS.ERROR} | I do not have permission to warn **${targetUsername}**!`)
      .setTimestamp();
    return { embeds: [embed] };
  }
  
  if (response === "MEMBER_PERM") {
    const embed = new EmbedBuilder()
      .setColor("#2B2D31");
    
    if (issuer?.user) {
      embed.setAuthor({ 
        name: issuer.user.username,
        iconURL: issuer.user.displayAvatarURL()
      });
    }
    
    embed.setDescription(`${EMOJIS.ERROR} | You need to have a higher role than me to execute this command.!`)
      .setTimestamp();
    return { embeds: [embed] };
  }
  
  const embed = new EmbedBuilder()
    .setColor("#2B2D31");
  
  if (issuer?.user) {
    embed.setAuthor({ 
      name: issuer.user.username,
      iconURL: issuer.user.displayAvatarURL()
    });
  }
  
  embed.setDescription(`${EMOJIS.ERROR} | Failed to warn **${targetUsername}**!`)
    .setTimestamp();
  return { embeds: [embed] };
}
