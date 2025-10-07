
const { EmbedBuilder, ApplicationCommandOptionType, PermissionFlagsBits } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const EMOJIS = require("@helpers/EmojiConstants");

// Store jailed users
const jailedUsers = new Map();

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "jail",
  description: "Lock a user in a voice channel (owner only)",
  category: "OWNER",
  botPermissions: ["MoveMembers"],
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
        description: "The user to jail in voice channel",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.safeReply("Please provide a valid user to jail.");
    }

    if (!target.voice.channel) {
      return message.safeReply(`${EMOJIS.WARN} | ${target.user.tag} is not in a voice channel!`);
    }

    const response = await jailUser(message.guild, target, message.member);
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

    if (!target.voice.channel) {
      return interaction.followUp({
        content: `${EMOJIS.WARN} | ${target.user.tag} is not in a voice channel!`,
        ephemeral: true,
      });
    }

    const response = await jailUser(interaction.guild, target, interaction.member);
    return interaction.followUp(response);
  },
};

async function jailUser(guild, target, issuer) {
  try {
    const voiceChannel = target.voice.channel;
    
    if (jailedUsers.has(target.id)) {
      return `${EMOJIS.WARN} | ${target.user.tag} is already jailed!`;
    }

    // Store jail information
    jailedUsers.set(target.id, {
      channelId: voiceChannel.id,
      guildId: guild.id,
      jailedAt: Date.now(),
      jailedBy: issuer.id,
    });

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        `${EMOJIS.SUCCESS} | **User Jailed in Voice Channel**\n\n` +
        `**User:** ${target.user.tag}\n` +
        `**Channel:** ${voiceChannel.name}\n` +
        `**Jailed by:** ${issuer.user.tag}\n\n` +
        `This user will be moved back if they try to leave or switch channels.`
      )
      .setTimestamp();

    return { embeds: [embed] };
  } catch (error) {
    return `${EMOJIS.ERROR} | An error occurred while jailing the user.`;
  }
}

// Export for use in voice state handler
module.exports.jailedUsers = jailedUsers;
