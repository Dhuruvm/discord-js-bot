const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const prettyMs = require("pretty-ms");

class MusicPlayerBuilder {
  static createProgressBar(current, total, length = 20) {
    const progress = Math.min(Math.max(current / total, 0), 1);
    const filledLength = Math.round(length * progress);
    const emptyLength = length - filledLength;
    
    const filledBar = '▰'.repeat(filledLength);
    const emptyBar = '▱'.repeat(emptyLength);
    
    return filledBar + emptyBar;
  }

  static getLoopEmoji(loopMode) {
    if (loopMode === 0) return ''; // No loop
    if (loopMode === 1) return '🔂'; // Loop track
    if (loopMode === 2) return '🔁'; // Loop queue
    return '';
  }

  static getVolumeEmoji(volume) {
    if (volume === 0) return '🔇';
    if (volume < 33) return '🔈';
    if (volume < 66) return '🔉';
    return '🔊';
  }

  static createEmptyQueueDisplay() {
    const embed = new EmbedBuilder()
      .setColor(0x2F3136) // Dark gray
      .setTitle("🎵 Music Player")
      .setDescription("**No tracks in the queue**\n\nUse `/play` or `!play` to start the queue")
      .setFooter({ text: "Ready to play music" })
      .setTimestamp();
    
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setLabel('No Music Playing')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
    
    return {
      embeds: [embed],
      components: [buttonRow]
    };
  }

  static createNowPlayingDisplay(player, requester, interaction) {
    const track = player.queue.current;
    const queue = player.queue.tracks;
    const loopMode = player.queue.loop || 0;
    const volume = player.volume || 100;
    const isPaused = player.paused;
    
    // Calculate progress (Lavalink tracks don't have position, so we simulate)
    const currentTime = player.position || 0;
    const totalTime = track.length || 0;
    const progressBar = this.createProgressBar(currentTime, totalTime, 18);
    const currentTimeStr = prettyMs(currentTime, { colonNotation: true, secondsDecimalDigits: 0 });
    const totalTimeStr = prettyMs(totalTime, { colonNotation: true });
    
    // Status indicators
    const loopEmoji = this.getLoopEmoji(loopMode);
    const volumeEmoji = this.getVolumeEmoji(volume);
    const statusText = isPaused ? '⏸️ Paused' : '▶️ Playing';
    
    // Build status line
    let statusLine = `${statusText}`;
    if (loopEmoji) statusLine += ` ${loopEmoji}`;
    statusLine += ` ${volumeEmoji} ${volume}%`;
    
    // Create enhanced embed
    const embed = new EmbedBuilder()
      .setColor(isPaused ? 0xFAA61A : 0x1DB954) // Orange if paused, Spotify green if playing
      .setAuthor({ 
        name: '🎵 Now Playing',
        iconURL: interaction?.member?.user?.displayAvatarURL?.() || null
      })
      .setTitle(track.title.length > 60 ? track.title.substring(0, 57) + '...' : track.title)
      .setURL(track.uri || null)
      .setDescription(
        `**Artist:** ${track.author}\n\n` +
        `${progressBar}\n` +
        `\`${currentTimeStr}\` / \`${totalTimeStr}\`\n\n` +
        `${statusLine}\n` +
        `**Requested by:** ${requester}`
      )
      .setThumbnail(track.thumbnail || null)
      .setFooter({ text: `${queue.length} song${queue.length !== 1 ? 's' : ''} in queue` })
      .setTimestamp();
    
    // Enhanced player controls with emojis
    const controlRow1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_previous')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(isPaused ? 'music_resume' : 'music_pause')
        .setEmoji(isPaused ? '▶️' : '⏸️')
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('music_next')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger)
    );
    
    const loopLabel = loopMode === 0 ? 'Loop: Off' : loopMode === 1 ? 'Loop: Track' : 'Loop: Queue';
    const controlRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_shuffle')
        .setEmoji('🔀')
        .setLabel('Shuffle')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_loop')
        .setEmoji(loopEmoji || '🔁')
        .setLabel(loopLabel)
        .setStyle(loopMode > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_queue')
        .setEmoji('📜')
        .setLabel('Queue')
        .setStyle(ButtonStyle.Secondary)
    );
    
    return {
      embeds: [embed],
      components: [controlRow1, controlRow2]
    };
  }

  static createQueueDisplay(player, requester, page = 1) {
    const queue = player.queue.tracks;
    const track = player.queue.current;
    const loopMode = player.queue.loop || 0;
    
    const itemsPerPage = 10;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const tracksToShow = queue.slice(start, end);
    const totalPages = Math.ceil(queue.length / itemsPerPage) || 1;
    
    // Calculate total queue duration
    const totalDuration = queue.reduce((acc, t) => acc + (t.length || 0), 0);
    const totalDurationStr = prettyMs(totalDuration, { colonNotation: true });
    
    let queueList = "";
    if (tracksToShow.length > 0) {
      tracksToShow.forEach((queueTrack, index) => {
        const position = start + index + 1;
        const title = queueTrack.title.length > 45 ? queueTrack.title.substring(0, 42) + '...' : queueTrack.title;
        const duration = prettyMs(queueTrack.length, { colonNotation: true });
        queueList += `\`${position}.\` **${title}**\n`;
        queueList += `   └ ${queueTrack.author} • \`${duration}\`\n`;
      });
    } else {
      queueList = "*No tracks in queue*\n\nAdd songs using `/play` or `!play`";
    }
    
    const loopEmoji = this.getLoopEmoji(loopMode);
    const loopText = loopMode === 0 ? '' : loopMode === 1 ? ' • 🔂 Loop Track' : ' • 🔁 Loop Queue';
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2) // Discord blurple
      .setAuthor({ 
        name: '📜 Music Queue',
        iconURL: null
      })
      .setDescription(queueList)
      .setFooter({ 
        text: `Page ${page}/${totalPages} • ${queue.length} song${queue.length !== 1 ? 's' : ''} • ${totalDurationStr}${loopText}` 
      })
      .setTimestamp();
    
    if (track) {
      const currentTitle = track.title.length > 50 ? track.title.substring(0, 47) + '...' : track.title;
      const currentDuration = prettyMs(track.length, { colonNotation: true });
      embed.addFields({
        name: "▶️ Currently Playing",
        value: `**${currentTitle}**\n${track.author} • \`${currentDuration}\``,
        inline: false
      });
      if (track.thumbnail) {
        embed.setThumbnail(track.thumbnail);
      }
    }
    
    const navigationRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_back')
        .setEmoji('◀️')
        .setLabel('Back to Player')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`queue_page_${Math.max(1, page - 1)}`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`queue_page_${page + 1}`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= totalPages)
    );
    
    return {
      embeds: [embed],
      components: [navigationRow]
    };
  }
}

module.exports = MusicPlayerBuilder;
