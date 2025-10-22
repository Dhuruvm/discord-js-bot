const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const ModernEmbed = require("./ModernEmbed");

/**
 * Interaction Helpers - Shared utilities for interactive command systems
 * Provides custom ID generation, pagination, and modal builders
 */

class InteractionHelpers {
  /**
   * Generate a unique custom ID for components
   * @param {string} system - System name (e.g., 'autorole', 'greet', 'automod', 'logs')
   * @param {string} action - Action type (e.g., 'add', 'remove', 'setup', 'config')
   * @param {string} [data] - Optional data to append
   * @returns {string} Custom ID string
   */
  static generateCustomId(system, action, data = null) {
    const parts = [system, action];
    if (data) parts.push(data);
    return parts.join(':');
  }

  /**
   * Parse a custom ID back into its components
   * @param {string} customId - Custom ID to parse
   * @returns {{system: string, action: string, data: string|null}}
   */
  static parseCustomId(customId) {
    const parts = customId.split(':');
    return {
      system: parts[0] || null,
      action: parts[1] || null,
      data: parts[2] || null
    };
  }

  /**
   * Create pagination components for large lists
   * @param {Array} items - Array of items to paginate
   * @param {number} page - Current page number (0-indexed)
   * @param {number} perPage - Items per page (default 10)
   * @param {string} customIdPrefix - Prefix for button custom IDs
   * @returns {{items: Array, components: Array, pageInfo: {current: number, total: number, hasNext: boolean, hasPrev: boolean}}}
   */
  static paginate(items, page = 0, perPage = 10, customIdPrefix = 'page') {
    const totalPages = Math.ceil(items.length / perPage);
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    const start = currentPage * perPage;
    const end = start + perPage;
    const pageItems = items.slice(start, end);

    const hasNext = currentPage < totalPages - 1;
    const hasPrev = currentPage > 0;

    const components = [];
    if (totalPages > 1) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`${customIdPrefix}:first:0`)
          .setLabel('⏮️ First')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!hasPrev),
        new ButtonBuilder()
          .setCustomId(`${customIdPrefix}:prev:${currentPage - 1}`)
          .setLabel('◀️ Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!hasPrev),
        new ButtonBuilder()
          .setCustomId(`${customIdPrefix}:info:${currentPage}`)
          .setLabel(`Page ${currentPage + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`${customIdPrefix}:next:${currentPage + 1}`)
          .setLabel('Next ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!hasNext),
        new ButtonBuilder()
          .setCustomId(`${customIdPrefix}:last:${totalPages - 1}`)
          .setLabel('Last ⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!hasNext)
      );
      components.push(row);
    }

    return {
      items: pageItems,
      components,
      pageInfo: {
        current: currentPage,
        total: totalPages,
        hasNext,
        hasPrev,
        showing: `${start + 1}-${Math.min(end, items.length)} of ${items.length}`
      }
    };
  }

  /**
   * Create a simple text input modal
   * @param {string} customId - Modal custom ID
   * @param {string} title - Modal title
   * @param {Object} textInput - Text input configuration
   * @param {string} textInput.customId - Input custom ID
   * @param {string} textInput.label - Input label
   * @param {string} [textInput.placeholder] - Input placeholder
   * @param {string} [textInput.value] - Default value
   * @param {boolean} [textInput.required] - Whether input is required
   * @param {number} [textInput.minLength] - Minimum length
   * @param {number} [textInput.maxLength] - Maximum length
   * @param {string} [textInput.style] - SHORT or PARAGRAPH
   * @returns {ModalBuilder}
   */
  static createTextModal(customId, title, textInput) {
    const modal = new ModalBuilder()
      .setCustomId(customId)
      .setTitle(title);

    const input = new TextInputBuilder()
      .setCustomId(textInput.customId)
      .setLabel(textInput.label)
      .setStyle(textInput.style === 'PARAGRAPH' ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(textInput.required !== false);

    if (textInput.placeholder) input.setPlaceholder(textInput.placeholder);
    if (textInput.value) input.setValue(textInput.value);
    if (textInput.minLength) input.setMinLength(textInput.minLength);
    if (textInput.maxLength) input.setMaxLength(textInput.maxLength);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);

    return modal;
  }

  /**
   * Create a multi-field modal
   * @param {string} customId - Modal custom ID
   * @param {string} title - Modal title
   * @param {Array<Object>} fields - Array of text input configurations (max 5)
   * @returns {ModalBuilder}
   */
  static createMultiFieldModal(customId, title, fields) {
    const modal = new ModalBuilder()
      .setCustomId(customId)
      .setTitle(title);

    fields.slice(0, 5).forEach(field => {
      const input = new TextInputBuilder()
        .setCustomId(field.customId)
        .setLabel(field.label)
        .setStyle(field.style === 'PARAGRAPH' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(field.required !== false);

      if (field.placeholder) input.setPlaceholder(field.placeholder);
      if (field.value) input.setValue(field.value);
      if (field.minLength) input.setMinLength(field.minLength);
      if (field.maxLength) input.setMaxLength(field.maxLength);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
    });

    return modal;
  }

  /**
   * Create a confirmation dialog with Yes/No buttons
   * @param {string} title - Dialog title
   * @param {string} description - Dialog description
   * @param {string} customIdPrefix - Prefix for button custom IDs
   * @param {string} [data] - Optional data to append to custom IDs
   * @returns {{embeds: Array, components: Array}}
   */
  static createConfirmation(title, description, customIdPrefix, data = null) {
    const embed = new ModernEmbed()
      .setColor(0xFFA500)
      .setHeader(`⚠️ ${title}`, description)
      .build();

    const yesId = data ? `${customIdPrefix}:yes:${data}` : `${customIdPrefix}:yes`;
    const noId = data ? `${customIdPrefix}:no:${data}` : `${customIdPrefix}:no`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(yesId)
        .setLabel('✅ Yes')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(noId)
        .setLabel('❌ No')
        .setStyle(ButtonStyle.Danger)
    );

    return {
      embeds: [embed],
      components: [row]
    };
  }

  /**
   * Create a string select menu for choices
   * @param {string} customId - Select menu custom ID
   * @param {string} placeholder - Placeholder text
   * @param {Array<{label: string, value: string, description?: string, emoji?: string}>} options - Select options
   * @param {number} [minValues] - Minimum values to select
   * @param {number} [maxValues] - Maximum values to select
   * @returns {ActionRowBuilder}
   */
  static createSelectMenu(customId, placeholder, options, minValues = 1, maxValues = 1) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setMinValues(minValues)
      .setMaxValues(Math.min(maxValues, options.length, 25))
      .addOptions(options.slice(0, 25).map(opt => ({
        label: opt.label,
        value: opt.value,
        description: opt.description,
        emoji: opt.emoji
      })));

    return new ActionRowBuilder().addComponents(select);
  }

  /**
   * Create a channel select menu
   * @param {string} customId - Select menu custom ID
   * @param {import('discord.js').Guild} guild - Guild object
   * @param {Array<string>} [channelTypes] - Filter by channel types
   * @param {string} [placeholder] - Placeholder text
   * @returns {ActionRowBuilder}
   */
  static createChannelSelectOptions(customId, guild, channelTypes = ['GUILD_TEXT'], placeholder = 'Select a channel') {
    const channels = guild.channels.cache
      .filter(c => channelTypes.includes(c.type) || (c.type === 0 && channelTypes.includes('GUILD_TEXT')))
      .sort((a, b) => a.position - b.position)
      .map(c => ({
        label: `#${c.name}`,
        value: c.id,
        description: c.topic ? c.topic.substring(0, 100) : 'No description'
      }));

    if (channels.length === 0) {
      return null;
    }

    return this.createSelectMenu(customId, placeholder, channels, 1, 1);
  }

  /**
   * Create a role select menu options
   * @param {import('discord.js').Guild} guild - Guild object
   * @param {number} [limit] - Max number of roles to show
   * @returns {Array<{label: string, value: string, description: string}>}
   */
  static getRoleSelectOptions(guild, limit = 25) {
    return guild.roles.cache
      .filter(r => r.id !== guild.id && !r.managed)
      .sort((a, b) => b.position - a.position)
      .map(r => ({
        label: r.name,
        value: r.id,
        description: `Position: ${r.position} | Members: ${r.members.size}`
      }))
      .slice(0, limit);
  }

  /**
   * Create toggle buttons (Enable/Disable)
   * @param {string} customIdPrefix - Prefix for button custom IDs
   * @param {boolean} currentState - Current state (true = enabled)
   * @param {string} [data] - Optional data to append
   * @returns {ActionRowBuilder}
   */
  static createToggleButtons(customIdPrefix, currentState, data = null) {
    const enableId = data ? `${customIdPrefix}:enable:${data}` : `${customIdPrefix}:enable`;
    const disableId = data ? `${customIdPrefix}:disable:${data}` : `${customIdPrefix}:disable`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(enableId)
        .setLabel('✅ Enable')
        .setStyle(ButtonStyle.Success)
        .setDisabled(currentState === true),
      new ButtonBuilder()
        .setCustomId(disableId)
        .setLabel('❌ Disable')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(currentState === false)
    );

    return row;
  }

  /**
   * Format a settings summary embed
   * @param {string} title - Settings title
   * @param {Object} settings - Settings object with key-value pairs
   * @param {number} [color] - Embed color
   * @returns {Object}
   */
  static formatSettings(title, settings, color = 0xFFFFFF) {
    const embed = new ModernEmbed()
      .setColor(color)
      .setHeader(`⚙️ ${title}`, null);

    Object.entries(settings).forEach(([key, value]) => {
      embed.addField(key, value.toString(), true);
    });

    return embed.build();
  }
}

module.exports = InteractionHelpers;
