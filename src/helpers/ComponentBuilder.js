const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require("discord.js");

/**
 * Component Builder - Utility for creating common Discord component patterns
 * Provides pre-built component configurations for consistent UI across commands
 */
class ComponentBuilder {
  /**
   * Create a pagination component row
   * @param {Object} options - Pagination options
   * @param {string} options.previousId - Custom ID for previous button
   * @param {string} options.nextId - Custom ID for next button
   * @param {number} options.currentPage - Current page number
   * @param {number} options.totalPages - Total number of pages
   * @param {boolean} options.showPageNumber - Show page number button
   */
  static pagination({ previousId = 'prev', nextId = 'next', currentPage = 1, totalPages = 1, showPageNumber = true }) {
    const row = new ActionRowBuilder();
    
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(previousId)
        .setLabel('◀️ Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 1)
    );

    if (showPageNumber) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('page-info')
          .setLabel(`${currentPage} / ${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    }

    row.addComponents(
      new ButtonBuilder()
        .setCustomId(nextId)
        .setLabel('Next ▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages)
    );

    return row;
  }

  /**
   * Create a confirmation dialog row
   * @param {Object} options - Confirmation options
   * @param {string} options.confirmId - Custom ID for confirm button
   * @param {string} options.cancelId - Custom ID for cancel button
   * @param {string} options.confirmLabel - Label for confirm button
   * @param {string} options.cancelLabel - Label for cancel button
   */
  static confirmation({ 
    confirmId = 'confirm', 
    cancelId = 'cancel',
    confirmLabel = '✓ Confirm',
    cancelLabel = '✕ Cancel'
  }) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmId)
        .setLabel(confirmLabel)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(cancelId)
        .setLabel(cancelLabel)
        .setStyle(ButtonStyle.Danger)
    );
  }

  /**
   * Create a navigation row
   * @param {Object} options - Navigation options
   * @param {boolean} options.back - Show back button
   * @param {boolean} options.home - Show home button
   * @param {boolean} options.refresh - Show refresh button
   * @param {string} options.backId - Custom ID for back button
   * @param {string} options.homeId - Custom ID for home button
   * @param {string} options.refreshId - Custom ID for refresh button
   */
  static navigation({ 
    back = true, 
    home = false, 
    refresh = false,
    backId = 'back',
    homeId = 'home',
    refreshId = 'refresh'
  }) {
    const row = new ActionRowBuilder();

    if (back) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(backId)
          .setLabel('◀️ Back')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    if (home) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(homeId)
          .setLabel('🏠 Home')
          .setStyle(ButtonStyle.Primary)
      );
    }

    if (refresh) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(refreshId)
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    return row;
  }

  /**
   * Create a link buttons row
   * @param {Object} options - Link options
   * @param {string} options.invite - Bot invite URL
   * @param {string} options.support - Support server URL
   * @param {string} options.docs - Documentation URL
   * @param {string} options.website - Website URL
   */
  static links({ invite, support, docs, website }) {
    const row = new ActionRowBuilder();

    if (invite) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('🔗 Invite')
          .setStyle(ButtonStyle.Link)
          .setURL(invite)
      );
    }

    if (support) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('💬 Support')
          .setStyle(ButtonStyle.Link)
          .setURL(support)
      );
    }

    if (docs) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('📚 Docs')
          .setStyle(ButtonStyle.Link)
          .setURL(docs)
      );
    }

    if (website) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('🌐 Website')
          .setStyle(ButtonStyle.Link)
          .setURL(website)
      );
    }

    return row;
  }

  /**
   * Create an action buttons row
   * @param {Array} buttons - Array of button configurations
   * Each button should have: {customId, label, style, emoji?, disabled?}
   */
  static actions(buttons) {
    const row = new ActionRowBuilder();

    buttons.forEach(btn => {
      const button = new ButtonBuilder()
        .setCustomId(btn.customId)
        .setLabel(btn.label)
        .setStyle(ButtonStyle[btn.style] || ButtonStyle.Secondary);

      if (btn.emoji) button.setEmoji(btn.emoji);
      if (btn.disabled) button.setDisabled(true);

      row.addComponents(button);
    });

    return row;
  }

  /**
   * Create a category select menu
   * @param {Object} options - Select menu options
   * @param {string} options.customId - Custom ID for the menu
   * @param {string} options.placeholder - Placeholder text
   * @param {Array} options.categories - Array of categories [{label, value, description, emoji}]
   */
  static categorySelect({ customId, placeholder = 'Select a category', categories }) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .addOptions(
        categories.map(cat => ({
          label: cat.label,
          value: cat.value,
          description: cat.description || undefined,
          emoji: cat.emoji || undefined,
        }))
      );

    return new ActionRowBuilder().addComponents(selectMenu);
  }

  /**
   * Create filter/sort controls
   * @param {Object} options - Filter options
   * @param {Array} options.filters - Array of filter buttons
   * @param {string} options.activeFilter - Currently active filter
   */
  static filters({ filters, activeFilter }) {
    const row = new ActionRowBuilder();

    filters.forEach(filter => {
      const isActive = filter.value === activeFilter;
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`filter-${filter.value}`)
          .setLabel(filter.label)
          .setEmoji(filter.emoji || undefined)
          .setStyle(isActive ? ButtonStyle.Primary : ButtonStyle.Secondary)
      );
    });

    return row;
  }

  /**
   * Create a quick settings row
   * @param {Array} settings - Array of setting toggles [{customId, label, emoji, enabled}]
   */
  static settings(settings) {
    const row = new ActionRowBuilder();

    settings.forEach(setting => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(setting.customId)
          .setLabel(`${setting.emoji || ''} ${setting.label} ${setting.enabled ? '✓' : '✕'}`.trim())
          .setStyle(setting.enabled ? ButtonStyle.Success : ButtonStyle.Secondary)
      );
    });

    return row;
  }

  /**
   * Create a multi-choice select menu
   * @param {Object} options - Multi-choice options
   * @param {string} options.customId - Custom ID
   * @param {string} options.placeholder - Placeholder text
   * @param {Array} options.choices - Array of choices [{label, value, description, emoji, default}]
   * @param {number} options.min - Minimum selections
   * @param {number} options.max - Maximum selections
   */
  static multiChoice({ customId, placeholder = 'Select options', choices, min = 1, max = 1 }) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setMinValues(min)
      .setMaxValues(max)
      .addOptions(
        choices.map(choice => ({
          label: choice.label,
          value: choice.value,
          description: choice.description || undefined,
          emoji: choice.emoji || undefined,
          default: choice.default || false,
        }))
      );

    return new ActionRowBuilder().addComponents(selectMenu);
  }

  /**
   * Disable all components in an array of action rows
   * @param {Array} components - Array of ActionRowBuilders
   * @returns {Array} Array of ActionRowBuilders with disabled components
   */
  static disableAll(components) {
    return components.map(row => {
      const newRow = new ActionRowBuilder();
      row.components.forEach(component => {
        if (component.data.style === ButtonStyle.Link) {
          newRow.addComponents(component);
        } else if (component.data.type === 3) {
          newRow.addComponents(
            StringSelectMenuBuilder.from(component.data).setDisabled(true)
          );
        } else {
          newRow.addComponents(
            ButtonBuilder.from(component.data).setDisabled(true)
          );
        }
      });
      return newRow;
    });
  }
}

module.exports = ComponentBuilder;
