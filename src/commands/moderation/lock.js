const { ApplicationCommandOptionType, ChannelType, PermissionFlagsBits } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "lock",
  description: "Lock a channel to prevent members from sending messages",
  category: "MODERATION",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  command: {
    enabled: true,
    aliases: ["lockdown", "lockchannel"],
    usage: "[#channel] [reason]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "channel",
        description: "The channel to lock (defaults to current channel)",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        required: false,
      },
      {
        name: "reason",
        description: "Reason for locking the channel",
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
    const response = await lockChannel(message.guild, targetChannel, message.member, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
    const reason = interaction.options.getString("reason") || "No reason provided";
    
    const response = await lockChannel(interaction.guild, targetChannel, interaction.member, reason);
    await interaction.followUp(response);
  },
};

/**
 * Lock a channel
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').TextChannel} channel
 * @param {import('discord.js').GuildMember} moderator
 * @param {string} reason
 */
async function lockChannel(guild, channel, moderator, reason) {
  if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)) {
    return ModernEmbed.simpleError("This channel type cannot be locked. Only text and announcement channels can be locked.");
  }

  const botMember = guild.members.me;
  if (!channel.permissionsFor(botMember).has(PermissionFlagsBits.ManageChannels)) {
    return ModernEmbed.simpleError("I don't have permission to manage this channel.");
  }

  try {
    const everyoneRole = guild.roles.everyone;
    const currentPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
    
    if (currentPerms && currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
      return ModernEmbed.simpleWarning(
        `${channel} is already locked!`,
        "This channel is already locked for members."
      );
    }

    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
    }, {
      reason: `Channel locked by ${moderator.user.tag} | ${reason}`,
    });

    return ModernEmbed.success(
      "🔒 Channel Locked",
      `${channel} has been locked. Members can no longer send messages.\n**Reason:** ${reason}`,
      `Locked by ${moderator.user.username}`
    );
  } catch (error) {
    console.error("Lock channel error:", error);
    return ModernEmbed.simpleError(
      "Failed to lock the channel. Please check my permissions and try again."
    );
  }
}
