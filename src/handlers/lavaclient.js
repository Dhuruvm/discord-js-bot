const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Cluster } = require("lavaclient");
const prettyMs = require("pretty-ms");
const { load, SpotifyItemType } = require("@lavaclient/spotify");
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
    // Silently connect - only works with local node
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

    const currentPosition = queue.tracks.length > 0 ? 1 : 1;
    const totalInQueue = queue.tracks.length + 1;
    
    const trackInfo = track.info || track;
    const duration = prettyMs(trackInfo.length, { colonNotation: true });
    const signalBars = "▌▌▌";
    
    let thumbnail = null;
    if (trackInfo.sourceName === "youtube" || track.sourceName === "youtube") {
      const identifier = trackInfo.identifier || track.identifier;
      thumbnail = `https://img.youtube.com/vi/${identifier}/maxresdefault.jpg`;
    }

    const requester = track.requester || 'Unknown User';
    const title = trackInfo.title || track.title || 'Unknown Track';
    const author = trackInfo.author || track.author || 'Unknown Artist';

    let description = `**Queued by ${requester.includes('@') ? requester : `<@${requester}>`}** 🎵\n\n`;
    description += `**${String(currentPosition).padStart(2, '0')} ${signalBars} ${title}**\n`;
    description += `${author} **[${duration}]**\n\n`;
    
    description += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    description += `📋 **Queue • ${totalInQueue} song${totalInQueue > 1 ? 's' : ''}**\n\n`;
    
    if (queue.tracks.length > 0) {
      description += `**From search**\n`;
      const upcoming = queue.tracks.slice(0, 5);
      upcoming.forEach((t, i) => {
        const pos = String(currentPosition + i + 1).padStart(2, '0');
        const tInfo = t.info || t;
        const trackDuration = prettyMs(tInfo.length, { colonNotation: true });
        const trackTitle = tInfo.title.length > 40 ? tInfo.title.substring(0, 40) + '...' : tInfo.title;
        const trackAuthor = tInfo.author || 'Unknown Artist';
        const tRequester = t.requester || 'Unknown User';
        description += `**${pos}** ${trackTitle} - ${trackAuthor} **[${trackDuration}]** ${tRequester.includes('@') ? tRequester : `<@${tRequester}>`}\n`;
      });
      
      if (queue.tracks.length > 5) {
        description += `\n*...and ${queue.tracks.length - 5} more*\n`;
      }
      
      const totalPages = Math.ceil(queue.tracks.length / 10);
      description += `\n**Page 1 of ${totalPages}**\n`;
    }

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: `Interacted just now` });

    if (thumbnail) {
      embed.setThumbnail(thumbnail);
    }

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_back')
        .setEmoji('↩️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_previous')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('music_pause')
        .setEmoji('⏸️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('music_next')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('music_shuffle')
        .setEmoji('🔀')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_voldown')
        .setEmoji('🔉')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_volup')
        .setEmoji('🔊')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_loop')
        .setEmoji('🔁')
        .setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_history')
        .setLabel('🕐 View History')
        .setStyle(ButtonStyle.Secondary)
    );

    try {
      await channel.send({ 
        embeds: [embed], 
        components: [row1, row2, row3] 
      });
    } catch (error) {
      client.logger.error("Failed to send now playing message:", error);
      try {
        await channel.send(`🎵 Now Playing: **${title}** by ${author}`);
      } catch (err) {
        console.error("Could not send any message to channel:", err.message);
      }
    }
  });

  lavaclient.on("queueFinish", async (player) => {
    const channel = client.channels.cache.get(player.channelId);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setDescription("📭 **Queue has ended**\n\nAll songs have been played!")
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
    }
    await player.disconnect();
  });

  return lavaclient;
};
