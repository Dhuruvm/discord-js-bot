const ContainerBuilder = require("@helpers/ContainerBuilder");
const prettyMs = require("pretty-ms");
const { splitBar } = require("string-progressbar");

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
function nowPlaying({ client, guildId }) {
  const player = client.musicManager.getPlayer(guildId);
  if (!player || !player.queue.current) return "🚫 No music is being played!";

  const track = player.queue.current;
  const end = track.length > 6.048e8 ? "🔴 LIVE" : new Date(track.length).toISOString().slice(11, 19);
  
  const progressBar = new Date(player.position).toISOString().slice(11, 19) +
    " [" +
    splitBar(track.length > 6.048e8 ? player.position : track.length, player.position, 15)[0] +
    "] " +
    end;

  return ContainerBuilder.quickMessage(
    "🎵 Now Playing",
    `[${track.title}](${track.uri})`,
    [
      { name: "Song Duration", value: "`" + prettyMs(track.length, { colonNotation: true }) + "`", inline: true },
      { name: "Requested By", value: track.requester || "Unknown", inline: true },
      { name: "Progress", value: progressBar, inline: false }
    ],
    0x5865F2
  );
}
