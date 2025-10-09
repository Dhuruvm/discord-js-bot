const { EmbedBuilder } = require("discord.js");
const { Cluster } = require("lavaclient");
const prettyMs = require("pretty-ms");
const { load, SpotifyItemType } = require("@lavaclient/spotify");
require("@lavaclient/queue/register");

/**
 * @param {import("@structures/BotClient")} client
 */
module.exports = (client) => {
  // Initialize Spotify
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
      console.log("✅ Spotify integration connected successfully");
    } catch (error) {
      console.error("❌ Spotify integration failed:", error.message);
    }
  } else {
    console.log("⚠️ Spotify credentials not found - Spotify links will not work");
  }

  const lavaclient = new Cluster({
    nodes: client.config.MUSIC.LAVALINK_NODES,
    sendGatewayPayload: (id, payload) => client.guilds.cache.get(id)?.shard?.send(payload),
  });
  
  console.log(`🔗 Attempting to connect to Lavalink server: ${client.config.MUSIC.LAVALINK_NODES[0].host}:${client.config.MUSIC.LAVALINK_NODES[0].port}`);
  
  // Connect to Lavalink nodes when client is ready (after user ID is available)
  client.once("ready", () => {
    console.log(`📡 Initializing Lavalink with User ID: ${client.user.id}`);
    lavaclient.connect(client.user.id);
    
    // Check connection status after initialization
    setTimeout(() => {
      const nodeStatus = [];
      for (const [id, node] of lavaclient.nodes) {
        if (node.connected) {
          nodeStatus.push(`✅ ${id}: Connected (${node.options.host}:${node.options.port})`);
        } else {
          nodeStatus.push(`❌ ${id}: Not connected`);
        }
      }
      if (nodeStatus.length > 0) {
        console.log("Lavalink Node Status:", nodeStatus.join(", "));
      }
    }, 3000);
  });

  client.ws.on("VOICE_SERVER_UPDATE", (data) => lavaclient.handleVoiceUpdate(data));
  client.ws.on("VOICE_STATE_UPDATE", (data) => lavaclient.handleVoiceUpdate(data));

  lavaclient.on("nodeConnect", (node, event) => {
    client.logger.success(`✅ Lavalink connected successfully - Node "${node.id}" (${node.options.host}:${node.options.port}) is ready`);
  });

  lavaclient.on("nodeDisconnect", (node, event) => {
    client.logger.warn(`⚠️ Lavalink node "${node.id}" disconnected`);
  });

  lavaclient.on("nodeError", (node, error) => {
    console.error(`❌ Lavalink node "${node.id}" error: ${error.message}`);
    if (node && node.options) {
      console.error(`   Host: ${node.options.host}:${node.options.port} (secure: ${node.options.secure})`);
    }
    console.error(`   Hint: Check if 'secure' setting is correct (try switching true/false)`);
    client.logger.error(`❌ Lavalink node "${node.id}" error: ${error.message}`, error);
  });

  lavaclient.on("nodeDebug", (node, message) => {
    client.logger.debug(`Node "${node.id}" debug: ${message}`);
  });

  lavaclient.on("nodeTrackStart", (_node, queue, song) => {
    const fields = [];

    const embed = new EmbedBuilder()
      .setAuthor({ name: "Now Playing" })
      .setColor(client.config.EMBED_COLORS.BOT_EMBED)
      .setDescription(`[${song.title}](${song.uri})`)
      .setFooter({ text: `Requested By: ${song.requester}` });

    if (song.sourceName === "youtube") {
      const identifier = song.identifier;
      const thumbnail = `https://img.youtube.com/vi/${identifier}/hqdefault.jpg`;
      embed.setThumbnail(thumbnail);
    }

    fields.push({
      name: "Song Duration",
      value: "`" + prettyMs(song.length, { colonNotation: true }) + "`",
      inline: true,
    });

    if (queue.tracks.length > 0) {
      fields.push({
        name: "Position in Queue",
        value: (queue.tracks.length + 1).toString(),
        inline: true,
      });
    }

    embed.setFields(fields);
    queue.data.channel.safeSend({ embeds: [embed] });
  });

  lavaclient.on("nodeQueueFinish", async (_node, queue) => {
    queue.data.channel.safeSend("Queue has ended.");
    const player = queue.player;
    if (player) {
      await player.destroy();
      await player.disconnect();
    }
  });

  return lavaclient;
};
