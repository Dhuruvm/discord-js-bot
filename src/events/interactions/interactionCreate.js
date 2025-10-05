const { getSettings } = require("@schemas/Guild");
const { commandHandler, contextHandler, statsHandler, suggestionHandler, ticketHandler } = require("@src/handlers");
const { InteractionType } = require("discord.js");

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

      case "bot-premium-info":
        return interaction.reply({
          content: `⭐ **${client.user.username} Premium**\n\n` +
            `Unlock exclusive features:\n` +
            `• Advanced AutoMod Protection\n` +
            `• Priority Support & Updates\n` +
            `• 24/7 Security Monitoring\n` +
            `• Exclusive All-in-One Tools\n\n` +
            `Contact our support server for more information!`,
          ephemeral: true
        });
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