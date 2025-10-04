/**
 * Reusable Pagination Component
 * Handles button-based pagination for any list of items
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } = require("discord.js");

class PaginationHandler {
  /**
   * Create a paginated message
   * @param {Object} options - Pagination options
   * @param {import('discord.js').Message|import('discord.js').CommandInteraction} options.interaction - The interaction or message
   * @param {Array} options.items - Array of items to paginate
   * @param {Function} options.buildEmbed - Function that builds embed for current page (page, items) => EmbedBuilder
   * @param {number} options.itemsPerPage - Items per page (default: 10)
   * @param {number} options.timeout - Idle timeout in milliseconds (default: 120000)
   */
  static async create({ interaction, items, buildEmbed, itemsPerPage = 10, timeout = 120000 }) {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    if (totalPages === 0) {
      const message = "No items to display";
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply(message);
      }
      return interaction.reply(message);
    }

    let currentPage = 1;

    // Build buttons
    const buildButtons = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("pagination:first")
          .setEmoji("⏮️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId("pagination:prev")
          .setEmoji("◀️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId("pagination:stop")
          .setEmoji("⏹️")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("pagination:next")
          .setEmoji("▶️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages),
        new ButtonBuilder()
          .setCustomId("pagination:last")
          .setEmoji("⏭️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages)
      );
    };

    // Build page
    const buildPage = (page) => {
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageItems = items.slice(start, end);
      
      const embed = buildEmbed(page, pageItems, totalPages, items.length);
      const components = totalPages > 1 ? [buildButtons(page)] : [];
      
      return { embeds: [embed], components };
    };

    // Send initial message
    const response = buildPage(currentPage);
    const message = interaction.deferred || interaction.replied 
      ? await interaction.editReply(response)
      : await interaction.reply({ ...response, fetchReply: true });

    // If only one page, no need for collector
    if (totalPages === 1) return;

    // Create collector
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === (interaction.user?.id || interaction.author?.id),
      idle: timeout,
    });

    collector.on("collect", async (btnInteraction) => {
      await btnInteraction.deferUpdate();

      switch (btnInteraction.customId) {
        case "pagination:first":
          currentPage = 1;
          break;
        case "pagination:prev":
          currentPage = Math.max(1, currentPage - 1);
          break;
        case "pagination:next":
          currentPage = Math.min(totalPages, currentPage + 1);
          break;
        case "pagination:last":
          currentPage = totalPages;
          break;
        case "pagination:stop":
          collector.stop("user_stopped");
          return;
      }

      await message.edit(buildPage(currentPage));
    });

    collector.on("end", async (collected, reason) => {
      // Disable all buttons
      const disabledRow = new ActionRowBuilder().addComponents(
        buildButtons(currentPage).components.map(btn => ButtonBuilder.from(btn.data).setDisabled(true))
      );
      
      await message.edit({ components: totalPages > 1 ? [disabledRow] : [] }).catch(() => {});
    });

    return message;
  }
}

module.exports = PaginationHandler;
