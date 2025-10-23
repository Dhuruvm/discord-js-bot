const { ApplicationCommandOptionType, ChannelType, PermissionFlagsBits } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "unlock",
  description: "Unlock a channel to allow members to send messages",
  category: "MODERATION",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  command: {
    enabled: true,
    aliases: ["unlockdown", "unlockchannel"],
    usage: "[#channel] [reason]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "channel",
        description: "The channel to unlock (defaults to current channel)",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        required: false,
      },
      {
        name: "reason",
        description: "Reason for unlocking the channel",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    let targetChannel = message.channel;
    
    if (args[0]) {
      const channelMention = args[0].match(/^<#(\d+)>$/);
      if (channelMention) {
        targetChannel = message.guild.channels.cache.get(channelMention[1]);
      } else if (/^\d+$/.test(args[0])) {
        targetChannel = message.guild.channels.cache.get(args[0]);
      }
    }
    
    if (!targetChannel) {
      return message.safeReply(ModernEmbed.simpleError("Invalid channel provided."));
    }

    const reason = args.slice(1).join(" ") || "No reason provided";
    const response = await unlockChannel(message.guild, targetChannel, message.member, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
    const reason = interaction.options.getString("reason") || "No reason provided";
    
    const response = await unlockChannel(interaction.guild, targetChannel, interaction.member, reason);
    await interaction.followUp(response);
  },
};

/**
 * Unlock a channel
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').TextChannel} channel
 * @param {import('discord.js').GuildMember} moderator
 * @param {string} reason
 */
async function unlockChannel(guild, channel, moderator, reason) {
  if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)) {
    return ModernEmbed.simpleError("This channel type cannot be unlocked. Only text and announcement channels can be unlocked.");
  }

  const botMember = guild.members.me;
  if (!channel.permissionsFor(botMember).has(PermissionFlagsBits.ManageChannels)) {
    return ModernEmbed.simpleError("I don't have permission to manage this channel.");
  }

  try {
    const everyoneRole = guild.roles.everyone;
    const currentPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
    
    if (!currentPerms || !currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
      return ModernEmbed.simpleWarning(
        `${channel} is already unlocked!`,
        "This channel is not currently locked."
      );
    }

    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: null,
    }, {
      reason: `Channel unlocked by ${moderator.user.tag} | ${reason}`,
    });

    return ModernEmbed.success(
      "🔓 Channel Unlocked",
      `${channel} has been unlocked. Members can now send messages.\n**Reason:** ${reason}`,
      `Unlocked by ${moderator.user.username}`
    );
  } catch (error) {
    console.error("Unlock channel error:", error);
    return ModernEmbed.simpleError(
      "Failed to unlock the channel. Please check my permissions and try again."
    );
  }
}
