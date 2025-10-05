const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require("discord.js");

/**
 * Modern Embed Helper - Creates clean, professional Discord embeds with interactive components
 * Compatible with Discord.js 14.14+ using EmbedBuilder and latest component system
 */
class ModernEmbed {
  constructor() {
    this.embed = new EmbedBuilder();
    this.color = 0xFFFFFF;
    this.components = [];
  }

  /**
   * Set embed color
   * @param {number} color - Hex color code
   */
  setColor(color) {
    this.color = color;
    this.embed.setColor(color);
    return this;
  }

  /**
   * Set main title and description
   * @param {string} title - Main title with emoji
   * @param {string} description - Main description text
   */
  setHeader(title, description) {
    this.embed.setTitle(title);
    if (description) {
      this.embed.setDescription(description);
    }
    return this;
  }

  /**
   * Set thumbnail image
   * @param {string} url - Image URL
   */
  setThumbnail(url) {
    this.embed.setThumbnail(url);
    return this;
  }

  /**
   * Set main image
   * @param {string} url - Image URL
   */
  setImage(url) {
    this.embed.setImage(url);
    return this;
  }

  /**
   * Add a field section
   * @param {string} name - Field name/header
   * @param {string} value - Field content
   * @param {boolean} inline - Whether to display inline
   */
  addField(name, value, inline = false) {
    this.embed.addFields({ name, value, inline });
    return this;
  }

  /**
   * Set footer text with optional icon
   * @param {string} text - Footer text
   * @param {string} iconURL - Optional icon URL
   */
  setFooter(text, iconURL) {
    this.embed.setFooter({ text, iconURL });
    return this;
  }

  /**
   * Set timestamp to current time or specific time
   * @param {Date} date - Optional date object
   */
  setTimestamp(date) {
    this.embed.setTimestamp(date || new Date());
    return this;
  }

  /**
   * Set author section
   * @param {string} name - Author name
   * @param {string} iconURL - Author icon URL
   * @param {string} url - Author URL
   */
  setAuthor(name, iconURL, url) {
    this.embed.setAuthor({ name, iconURL, url });
    return this;
  }

  /**
   * Add a button to the embed (max 5 buttons per row)
   * @param {Object} options - Button options
   * @param {string} options.customId - Custom ID for the button (required for non-link buttons)
   * @param {string} options.label - Button label text
   * @param {string} options.style - Button style: 'Primary', 'Secondary', 'Success', 'Danger', 'Link'
   * @param {string} options.emoji - Optional emoji for the button
   * @param {string} options.url - URL for link-style buttons
   * @param {boolean} options.disabled - Whether button is disabled
   */
  addButton({ customId, label, style = 'Secondary', emoji, url, disabled = false }) {
    let lastRow = this.components[this.components.length - 1];
    
    if (!lastRow || lastRow.components.length >= 5 || lastRow.components.some(c => c.data.type === 3)) {
      lastRow = new ActionRowBuilder();
      this.components.push(lastRow);
    }

    const buttonStyle = ButtonStyle[style] || ButtonStyle.Secondary;
    const button = new ButtonBuilder()
      .setStyle(buttonStyle)
      .setDisabled(disabled);

    if (label) button.setLabel(label);
    if (emoji) button.setEmoji(emoji);
    
    if (buttonStyle === ButtonStyle.Link) {
      if (url) button.setURL(url);
    } else {
      if (customId) button.setCustomId(customId);
    }

    lastRow.addComponents(button);
    return this;
  }

  /**
   * Add a select menu to the embed
   * @param {Object} options - Select menu options
   * @param {string} options.customId - Custom ID for the select menu
   * @param {string} options.placeholder - Placeholder text
   * @param {Array} options.options - Array of select options [{label, value, description, emoji, default}]
   * @param {number} options.minValues - Minimum values to select
   * @param {number} options.maxValues - Maximum values to select
   * @param {boolean} options.disabled - Whether select is disabled
   */
  addSelectMenu({ customId, placeholder, options, minValues = 1, maxValues = 1, disabled = false }) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder || 'Select an option')
      .setMinValues(minValues)
      .setMaxValues(maxValues)
      .setDisabled(disabled)
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    this.components.push(row);
    return this;
  }

  /**
   * Add an action row with quick action buttons
   * @param {string} type - Type of actions: 'navigation', 'confirmation', 'links'
   * @param {Object} options - Options for the action type
   */
  addQuickActions(type, options = {}) {
    const row = new ActionRowBuilder();

    switch (type) {
      case 'navigation':
        if (options.back) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(options.backId || 'back-btn')
              .setLabel(options.backLabel || '◀️ Back')
              .setStyle(ButtonStyle.Secondary)
          );
        }
        if (options.home) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(options.homeId || 'home-btn')
              .setLabel(options.homeLabel || '🏠 Home')
              .setStyle(ButtonStyle.Primary)
          );
        }
        if (options.next) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(options.nextId || 'next-btn')
              .setLabel(options.nextLabel || 'Next ▶️')
              .setStyle(ButtonStyle.Secondary)
          );
        }
        break;

      case 'confirmation':
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(options.confirmId || 'confirm-btn')
            .setLabel(options.confirmLabel || '✓ Confirm')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(options.cancelId || 'cancel-btn')
            .setLabel(options.cancelLabel || '✕ Cancel')
            .setStyle(ButtonStyle.Danger)
        );
        break;

      case 'links':
        if (options.invite) {
          row.addComponents(
            new ButtonBuilder()
              .setLabel('🔗 Invite Bot')
              .setStyle(ButtonStyle.Link)
              .setURL(options.invite)
          );
        }
        if (options.support) {
          row.addComponents(
            new ButtonBuilder()
              .setLabel('💬 Support')
              .setStyle(ButtonStyle.Link)
              .setURL(options.support)
          );
        }
        if (options.docs) {
          row.addComponents(
            new ButtonBuilder()
              .setLabel('📚 Docs')
              .setStyle(ButtonStyle.Link)
              .setURL(options.docs)
          );
        }
        if (options.website) {
          row.addComponents(
            new ButtonBuilder()
              .setLabel('🌐 Website')
              .setStyle(ButtonStyle.Link)
              .setURL(options.website)
          );
        }
        break;
    }

    if (row.components.length > 0) {
      this.components.push(row);
    }
    return this;
  }

  /**
   * Build and return the embed
   */
  build() {
    return this.embed;
  }

  /**
   * Return as message payload with components
   */
  toMessage() {
    const payload = { embeds: [this.embed] };
    if (this.components.length > 0) {
      payload.components = this.components;
    }
    return payload;
  }

  // Static quick methods for common embed types

  /**
   * Create a success embed
   * @param {string} title - Success title
   * @param {string} description - Success message
   * @param {string} footer - Optional footer text
   * @param {Object} components - Optional components configuration
   */
  static success(title, description, footer, components = null) {
    const embed = new ModernEmbed()
      .setColor(0xFFFFFF)
      .setHeader(`✅ ${title}`, description)
      .setTimestamp();
    
    if (footer) embed.setFooter(footer);
    if (components) embed.addQuickActions(components.type, components.options);
    return embed.toMessage();
  }

  /**
   * Create an error embed
   * @param {string} title - Error title
   * @param {string} description - Error message
   * @param {string} footer - Optional footer text
   * @param {Object} components - Optional components configuration
   */
  static error(title, description, footer, components = null) {
    const embed = new ModernEmbed()
      .setColor(0xFFFFFF)
      .setHeader(`❌ ${title}`, description)
      .setTimestamp();
    
    if (footer) embed.setFooter(footer);
    if (components) embed.addQuickActions(components.type, components.options);
    return embed.toMessage();
  }

  /**
   * Create a warning embed
   * @param {string} title - Warning title
   * @param {string} description - Warning message
   * @param {string} footer - Optional footer text
   * @param {Object} components - Optional components configuration
   */
  static warning(title, description, footer, components = null) {
    const embed = new ModernEmbed()
      .setColor(0xFFFFFF)
      .setHeader(`⚠️ ${title}`, description)
      .setTimestamp();
    
    if (footer) embed.setFooter(footer);
    if (components) embed.addQuickActions(components.type, components.options);
    return embed.toMessage();
  }

  /**
   * Create an info embed
   * @param {string} title - Info title
   * @param {string} description - Info message
   * @param {string} footer - Optional footer text
   * @param {Object} components - Optional components configuration
   */
  static info(title, description, footer, components = null) {
    const embed = new ModernEmbed()
      .setColor(0xFFFFFF)
      .setHeader(`ℹ️ ${title}`, description)
      .setTimestamp();
    
    if (footer) embed.setFooter(footer);
    if (components) embed.addQuickActions(components.type, components.options);
    return embed.toMessage();
  }
}

module.exports = ModernEmbed;
