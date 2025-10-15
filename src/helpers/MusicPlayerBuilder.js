const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const prettyMs = require("pretty-ms");

class MusicPlayerBuilder {
  static createEmptyQueueDisplay() {
    const embed = new EmbedBuilder()
      .setColor(0x3498DB) // Blue color
      .setTitle("**No tracks in the queue**")
      .setDescription("Use `/play` to start the queue")
      .setFooter({ text: "Start playing music" });
    
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setLabel('No music playing')
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
    
    // Create simple embed with bold blue title and thumbnail
    const embed = new EmbedBuilder()
      .setColor(0x3498DB) // Blue color
      .setTitle(`**${track.title}**`) // Bold title
      .setURL(track.uri || null)
      .setDescription(
        `**Artist:** ${track.author}\n` +
        `**Duration:** ${prettyMs(track.length, { colonNotation: true })}\n` +
        `**Queued by:** ${requester}`
      )
      .setThumbnail(track.thumbnail || null) // Music thumbnail
      .setFooter({ text: `Queue: ${queue.length} song${queue.length !== 1 ? 's' : ''}` });
    
    // Simple player controls
    const isPaused = player.paused;
    
    const controlRow1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_previous')
        .setLabel('◄◄')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(isPaused ? 'music_resume' : 'music_pause')
        .setLabel(isPaused ? '▶' : '⏸')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('music_next')
        .setLabel('►►')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger)
    );
    
    const controlRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_shuffle')
        .setLabel('Shuffle')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_loop')
        .setLabel('Loop')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_queue')
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
    
    const itemsPerPage = 10;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const tracksToShow = queue.slice(start, end);
    const totalPages = Math.ceil(queue.length / itemsPerPage) || 1;
    
    let queueList = "";
    if (tracksToShow.length > 0) {
      tracksToShow.forEach((queueTrack, index) => {
        const position = start + index + 1;
        queueList += `**${position}.** ${queueTrack.title} - ${queueTrack.author} \`[${prettyMs(queueTrack.length, { colonNotation: true })}]\`\n`;
      });
    } else {
      queueList = "No tracks in queue";
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x3498DB) // Blue color
      .setTitle(`**Music Queue**`)
      .setDescription(queueList)
      .setFooter({ text: `Page ${page} of ${totalPages} • ${queue.length} song${queue.length !== 1 ? 's' : ''} in queue` });
    
    if (track) {
      embed.addFields({
        name: "Now Playing",
        value: `**${track.title}** - ${track.author}`,
        inline: false
      });
      if (track.thumbnail) {
        embed.setThumbnail(track.thumbnail);
      }
    }
    
    const navigationRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_back')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`queue_page_${Math.max(1, page - 1)}`)
        .setLabel('◀ Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`queue_page_${page + 1}`)
        .setLabel('Next ▶')
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
