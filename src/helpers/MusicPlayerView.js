const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const prettyMs = require("pretty-ms");

class MusicPlayerView {
  static THEME = {
    DARK_BG: 0x2B2D31,
    ORANGE_ACCENT: 0xF26522,
    WHITE: 0xFFFFFF,
    TRANSPARENT: 0x2B2D31,
  };

  static EMOJIS = {
    CASSETTE: '📼',
    MUSIC_NOTE: '🎵',
    SIGNAL_BARS: '▌▌▌',
    VOLUME_LOW: '🔉',
    VOLUME_MED: '🔊',
    VOLUME_HIGH: '🔊',
    LIST: '☰',
    CLOCK: '🕐',
    THUMBS_UP: '👍',
    GIFT: '🛍️',
    INFINITY: '∞',
  };

  static getVolumeEmoji(volume = 100) {
    if (volume === 0) return '🔇';
    if (volume < 33) return '🔉';
    if (volume < 66) return '🔊';
    return '🔊';
  }

  static formatTrackNumber(num) {
    return String(num).padStart(2, '0');
  }

  static createEmptyQueueDisplay() {
    const description = [
      '**No tracks in the queue**',
      'Use /play to start the queue',
      '',
      '**Start Autoplay**',
      `Press the ${this.EMOJIS.INFINITY} button`,
      '',
      '**Enjoying Euphony?**',
      '📝 Consider leaving a [review](https://top.gg/bot)/[voting](https://top.gg/bot)',
      '🛍️ Also check out our [merch](https://shop.euphony.com), it\'s cool'
    ].join('\n');

    const embed = new EmbedBuilder()
      .setColor(this.THEME.DARK_BG)
      .setDescription(description)
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_queue_view')
        .setEmoji('☰')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('music_previous')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('music_play')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('music_next')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_autoplay')
        .setLabel('∞')
        .setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_settings')
        .setEmoji('⚙️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_shuffle_empty')
        .setEmoji('🔀')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('music_playlist')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    return {
      embeds: [embed],
      components: [row1, row2, row3]
    };
  }

  static createNowPlayingDisplay(player, requester, interaction, lastInteractionTime = null) {
    const track = player.queue.current;
    const queue = player.queue.tracks || [];
    const volume = player.volume || 100;
    const isPaused = player.paused;
    const loopMode = player.queue.loop || 0;

    const trackInfo = track.info || track;
    const title = trackInfo.title || 'Unknown Track';
    const author = trackInfo.author || 'Unknown Artist';
    const duration = prettyMs(trackInfo.length || 0, { colonNotation: true });
    const volumeEmoji = this.getVolumeEmoji(volume);
    const trackNumber = this.formatTrackNumber(1);

    let thumbnail = null;
    if (trackInfo.sourceName === "youtube" || track.sourceName === "youtube") {
      const identifier = trackInfo.identifier || track.identifier;
      if (identifier) {
        thumbnail = `https://img.youtube.com/vi/${identifier}/maxresdefault.jpg`;
      }
    }

    const requesterDisplay = requester.startsWith('@') ? requester : `@${requester}`;
    
    let description = `**Queued by ${requesterDisplay}** ${this.EMOJIS.MUSIC_NOTE}\n\n`;
    description += `**${trackNumber} ${volumeEmoji} ${title}**\n`;
    description += `${author} **[${duration}]**\n\n`;
    
    const totalSongs = queue.length + 1;
    description += `${this.EMOJIS.LIST} **Queue • ${totalSongs} song${totalSongs > 1 ? 's' : ''}**\n\n`;
    
    description += `${this.EMOJIS.CLOCK} **View History**\n\n`;

    if (queue.length > 0) {
      description += `**From search**\n`;
      const upcoming = queue.slice(0, 3);
      upcoming.forEach((t, i) => {
        const pos = this.formatTrackNumber(i + 2);
        const tInfo = t.info || t;
        const trackTitle = (tInfo.title || 'Unknown').length > 35 ? tInfo.title.substring(0, 32) + '...' : tInfo.title;
        const trackAuthor = (tInfo.author || 'Unknown Artist').length > 25 ? tInfo.author.substring(0, 22) + '...' : tInfo.author;
        const trackDuration = prettyMs(tInfo.length || 0, { colonNotation: true });
        const tRequester = t.requester || requester;
        const rating = '@10/10';
        description += `**${pos}** **${trackTitle}** - **${trackAuthor}** **[${trackDuration}]** ${rating}\n`;
      });

      if (queue.length > 3) {
        description += `\n*...and ${queue.length - 3} more*\n`;
      }

      const totalPages = Math.ceil(queue.length / 10) || 1;
      description += `\n**Page 1 of ${totalPages}**\n`;
    }

    const embed = new EmbedBuilder()
      .setColor(this.THEME.ORANGE_ACCENT)
      .setDescription(description)
      .setTimestamp();

    if (thumbnail) {
      embed.setThumbnail(thumbnail);
    }

    if (lastInteractionTime) {
      const timeAgo = Math.floor((Date.now() - lastInteractionTime) / 1000);
      const timeText = timeAgo < 5 ? 'just now' : timeAgo < 60 ? `${timeAgo} seconds ago` : `${Math.floor(timeAgo / 60)} minutes ago`;
      embed.setFooter({ text: `${requesterDisplay} interacted ${timeText}` });
    } else {
      embed.setFooter({ text: `${requesterDisplay} interacted just now` });
    }

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_queue_view')
        .setEmoji('☰')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_previous')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(isPaused ? 'music_resume' : 'music_pause')
        .setEmoji(isPaused ? '▶️' : '⏸️')
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('music_next')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_back')
        .setEmoji('↩️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_shuffle')
        .setEmoji('🔀')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_volup')
        .setEmoji('🔺')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_voldown')
        .setEmoji('🔻')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_jump')
        .setEmoji('⏫')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_loop')
        .setEmoji('🔁')
        .setStyle(loopMode > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_history')
        .setEmoji('🕐')
        .setLabel('View History')
        .setStyle(ButtonStyle.Secondary)
    );

    return {
      embeds: [embed],
      components: [row1, row2, row3, row4]
    };
  }

  static createQueueDisplay(player, requester, page = 1) {
    const queue = player.queue.tracks || [];
    const track = player.queue.current;
    const itemsPerPage = 10;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const tracksToShow = queue.slice(start, end);
    const totalPages = Math.ceil(queue.length / itemsPerPage) || 1;

    const requesterDisplay = requester.startsWith('@') ? requester : `@${requester}`;

    let description = `**Queued by ${requesterDisplay}** ${this.EMOJIS.MUSIC_NOTE}\n\n`;

    if (track) {
      const trackInfo = track.info || track;
      const title = trackInfo.title || 'Unknown Track';
      const author = trackInfo.author || 'Unknown Artist';
      const duration = prettyMs(trackInfo.length || 0, { colonNotation: true });
      const volumeEmoji = this.getVolumeEmoji(player.volume || 100);
      const trackNumber = this.formatTrackNumber(1);

      description += `**${trackNumber} ${volumeEmoji} ${title}**\n`;
      description += `${author} **[${duration}]**\n\n`;
    }

    const totalSongs = queue.length + 1;
    description += `${this.EMOJIS.LIST} **Queue • ${totalSongs} song${totalSongs > 1 ? 's' : ''}**\n\n`;
    description += `${this.EMOJIS.CLOCK} **View History**\n\n`;

    if (tracksToShow.length > 0) {
      description += `**From search**\n`;
      tracksToShow.forEach((t, i) => {
        const position = start + i + 2;
        const pos = this.formatTrackNumber(position);
        const tInfo = t.info || t;
        const trackTitle = (tInfo.title || 'Unknown').length > 35 ? tInfo.title.substring(0, 32) + '...' : tInfo.title;
        const trackAuthor = (tInfo.author || 'Unknown Artist').length > 25 ? tInfo.author.substring(0, 22) + '...' : tInfo.author;
        const trackDuration = prettyMs(tInfo.length || 0, { colonNotation: true });
        const rating = '@10/10';
        description += `**${pos}** **${trackTitle}** - **${trackAuthor}** **[${trackDuration}]** ${rating}\n`;
      });
    }

    description += `\n**Page ${page} of ${totalPages}**\n`;

    const embed = new EmbedBuilder()
      .setColor(this.THEME.ORANGE_ACCENT)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: `${requesterDisplay} interacted just now` });

    if (track && track.thumbnail) {
      embed.setThumbnail(track.thumbnail);
    }

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_back_to_player')
        .setEmoji('↩️')
        .setLabel('Back to Player')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`queue_page_${Math.max(1, page - 1)}`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`queue_page_${Math.min(totalPages, page + 1)}`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= totalPages)
    );

    return {
      embeds: [embed],
      components: [row1]
    };
  }

  static createHistoryDisplay(playerHistory = [], page = 1) {
    const itemsPerPage = 10;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const tracksToShow = playerHistory.slice(start, end);
    const totalPages = Math.ceil(playerHistory.length / itemsPerPage) || 1;

    let description = `${this.EMOJIS.CLOCK} **Playback History**\n\n`;

    if (tracksToShow.length > 0) {
      tracksToShow.forEach((track, i) => {
        const position = start + i + 1;
        const pos = this.formatTrackNumber(position);
        const title = (track.title || 'Unknown').length > 40 ? track.title.substring(0, 37) + '...' : track.title;
        const author = track.author || 'Unknown Artist';
        const duration = prettyMs(track.length || 0, { colonNotation: true });
        description += `**${pos}** **${title}** - **${author}** **[${duration}]**\n`;
      });
    } else {
      description += '*No history available*\n';
    }

    description += `\n**Page ${page} of ${totalPages}**\n`;

    const embed = new EmbedBuilder()
      .setColor(this.THEME.ORANGE_ACCENT)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: 'Interacted just now' });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_back_to_player')
        .setEmoji('↩️')
        .setLabel('Back to Player')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`history_page_${Math.max(1, page - 1)}`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`history_page_${Math.min(totalPages, page + 1)}`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= totalPages)
    );

    return {
      embeds: [embed],
      components: [row1]
    };
  }
}

module.exports = MusicPlayerView;
