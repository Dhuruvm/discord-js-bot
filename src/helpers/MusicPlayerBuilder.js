const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const prettyMs = require("pretty-ms");

class MusicPlayerBuilder {
  static createEmptyQueueDisplay() {
    const components = [];
    
    components.push(ContainerBuilder.createTextDisplay("## No tracks in the queue"));
    components.push(ContainerBuilder.createTextDisplay("Use `/play` to start the queue"));
    components.push(ContainerBuilder.createSeparator());
    components.push(ContainerBuilder.createTextDisplay("### Start playing music"));
    components.push(ContainerBuilder.createTextDisplay("Use the play command to add songs"));
    
    const buttonRows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('music_stop')
          .setLabel('No music playing')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      )
    ];
    
    return {
      flags: 1 << 15,
      components: [
        {
          type: 17,
          accent_color: 0xFFA500, // Orange accent bar
          components: components
        }
      ],
      components_v2: buttonRows
    };
  }

  static createNowPlayingDisplay(player, requester, interaction) {
    const track = player.queue.current;
    const queue = player.queue.tracks;
    const components = [];
    
    // Track number with visual bars indicator
    const trackNumber = String((player.queue.previous?.length || 0) + 1).padStart(2, '0');
    const barsIndicator = "|||";
    
    // Header: Queued by user
    components.push(ContainerBuilder.createTextDisplay(`Queued by ${requester} 🎵`));
    components.push(ContainerBuilder.createSeparator());
    
    // Track title in cyan/blue color and bars indicator
    const trackTitle = `**${trackNumber} ${barsIndicator} ${track.title}**`;
    components.push(ContainerBuilder.createTextDisplay(trackTitle));
    
    // Artist and duration
    const trackInfo = `${track.author} **[${prettyMs(track.length, { colonNotation: true })}]**`;
    components.push(ContainerBuilder.createTextDisplay(trackInfo));
    
    components.push(ContainerBuilder.createSeparator());
    
    // Queue header
    const queueLength = queue.length;
    const queueHeader = `☰ **Queue • ${queueLength} song${queueLength !== 1 ? 's' : ''}**`;
    components.push(ContainerBuilder.createTextDisplay(queueHeader));
    
    // View History button
    components.push(ContainerBuilder.createTextDisplay("🕐 **View History**"));
    components.push(ContainerBuilder.createSeparator());
    
    // From search label
    components.push(ContainerBuilder.createTextDisplay("*From search*"));
    
    // Display upcoming tracks
    const currentTrackNumber = (player.queue.previous?.length || 0) + 1;
    const tracksToShow = queue.slice(0, 10);
    tracksToShow.forEach((queueTrack, index) => {
      const trackNum = String(currentTrackNumber + index + 1).padStart(2, '0');
      const rating = "@10/10"; // Rating from screenshot
      const trackLine = `**${trackNum}** ${queueTrack.title} – ${queueTrack.author} **[${prettyMs(queueTrack.length, { colonNotation: true })}]** ${rating}`;
      components.push(ContainerBuilder.createTextDisplay(trackLine));
    });
    
    // Page indicator
    const totalPages = Math.ceil(queue.length / 10);
    components.push(ContainerBuilder.createSeparator());
    components.push(ContainerBuilder.createTextDisplay(`*Page 1 of ${totalPages || 1}*`));
    
    // Player controls matching screenshot exactly
    const isPaused = player.paused;
    
    // Row 1: Back, Previous, Pause/Play, Next
    const controlRow1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_back')
        .setEmoji('⬅')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_previous')
        .setLabel('◄◄')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(isPaused ? 'music_resume' : 'music_pause')
        .setLabel(isPaused ? '▶' : '⏸')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('music_next')
        .setLabel('►►')
        .setStyle(ButtonStyle.Primary)
    );
    
    // Row 2: Stop button (red)
    const controlRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setEmoji('🛑')
        .setStyle(ButtonStyle.Danger)
    );
    
    // Row 3: Shuffle, Volume controls
    const controlRow3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_shuffle')
        .setEmoji('🔀')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_volume_up')
        .setEmoji('🔼')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_volume_down')
        .setEmoji('🔽')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_boost')
        .setEmoji('🔼')
        .setStyle(ButtonStyle.Secondary)
    );
    
    // Row 4: Repeat button
    const controlRow4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_loop')
        .setEmoji('🔁')
        .setStyle(ButtonStyle.Secondary)
    );
    
    const buttonRows = [controlRow1, controlRow2, controlRow3, controlRow4];
    
    // Footer: interaction timestamp
    const timestamp = Math.floor(Date.now() / 1000) - 12;
    components.push(ContainerBuilder.createSeparator());
    components.push(ContainerBuilder.createTextDisplay(`${requester} interacted <t:${timestamp}:R>`));
    
    // Build response with orange accent bar
    const response = {
      flags: 1 << 15,
      components: [
        {
          type: 17,
          accent_color: 0xFFA500, // Orange accent bar like in screenshot
          components: components
        }
      ],
      components_v2: buttonRows
    };
    
    // Add thumbnail (album artwork) if available
    if (track.thumbnail) {
      response.components[0].components.unshift(
        ContainerBuilder.createThumbnail(track.thumbnail)
      );
    }
    
    return response;
  }

  static createQueueDisplay(player, requester, page = 1) {
    const queue = player.queue.tracks;
    const components = [];
    
    const track = player.queue.current;
    if (track) {
      const trackNumber = String((player.queue.previous?.length || 0) + 1).padStart(2, '0');
      const barsIndicator = "|||";
      
      components.push(ContainerBuilder.createTextDisplay(`Queued by ${requester} 🎵`));
      components.push(ContainerBuilder.createSeparator());
      components.push(ContainerBuilder.createTextDisplay(`**${trackNumber} ${barsIndicator} ${track.title}**`));
      components.push(ContainerBuilder.createTextDisplay(`${track.author} **[${prettyMs(track.length, { colonNotation: true })}]**`));
      components.push(ContainerBuilder.createSeparator());
    }
    
    const queueLength = queue.length;
    const queueHeader = `☰ **Queue • ${queueLength} song${queueLength !== 1 ? 's' : ''}**`;
    components.push(ContainerBuilder.createTextDisplay(queueHeader));
    components.push(ContainerBuilder.createTextDisplay("🕐 **View History**"));
    components.push(ContainerBuilder.createSeparator());
    components.push(ContainerBuilder.createTextDisplay("*From search*"));
    
    const itemsPerPage = 10;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const tracksToShow = queue.slice(start, end);
    
    const currentTrackNum = (player.queue.previous?.length || 0) + 1;
    tracksToShow.forEach((queueTrack, index) => {
      const trackNum = String(currentTrackNum + start + index + 1).padStart(2, '0');
      const rating = "@10/10";
      const trackLine = `**${trackNum}** ${queueTrack.title} – ${queueTrack.author} **[${prettyMs(queueTrack.length, { colonNotation: true })}]** ${rating}`;
      components.push(ContainerBuilder.createTextDisplay(trackLine));
    });
    
    const totalPages = Math.ceil(queue.length / itemsPerPage);
    components.push(ContainerBuilder.createSeparator());
    components.push(ContainerBuilder.createTextDisplay(`*Page ${page} of ${totalPages || 1}*`));
    
    const buttonRows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('music_back')
          .setEmoji('⬅')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`queue_page_${Math.max(1, page - 1)}`)
          .setEmoji('◀')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page <= 1),
        new ButtonBuilder()
          .setCustomId(`queue_page_${page + 1}`)
          .setEmoji('▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page >= totalPages)
      )
    ];
    
    const response = {
      flags: 1 << 15,
      components: [
        {
          type: 17,
          accent_color: 0xFFA500, // Orange accent bar
          components: components
        }
      ],
      components_v2: buttonRows
    };

    // Add thumbnail if available
    if (track?.thumbnail) {
      response.components[0].components.unshift(
        ContainerBuilder.createThumbnail(track.thumbnail)
      );
    }

    return response;
  }
}

module.exports = MusicPlayerBuilder;
