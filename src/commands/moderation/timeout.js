const { timeoutTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const EMOJIS = require("@helpers/EmojiConstants");
const ems = require("enhanced-ms");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "timeout",
  description: "timeouts the specified member",
  category: "MODERATION",
  botPermissions: ["ModerateMembers"],
  userPermissions: ["ModerateMembers"],
  command: {
    enabled: true,
    aliases: ["mute"],
    usage: "<ID|@member> <duration> [reason]",
    minArgsCount: 2,
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
        name: "duration",
        description: "the time to timeout the member for",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        description: "reason for timeout",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    // parse time
    const ms = ems(args[1]);
    if (!ms) return message.safeReply("Please provide a valid duration. Example: 1d/1h/1m/1s");

    const reason = args.slice(2).join(" ").trim();
    const response = await timeout(message.member, target, ms, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");

    // parse time
    const duration = interaction.options.getString("duration");
    const ms = ems(duration);
    if (!ms) return interaction.followUp("Please provide a valid duration. Example: 1d/1h/1m/1s");

    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await timeout(interaction.member, target, ms, reason);
    await interaction.followUp(response);
  },
};

async function timeout(issuer, target, ms, reason) {
  if (isNaN(ms)) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(`${EMOJIS.ERROR} | Please provide a valid duration. Example: \`1d/1h/1m/1s\``)
      .setTimestamp();
    return { embeds: [embed] };
  }
  
  const response = await timeoutTarget(issuer, target, ms, reason);
  
  if (typeof response === "boolean") {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(`${EMOJIS.TIMEOUT} | **${target.user.username}** has been timed out!`)
      .addFields(
        { name: "Reason", value: reason || "No reason provided", inline: false },
        { name: "Duration", value: `<t:${Math.round((Date.now() + ms) / 1000)}:R>`, inline: false }
      )
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
    
    embed.setDescription(`${EMOJIS.ERROR} | I do not have permission to timeout **${target.user.username}**!`)
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
  
  if (response === "ALREADY_TIMEOUT") {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.WARNING)
      .setDescription(`${EMOJIS.WARNING} | **${target.user.username}** is already timed out!`)
      .setTimestamp();
    return { embeds: [embed] };
  }
  
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.ERROR)
    .setDescription(`${EMOJIS.ERROR} | Failed to timeout **${target.user.username}**`)
    .setTimestamp();
  return { embeds: [embed] };
}
