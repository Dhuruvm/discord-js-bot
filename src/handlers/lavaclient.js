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
  
  console.log(`🔗 Connecting to Lavalink server: ${client.config.MUSIC.LAVALINK_NODES[0].host}:${client.config.MUSIC.LAVALINK_NODES[0].port}`);
  
  // Attempt to connect to all nodes
  setTimeout(() => {
    const nodeStatus = [];
    for (const [id, node] of lavaclient.nodes) {
      if (node.connected) {
        nodeStatus.push(`✅ ${id}: Connected`);
      } else {
        nodeStatus.push(`❌ ${id}: Not connected`);
      }
    }
    if (nodeStatus.length > 0) {
      console.log("Lavalink Node Status:", nodeStatus.join(", "));
    } else {
      console.log("⚠️ No Lavalink nodes found - check your configuration");
    }
  }, 3000);

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
    console.error(`   Host: ${node.options.host}:${node.options.port}`);
    console.error(`   Check if the server is online and credentials are correct`);
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
