
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require("@discordjs/voice");

// Map to store jailed bot instances per guild
const jailedBots = new Map();

/**
 * Join user's voice channel and lock the bot there
 * @param {import('discord.js').GuildMember} member - Member who triggered the command
 * @param {import('discord.js').Guild} guild - Guild where command was triggered
 */
async function joinAndLockVC(member, guild) {
  // Check if user is in a voice channel
  if (!member.voice.channel) {
    return "❌ You must be in a voice channel first!";
  }

  const voiceChannel = member.voice.channel;
  const botMember = guild.members.cache.get(guild.client.user.id);

  // Check bot permissions
  if (!voiceChannel.permissionsFor(botMember).has(["Connect", "Speak"])) {
    return "❌ I don't have permission to join your voice channel!";
  }

  try {
    // Join the voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    // Wait for connection to be ready
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

    // Lock the bot in this channel
    jailedBots.set(guild.id, {
      guildId: guild.id,
      channelId: voiceChannel.id,
      channelName: voiceChannel.name,
      connection: connection,
    });

    return `✅ **Cybork joined and locked in:** ${voiceChannel.name}\n\nI'm now locked in this voice channel and won't leave until unlocked with \`fuckoff\` command.`;
  } catch (error) {
    console.error("Failed to join voice channel:", error);
    return `❌ Failed to join voice channel: ${error.message}`;
  }
}

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "fuck",
  description: "Bot joins your VC and locks there until fuckoff (owner/access only)",
  category: "OWNER",
  botPermissions: ["Connect", "Speak"],
  command: {
    enabled: true,
    usage: "",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    const response = await joinAndLockVC(message.member, message.guild);
    return message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = await joinAndLockVC(interaction.member, interaction.guild);
    return interaction.followUp(response);
  },
};

module.exports.jailedBots = jailedBots;
