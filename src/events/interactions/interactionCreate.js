const { getSettings } = require("@schemas/Guild");
const { commandHandler, contextHandler, statsHandler, suggestionHandler, ticketHandler } = require("@src/handlers");
const { InteractionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { SUPPORT_SERVER } = require("@root/config");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').BaseInteraction} interaction
 */
module.exports = async (client, interaction) => {
  if (!interaction.guild) {
    return interaction
      .reply({ content: "Command can only be executed in a discord server", ephemeral: true })
      .catch(() => {});
  }

  // Slash Commands
  if (interaction.isChatInputCommand()) {
    await commandHandler.handleSlashCommand(interaction);
  }

  // Context Menu
  else if (interaction.isContextMenuCommand()) {
    const context = client.contextMenus.get(interaction.commandName);
    if (context) await contextHandler.handleContext(interaction, context);
    else return interaction.reply({ content: "An error has occurred", ephemeral: true }).catch(() => {});
  }

  // Buttons
  else if (interaction.isButton()) {
    switch (interaction.customId) {
      case "TICKET_CREATE":
        return ticketHandler.handleTicketOpen(interaction);

      case "TICKET_CLOSE":
        return ticketHandler.handleTicketClose(interaction);

      case "SUGGEST_APPROVE":
        return suggestionHandler.handleApproveBtn(interaction);

      case "SUGGEST_REJECT":
        return suggestionHandler.handleRejectBtn(interaction);

      case "SUGGEST_DELETE":
        return suggestionHandler.handleDeleteBtn(interaction);

      case "bot-help-menu": {
        const { getSettings } = require("@schemas/Guild");
        const settings = await getSettings(interaction.guild);
        const helpCommand = client.getCommand("help");
        if (helpCommand) {
          await interaction.deferReply({ ephemeral: true });
          const response = await helpCommand.messageRun(
            {
              ...interaction,
              channel: interaction.channel,
              guild: interaction.guild,
              author: interaction.user,
              client: client
            },
            [],
            { prefix: settings.prefix }
          );
          return interaction.editReply(response);
        }
        return interaction.reply({ content: "Help command not available", ephemeral: true });
      }

      case "bot-premium-info": {
        const premiumEmbed = new EmbedBuilder()
          .setColor("#FFD700")
          .setTitle("⭐ Premium Features")
          .setDescription(
            `Unlock exclusive features with **${client.user.username} Premium**\n\n` +
            `✨ **Benefits:**\n` +
            `• Advanced AutoMod Protection\n` +
            `• Priority Support & Updates\n` +
            `• 24/7 Security Monitoring\n` +
            `• Exclusive All-in-One Tools\n` +
            `• Custom Branding Options\n\n` +
            `Contact our support server for more information!`
          )
          .setThumbnail(client.user.displayAvatarURL())
          .setFooter({ text: "Powered by Blackbit Studio" })
          .setTimestamp();

        const premiumRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel("Get Premium")
              .setStyle(ButtonStyle.Link)
              .setURL(SUPPORT_SERVER)
              .setEmoji("⭐"),
            new ButtonBuilder()
              .setLabel("Learn More")
              .setStyle(ButtonStyle.Link)
              .setURL(SUPPORT_SERVER)
              .setEmoji("📖")
          );

        return interaction.reply({
          embeds: [premiumEmbed],
          components: [premiumRow],
          ephemeral: true
        });
      }

      case "music_pause": {
        const player = client.musicManager.getPlayer(interaction.guildId);
        if (!player || !player.queue.current) return interaction.reply({ content: "❌ No music is currently playing!", ephemeral: true });
        if (player.paused) return interaction.reply({ content: "⏸️ Music is already paused!", ephemeral: true });
        player.pause(true);
        return interaction.reply({ content: "⏸️ Paused the music!", ephemeral: true });
      }

      case "music_next": {
        const player = client.musicManager.getPlayer(interaction.guildId);
        if (!player || !player.queue.current) return interaction.reply({ content: "❌ No music is currently playing!", ephemeral: true });
        player.queue.next();
        return interaction.reply({ content: "⏭️ Skipped to next track!", ephemeral: true });
      }

      case "music_previous": {
        const player = client.musicManager.getPlayer(interaction.guildId);
        if (!player || !player.queue.current) return interaction.reply({ content: "❌ No music is currently playing!", ephemeral: true });
        if (!player.queue.previous.length) return interaction.reply({ content: "❌ No previous tracks!", ephemeral: true });
        player.queue.previous();
        return interaction.reply({ content: "⏮️ Playing previous track!", ephemeral: true });
      }

      case "music_stop": {
        const player = client.musicManager.getPlayer(interaction.guildId);
        if (!player) return interaction.reply({ content: "❌ No music is currently playing!", ephemeral: true });
        await player.disconnect();
        return interaction.reply({ content: "⏹️ Stopped the music and disconnected!", ephemeral: true });
      }

      case "music_shuffle": {
        const player = client.musicManager.getPlayer(interaction.guildId);
        if (!player || !player.queue.tracks.length) return interaction.reply({ content: "❌ Queue is empty!", ephemeral: true });
        player.queue.shuffle();
        return interaction.reply({ content: "🔀 Shuffled the queue!", ephemeral: true });
      }

      case "music_loop": {
        const player = client.musicManager.getPlayer(interaction.guildId);
        if (!player) return interaction.reply({ content: "❌ No music is currently playing!", ephemeral: true });
        const loopModes = ["off", "repeat", "queue"];
        const currentMode = player.queue.loop || "off";
        const nextIndex = (loopModes.indexOf(currentMode) + 1) % loopModes.length;
        player.queue.setLoop(loopModes[nextIndex]);
        const modeEmojis = { off: "🔁 Loop: Off", repeat: "🔂 Loop: Single Track", queue: "🔁 Loop: Queue" };
        return interaction.reply({ content: modeEmojis[loopModes[nextIndex]], ephemeral: true });
      }

      case "music_volup": {
        const player = client.musicManager.getPlayer(interaction.guildId);
        if (!player) return interaction.reply({ content: "❌ No music is currently playing!", ephemeral: true });
        const newVol = Math.min(player.volume + 10, 150);
        player.setVolume(newVol);
        return interaction.reply({ content: `🔊 Volume increased to ${newVol}%`, ephemeral: true });
      }

      case "music_voldown": {
        const player = client.musicManager.getPlayer(interaction.guildId);
        if (!player) return interaction.reply({ content: "❌ No music is currently playing!", ephemeral: true });
        const newVol = Math.max(player.volume - 10, 0);
        player.setVolume(newVol);
        return interaction.reply({ content: `🔉 Volume decreased to ${newVol}%`, ephemeral: true });
      }

      case "music_back": {
        return interaction.reply({ content: "↩️ Back button - This will show the previous page of results", ephemeral: true });
      }

      case "music_history": {
        const player = client.musicManager.getPlayer(interaction.guildId);
        if (!player) return interaction.reply({ content: "❌ No music session active!", ephemeral: true });
        
        const history = player.queue.previous || [];
        if (!history.length) return interaction.reply({ content: "🕐 No history yet!", ephemeral: true });
        
        const historyList = history.slice(-10).reverse().map((track, i) => 
          `${i + 1}. **${track.info.title}** - ${track.info.author}`
        ).join('\n');
        
        return interaction.reply({ 
          content: `🕐 **Recently Played:**\n\n${historyList}`, 
          ephemeral: true 
        });
      }
    }
  }

  // Modals
  else if (interaction.type === InteractionType.ModalSubmit) {
    switch (interaction.customId) {
      case "SUGGEST_APPROVE_MODAL":
        return suggestionHandler.handleApproveModal(interaction);

      case "SUGGEST_REJECT_MODAL":
        return suggestionHandler.handleRejectModal(interaction);

      case "SUGGEST_DELETE_MODAL":
        return suggestionHandler.handleDeleteModal(interaction);
    }
  }

  const settings = await getSettings(interaction.guild);

  // track stats
  if (settings.stats.enabled) statsHandler.trackInteractionStats(interaction).catch(() => {});
};