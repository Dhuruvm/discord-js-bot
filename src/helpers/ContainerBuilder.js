const { MessageFlags, ButtonBuilder, ButtonStyle } = require("discord.js");

const COMPONENTS_V2_FLAG = 1 << 15; // 32768

class ContainerBuilder {
  constructor() {
    this.containers = [];
  }

  addContainer({ accentColor = null, components = [], spoiler = false, id = null } = {}) {
    const container = {
      type: 17,
      components: components
    };

    if (accentColor !== null) {
      container.accent_color = accentColor;
    }

    if (spoiler) {
      container.spoiler = true;
    }

    if (id !== null) {
      container.id = id;
    }

    this.containers.push(container);
    return this;
  }

  static createTextDisplay(content) {
    return {
      type: 10,
      content: content
    };
  }

  static createSeparator() {
    return {
      type: 14
    };
  }

  static createMediaGallery(items) {
    return {
      type: 12,
      items: items
    };
  }

  static createThumbnail(url) {
    return {
      type: 12,
      items: [{
        media: {
          url: url
        }
      }]
    };
  }

  static createActionRow(components) {
    return {
      type: 1,
      components: components
    };
  }

  static createButton({ customId, label, style = 'Secondary', emoji, url, disabled = false }) {
    const buttonStyle = ButtonStyle[style] || ButtonStyle.Secondary;
    const button = new ButtonBuilder()
      .setStyle(buttonStyle)
      .setDisabled(disabled);

    if (label) button.setLabel(label);
    if (emoji) button.setEmoji(emoji);
    
    if (buttonStyle === ButtonStyle.Link) {
      button.setURL(url);
    } else {
      button.setCustomId(customId);
    }

    return button.toJSON();
  }

  build() {
    return {
      flags: COMPONENTS_V2_FLAG,
      components: this.containers
    };
  }

  static quickMessage(title, description = null, fields = [], accentColor = 0xFFFFFF, buttons = []) {
    const components = [];

    if (title) {
      components.push(ContainerBuilder.createTextDisplay(`## ${title}`));
    }

    if (description) {
      components.push(ContainerBuilder.createTextDisplay(description));
    }

    if (fields.length > 0) {
      components.push(ContainerBuilder.createSeparator());
      fields.forEach(field => {
        const fieldText = field.inline 
          ? `**${field.name}:** ${field.value}`
          : `**${field.name}**\n${field.value}`;
        components.push(ContainerBuilder.createTextDisplay(fieldText));
      });
    }

    const result = new ContainerBuilder()
      .addContainer({ accentColor, components })
      .build();

    // Add buttons as separate top-level components if provided
    if (buttons.length > 0) {
      const buttonComponents = buttons.map(btn => ContainerBuilder.createButton(btn));
      const actionRow = ContainerBuilder.createActionRow(buttonComponents);
      result.components.push(actionRow);
    }

    return result;
  }

  static serverInfo({ title, description, thumbnail, fields, accentColor = 0xFFFFFF, buttons = [] }) {
    const components = [];

    if (thumbnail) {
      components.push(ContainerBuilder.createThumbnail(thumbnail));
    }

    if (title) {
      components.push(ContainerBuilder.createTextDisplay(`## ${title}`));
    }

    if (description) {
      components.push(ContainerBuilder.createTextDisplay(description));
    }

    if (fields && fields.length > 0) {
      components.push(ContainerBuilder.createSeparator());
      
      let i = 0;
      while (i < fields.length) {
        const field1 = fields[i];
        const field2 = fields[i + 1];
        
        if (field1.inline && field2 && field2.inline) {
          const combinedText = `**${field1.name}**\n${field1.value}\n\n**${field2.name}**\n${field2.value}`;
          components.push(ContainerBuilder.createTextDisplay(combinedText));
          i += 2;
        } else {
          const fieldText = `**${field1.name}**\n${field1.value}`;
          components.push(ContainerBuilder.createTextDisplay(fieldText));
          i += 1;
        }
      }
    }

    const result = new ContainerBuilder()
      .addContainer({ accentColor, components })
      .build();

    // Add buttons as separate top-level components if provided
    if (buttons && buttons.length > 0) {
      const buttonComponents = buttons.map(btn => ContainerBuilder.createButton(btn));
      const actionRow = ContainerBuilder.createActionRow(buttonComponents);
      result.components.push(actionRow);
    }

    return result;
  }

  static success(title, message, accentColor = 0xFFFFFF, buttons = []) {
    return ContainerBuilder.quickMessage(`<:success:1424072640829722745> ${title}`, message, [], accentColor, buttons);
  }

  static error(title, message, accentColor = 0xFFFFFF, buttons = []) {
    return ContainerBuilder.quickMessage(`<:error:1424072711671382076> ${title}`, message, [], accentColor, buttons);
  }

  static warning(title, message, accentColor = 0xFFFFFF, buttons = []) {
    return ContainerBuilder.quickMessage(`⚠️ ${title}`, message, [], accentColor, buttons);
  }

  static info(title, message, accentColor = 0xFFFFFF, buttons = []) {
    return ContainerBuilder.quickMessage(`ℹ️ ${title}`, message, [], accentColor, buttons);
  }

  /**
   * Create a professional bot info card matching Discord's clean design
   * @param {Object} options - Configuration options
   * @param {string} options.title - Main title (e.g., "About BotName")
   * @param {string} options.subtitle - Subtitle text (e.g., "Managed and Created by...")
   * @param {string} options.thumbnail - Bot avatar URL
   * @param {Array} options.statisticsFields - Array of {label, value} for statistics section
   * @param {Array} options.systemFields - Array of {label, value} for system section
   * @param {Array} options.buttons - Array of button configs {label, url, emoji}
   * @returns {Object} Container payload
   */
  static botInfoCard({ title, subtitle, thumbnail, statisticsFields = [], systemFields = [], buttons = [] }) {
    const components = [];

    // Add thumbnail (bot avatar) at top right
    if (thumbnail) {
      components.push(ContainerBuilder.createThumbnail(thumbnail));
    }

    // Add main title
    if (title) {
      components.push(ContainerBuilder.createTextDisplay(`# ${title}`));
    }

    // Add subtitle
    if (subtitle) {
      components.push(ContainerBuilder.createTextDisplay(subtitle));
    }

    // Add separator before sections
    if (statisticsFields.length > 0 || systemFields.length > 0) {
      components.push(ContainerBuilder.createSeparator());
    }

    // Add Statistics section with accent border
    if (statisticsFields.length > 0) {
      const statsHeader = ContainerBuilder.createTextDisplay(`### Statistics`);
      components.push(statsHeader);
      
      const statsText = statisticsFields
        .map(field => `${field.label}: **${field.value}**`)
        .join('\n');
      components.push(ContainerBuilder.createTextDisplay(statsText));
    }

    // Add spacing between sections
    if (statisticsFields.length > 0 && systemFields.length > 0) {
      components.push(ContainerBuilder.createSeparator());
    }

    // Add System section with accent border
    if (systemFields.length > 0) {
      const systemHeader = ContainerBuilder.createTextDisplay(`### System`);
      components.push(systemHeader);
      
      const systemText = systemFields
        .map(field => `${field.label}: **${field.value}**`)
        .join('\n');
      components.push(ContainerBuilder.createTextDisplay(systemText));
    }

    const result = new ContainerBuilder()
      .addContainer({ 
        accentColor: 0xFFFFFF, // White
        components 
      })
      .build();

    // Add buttons as separate action row
    if (buttons.length > 0) {
      const buttonComponents = buttons.map(btn => {
        const button = new ButtonBuilder()
          .setLabel(btn.label)
          .setURL(btn.url)
          .setStyle(ButtonStyle.Link);
        
        if (btn.emoji) {
          button.setEmoji(btn.emoji);
        }
        
        return button.toJSON();
      });
      
      const actionRow = ContainerBuilder.createActionRow(buttonComponents);
      result.components.push(actionRow);
    }

    return result;
  }
}

module.exports = ContainerBuilder;
