const { MessageFlags, ComponentType, ButtonStyle } = require("discord.js");

/**
 * Modern Embed Builder using Discord Components V2
 * Creates professional, visually appealing embeds with sections and separators
 */
class ModernEmbed {
  constructor() {
    this.accentColor = 0x5865F2; // Default Discord Blurple
    this.componentsList = [];
    this.hasSeparator = false;
  }

  /**
   * Set the accent color for the container
   * @param {number|string} color - Hex color as number (0x5865F2) or string ("#5865F2")
   */
  setColor(color) {
    if (typeof color === 'string') {
      this.accentColor = parseInt(color.replace('#', '0x'));
    } else {
      this.accentColor = color;
    }
    return this;
  }

  /**
   * Add a header section with optional thumbnail
   * @param {string} title - The title text (supports markdown)
   * @param {string} description - The description text
   * @param {string} [thumbnailUrl] - Optional thumbnail URL
   * @param {string} [thumbnailDescription] - Optional thumbnail description
   */
  setHeader(title, description, thumbnailUrl = null, thumbnailDescription = null) {
    const section = {
      type: ComponentType.Section,
      components: [
        {
          type: ComponentType.TextDisplay,
          content: `# ${title}\n\n${description}`
        }
      ]
    };

    if (thumbnailUrl) {
      section.accessory = {
        type: ComponentType.Thumbnail,
        media: { url: thumbnailUrl },
        description: thumbnailDescription || title
      };
    }

    this.componentsList.push(section);
    this.hasSeparator = false;
    return this;
  }

  /**
   * Add a text section with header
   * @param {string} header - Section header (will be prefixed with ###)
   * @param {string} content - Section content
   * @param {object} [accessory] - Optional button or other accessory
   */
  addSection(header, content, accessory = null) {
    if (this.hasSeparator === false && this.componentsList.length > 0) {
      this.addSeparator();
    }

    const section = {
      type: ComponentType.Section,
      components: [
        {
          type: ComponentType.TextDisplay,
          content: `### ${header}\n\n${content}`
        }
      ]
    };

    if (accessory) {
      section.accessory = accessory;
    }

    this.componentsList.push(section);
    this.hasSeparator = false;
    return this;
  }

  /**
   * Add a simple text field without a section wrapper
   * @param {string} content - Text content (supports markdown)
   */
  addField(content) {
    if (this.hasSeparator === false && this.componentsList.length > 0) {
      this.addSeparator();
    }

    this.componentsList.push({
      type: ComponentType.TextDisplay,
      content: content
    });
    this.hasSeparator = false;
    return this;
  }

  /**
   * Add a separator/divider
   * @param {boolean} [divider=true] - Whether to show a visual divider line
   * @param {number} [spacing=2] - Spacing amount (1-3)
   */
  addSeparator(divider = true, spacing = 2) {
    if (this.componentsList.length > 0) {
      this.componentsList.push({
        type: ComponentType.Separator,
        divider: divider,
        spacing: spacing
      });
      this.hasSeparator = true;
    }
    return this;
  }

  /**
   * Add a footer
   * @param {string} text - Footer text
   * @param {boolean} [includeTimestamp=true] - Whether to include timestamp
   */
  setFooter(text, includeTimestamp = true) {
    // Add separator before footer if needed
    if (this.hasSeparator === false && this.componentsList.length > 0) {
      this.addSeparator(false, 1);
    }

    const timestamp = includeTimestamp ? ` • <t:${Math.floor(Date.now() / 1000)}:R>` : '';
    this.componentsList.push({
      type: ComponentType.TextDisplay,
      content: `*${text}*${timestamp}`
    });
    return this;
  }

  /**
   * Build the final container
   * @returns {object} Container object ready to use with Components V2
   */
  build() {
    return {
      type: ComponentType.Container,
      accent_color: this.accentColor,
      components: this.componentsList
    };
  }

  /**
   * Build and return as a message payload
   * @param {Array} [additionalComponents=[]] - Additional action rows (buttons, selects)
   * @returns {object} Complete message payload with Components V2 flag
   */
  toMessage(additionalComponents = []) {
    const container = this.build();
    return {
      components: [container, ...additionalComponents],
      flags: MessageFlags.IsComponentsV2
    };
  }

  /**
   * Create a quick success embed
   * @param {string} title - Title text
   * @param {string} description - Description text
   * @param {string} [footer] - Optional footer text
   * @returns {object} Complete message payload
   */
  static success(title, description, footer = null) {
    const embed = new ModernEmbed()
      .setColor(0x57F287) // Green
      .setHeader(`✅ ${title}`, description);

    if (footer) {
      embed.setFooter(footer);
    } else {
      embed.setFooter('Success');
    }

    return embed.toMessage();
  }

  /**
   * Create a quick error embed
   * @param {string} title - Title text
   * @param {string} description - Description text
   * @param {string} [footer] - Optional footer text
   * @returns {object} Complete message payload
   */
  static error(title, description, footer = null) {
    const embed = new ModernEmbed()
      .setColor(0xED4245) // Red
      .setHeader(`❌ ${title}`, description);

    if (footer) {
      embed.setFooter(footer);
    } else {
      embed.setFooter('Error');
    }

    return embed.toMessage();
  }

  /**
   * Create a quick warning embed
   * @param {string} title - Title text
   * @param {string} description - Description text
   * @param {string} [footer] - Optional footer text
   * @returns {object} Complete message payload
   */
  static warning(title, description, footer = null) {
    const embed = new ModernEmbed()
      .setColor(0xFEE75C) // Yellow
      .setHeader(`⚠️ ${title}`, description);

    if (footer) {
      embed.setFooter(footer);
    } else {
      embed.setFooter('Warning');
    }

    return embed.toMessage();
  }

  /**
   * Create a quick info embed
   * @param {string} title - Title text
   * @param {string} description - Description text
   * @param {string} [footer] - Optional footer text
   * @returns {object} Complete message payload
   */
  static info(title, description, footer = null) {
    const embed = new ModernEmbed()
      .setColor(0x5865F2) // Blurple
      .setHeader(`ℹ️ ${title}`, description);

    if (footer) {
      embed.setFooter(footer);
    } else {
      embed.setFooter('Information');
    }

    return embed.toMessage();
  }
}

module.exports = ModernEmbed;
