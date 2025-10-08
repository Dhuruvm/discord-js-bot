const { MessageFlags } = require("discord.js");

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

  static createActionRow(components) {
    return {
      type: 1,
      components: components
    };
  }

  build() {
    return {
      flags: COMPONENTS_V2_FLAG,
      components: this.containers
    };
  }

  static quickMessage(title, description = null, fields = [], accentColor = 0x5865F2) {
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

    return new ContainerBuilder()
      .addContainer({ accentColor, components })
      .build();
  }

  static success(title, message, accentColor = 0x57F287) {
    return ContainerBuilder.quickMessage(`**${title}**`, message, [], accentColor);
  }

  static error(title, message, accentColor = 0xED4245) {
    return ContainerBuilder.quickMessage(`**${title}**`, message, [], accentColor);
  }

  static warning(title, message, accentColor = 0xFEE75C) {
    return ContainerBuilder.quickMessage(`**${title}**`, message, [], accentColor);
  }

  static info(title, message, accentColor = 0x5865F2) {
    return ContainerBuilder.quickMessage(`**${title}**`, message, [], accentColor);
  }
}

module.exports = ContainerBuilder;
