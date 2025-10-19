const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Cluster } = require("lavaclient");
const prettyMs = require("pretty-ms");
const { load, SpotifyItemType } = require("@lavaclient/spotify");
const MusicPlayerView = require("@helpers/MusicPlayerView");
const { addToHistory } = require("@handlers/musicInteractionRouter");
require("@lavaclient/queue/register");

/**
 * @param {import("@structures/BotClient")} client
 */
module.exports = (client) => {
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    try {
      load({
        client: {
          id: process.env.SPOTIFY_CLIENT_ID,
          secret: process.env.SPOTIFY_CLIENT_SECRET,
        },
        autoResolveYoutubeTracks: false,
        loaders: [SpotifyItemType.Album, SpotifyItemType.Artist, SpotifyItemType.Playlist, SpotifyItemType.Track],
      });
      console.log("<:success:1424072640829722745> Spotify integration connected successfully");
    } catch (error) {
      console.error("<:error:1424072711671382076> Spotify integration failed:", error.message);
    }
  }

  const lavaclient = new Cluster({
    nodes: client.config.MUSIC.LAVALINK_NODES,
    sendGatewayPayload: (id, payload) => {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
  });

  client.once("ready", () => {
    console.log(`📡 Initializing Lavalink with User ID: ${client.user.id}`);
    
    setTimeout(() => {
      lavaclient.connect(client.user.id);
    }, 3000);
  });

  client.ws.on("VOICE_SERVER_UPDATE", (data) => lavaclient.handleVoiceUpdate(data));
  client.ws.on("VOICE_STATE_UPDATE", (data) => lavaclient.handleVoiceUpdate(data));

  lavaclient.on("nodeConnect", (node) => {
    client.logger.log(`Lavalink node "${node.id}" connected`);
  });

  lavaclient.on("nodeDisconnect", (node, reason) => {
    client.logger.warn(`⚠️ Lavalink node "${node.id}" disconnected`);
  });

  lavaclient.on("nodeError", (node, error) => {
    client.logger.error(`<:error:1424072711671382076> Lavalink node "${node.id}" error: ${error.message}`);
  });

  lavaclient.on("trackStart", async (player, track) => {
    const queue = player.queue;
    const channel = client.channels.cache.get(player.channelId);
    if (!channel) return;

    const trackInfo = track.info || track;
    const requester = track.requester || 'Unknown User';

    try {
      const display = MusicPlayerView.createNowPlayingDisplay(player, requester, null, null);
      await channel.send(display);
    } catch (error) {
      client.logger.error("Failed to send now playing message:", error);
      try {
        const title = trackInfo.title || track.title || 'Unknown Track';
        const author = trackInfo.author || track.author || 'Unknown Artist';
        await channel.send(`🎵 Now Playing: **${title}** by ${author}`);
      } catch (err) {
        console.error("Could not send any message to channel:", err.message);
      }
    }
  });

  lavaclient.on("queueFinish", async (player) => {
    const channel = client.channels.cache.get(player.channelId);
    if (channel) {
      if (player.queue.current) {
        addToHistory(player.guildId, player.queue.current);
      }
      
      const display = MusicPlayerView.createEmptyQueueDisplay();
      await channel.send(display);
    }
    await player.disconnect();
  });

  return lavaclient;
};
