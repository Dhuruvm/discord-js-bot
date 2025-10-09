const MusicPlayerBuilder = require("@helpers/MusicPlayerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "np",
  description: "show's what track is currently being played",
  category: "MUSIC",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["nowplaying"],
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args) {
    const response = nowPlaying(message);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = nowPlaying(interaction);
    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 */
function nowPlaying({ client, guildId, member, author }) {
  const player = client.musicManager.getPlayer(guildId);
  
  if (!player || !player.queue.current) {
    return MusicPlayerBuilder.createEmptyQueueDisplay();
  }

  const track = player.queue.current;
  const requester = track.requester ? `@${track.requester}` : (member?.user?.username ? `@${member.user.username}` : (author ? `@${author.username}` : "@User"));
  
  return MusicPlayerBuilder.createNowPlayingDisplay(player, requester, { member, author });
}
