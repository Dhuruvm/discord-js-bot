const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const prettyMs = require("pretty-ms");

class MusicPlayerBuilder {
  static createEmptyQueueDisplay() {
    const components = [];
    
    components.push(ContainerBuilder.createTextDisplay("## No tracks in the queue"));
    components.push(ContainerBuilder.createTextDisplay("Use `/play` to start the queue"));
    components.push(ContainerBuilder.createSeparator());
    components.push(ContainerBuilder.createTextDisplay("### Start Autoplay"));
    components.push(ContainerBuilder.createTextDisplay("Press the ∞ button"));
    components.push(ContainerBuilder.createSeparator());
    components.push(ContainerBuilder.createTextDisplay("### Enjoying Euphony?"));
    components.push(ContainerBuilder.createTextDisplay("📝 Consider leaving a [review](https://top.gg)/[voting](https://top.gg)"));
    components.push(ContainerBuilder.createTextDisplay("🛍️ Also check out our [merch](https://merch.example.com), it's cool"));
    
    const buttonRows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('music_queue')
          .setEmoji('☰')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('music_previous')
          .setEmoji('⏮')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('music_play')
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('music_next')
          .setEmoji('⏭')
          .setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('music_loop')
          .setEmoji('∞')
          .setStyle(ButtonStyle.Secondary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('music_settings')
          .setEmoji('⚙️')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('music_filters')
          .setEmoji('🎚️')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('music_lyrics')
          .setEmoji('🎵')
          .setStyle(ButtonStyle.Secondary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('music_review')
          .setLabel('⭐ Review')
          .setStyle(ButtonStyle.Secondary)
      )
    ];
    
    return {
      flags: 1 << 15,
      components: [
        {
          type: 17,
          accent_color: 0x2B2D31,
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
    
    const trackNumber = String(player.queue.tracks.indexOf(track) + 1).padStart(2, '0');
    const bars = "|||";
    
    components.push(ContainerBuilder.createTextDisplay(`Queued by ${requester} 🎵`));
    components.push(ContainerBuilder.createSeparator());
    
    const trackTitle = `### ${trackNumber} ${bars} **${track.title}**`;
    components.push(ContainerBuilder.createTextDisplay(trackTitle));
    
    const trackInfo = `${track.author} **[${prettyMs(track.length, { colonNotation: true })}]**`;
    components.push(ContainerBuilder.createTextDisplay(trackInfo));
    
    components.push(ContainerBuilder.createSeparator());
    
    const queueLength = queue.length;
    const queueHeader = `☰ **Queue • ${queueLength} song${queueLength !== 1 ? 's' : ''}**`;
    components.push(ContainerBuilder.createTextDisplay(queueHeader));
    
    components.push(ContainerBuilder.createTextDisplay("🕐 **View History**"));
    components.push(ContainerBuilder.createSeparator());
    
    components.push(ContainerBuilder.createTextDisplay("*From search*"));
    
    const tracksToShow = queue.slice(0, 10);
    tracksToShow.forEach((queueTrack, index) => {
      const trackNum = String(index + 4).padStart(2, '0');
      const rating = "@10/10";
      const trackLine = `**${trackNum}** ${queueTrack.title} – ${queueTrack.author} **[${prettyMs(queueTrack.length, { colonNotation: true })}]** ${rating}`;
      components.push(ContainerBuilder.createTextDisplay(trackLine));
    });
    
    const totalPages = Math.ceil(queue.length / 10);
    components.push(ContainerBuilder.createSeparator());
    components.push(ContainerBuilder.createTextDisplay(`*Page 1 of ${totalPages || 1}*`));
    
    const isPaused = player.paused;
    const buttonRows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('music_back')
          .setEmoji('⬅')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('music_previous')
          .setEmoji('⏮')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(isPaused ? 'music_resume' : 'music_pause')
          .setEmoji(isPaused ? '▶️' : '⏸')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('music_next')
          .setEmoji('⏭')
          .setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('music_stop')
          .setEmoji('🛑')
          .setStyle(ButtonStyle.Danger)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('music_shuffle')
          .setEmoji('🔀')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('music_volume_up')
          .setEmoji('🔊')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('music_volume_down')
          .setEmoji('🔉')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('music_repeat')
          .setEmoji('🔼')
          .setStyle(ButtonStyle.Secondary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('music_loop')
          .setEmoji('🔁')
          .setStyle(ButtonStyle.Secondary)
      )
    ];
    
    const timestamp = Math.floor(Date.now() / 1000) - 12;
    components.push(ContainerBuilder.createSeparator());
    components.push(ContainerBuilder.createTextDisplay(`${requester} interacted <t:${timestamp}:R>`));
    
    const response = {
      flags: 1 << 15,
      components: [
        {
          type: 17,
          accent_color: 0x2B2D31,
          components: components
        }
      ],
      components_v2: buttonRows
    };
    
    if (track.thumbnail) {
      response.components[0].thumbnail = { url: track.thumbnail };
    }
    
    return response;
  }

  static createQueueDisplay(player, requester, page = 1) {
    const queue = player.queue.tracks;
    const components = [];
    
    const track = player.queue.current;
    if (track) {
      const trackNumber = "03";
      const bars = "|||";
      
      components.push(ContainerBuilder.createTextDisplay(`Queued by ${requester} 🎵`));
      components.push(ContainerBuilder.createSeparator());
      components.push(ContainerBuilder.createTextDisplay(`### ${trackNumber} ${bars} **${track.title}**`));
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
    
    tracksToShow.forEach((queueTrack, index) => {
      const trackNum = String(start + index + 4).padStart(2, '0');
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
    
    return {
      flags: 1 << 15,
      components: [
        {
          type: 17,
          accent_color: 0x2B2D31,
          components: components,
          thumbnail: track?.thumbnail ? { url: track.thumbnail } : undefined
        }
      ],
      components_v2: buttonRows
    };
  }
}

module.exports = MusicPlayerBuilder;
