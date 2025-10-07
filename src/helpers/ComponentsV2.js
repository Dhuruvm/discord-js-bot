const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

let EMOJIS = {};
try {
  const emojisPath = path.join(__dirname, "../../emojis.json");
  EMOJIS = JSON.parse(fs.readFileSync(emojisPath, "utf-8"));
} catch (error) {
  console.error("Failed to load emojis.json:", error);
  EMOJIS = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
}

const COMPONENTS_V2_FLAG = 32768;

class ComponentsV2 {
  constructor() {
    this.components = [];
  }

  addText(content) {
    this.components.push({
      type: 10,
      content: content
    });
    return this;
  }

  addHeader(title, subtitle = null) {
    let content = `**${title}**`;
    if (subtitle) {
      content += `\n${subtitle}`;
    }
    this.components.push({
      type: 10,
      content: content
    });
    return this;
  }

  addField(name, value, inline = false) {
    const content = inline ? `**${name}:** ${value}` : `**${name}**\n${value}`;
    this.components.push({
      type: 10,
      content: content
    });
    return this;
  }

  addDivider() {
    this.components.push({
      type: 10,
      content: "─".repeat(30)
    });
    return this;
  }

  addButtonRow(buttons) {
    const actionRow = new ActionRowBuilder();
    
    buttons.forEach(btn => {
      const button = new ButtonBuilder()
        .setStyle(ButtonStyle[btn.style] || ButtonStyle.Secondary)
        .setDisabled(btn.disabled || false);

      if (btn.label) button.setLabel(btn.label);
      if (btn.emoji) button.setEmoji(btn.emoji);
      
      if (btn.style === 'Link') {
        button.setURL(btn.url);
      } else {
        button.setCustomId(btn.customId);
      }

      actionRow.addComponents(button);
    });

    this.components.push(actionRow.toJSON());
    return this;
  }

  addSelectMenu({ customId, placeholder, options, minValues = 1, maxValues = 1, disabled = false }) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder || 'Select an option')
      .setMinValues(minValues)
      .setMaxValues(maxValues)
      .setDisabled(disabled)
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    this.components.push(row.toJSON());
    return this;
  }

  build() {
    return {
      flags: COMPONENTS_V2_FLAG,
      components: this.components
    };
  }

  static success(title, message, buttons = null) {
    const cv2 = new ComponentsV2()
      .addHeader(`${EMOJIS.success || "✅"} ${title}`, message);
    
    if (buttons) {
      cv2.addButtonRow(buttons);
    }
    
    return cv2.build();
  }

  static error(title, message, buttons = null) {
    const cv2 = new ComponentsV2()
      .addHeader(`${EMOJIS.error || "❌"} ${title}`, message);
    
    if (buttons) {
      cv2.addButtonRow(buttons);
    }
    
    return cv2.build();
  }

  static warning(title, message, buttons = null) {
    const cv2 = new ComponentsV2()
      .addHeader(`${EMOJIS.warning || "⚠️"} ${title}`, message);
    
    if (buttons) {
      cv2.addButtonRow(buttons);
    }
    
    return cv2.build();
  }

  static info(title, message, buttons = null) {
    const cv2 = new ComponentsV2()
      .addHeader(`${EMOJIS.info || "ℹ️"} ${title}`, message);
    
    if (buttons) {
      cv2.addButtonRow(buttons);
    }
    
    return cv2.build();
  }

  static simpleText(message) {
    return new ComponentsV2()
      .addText(message)
      .build();
  }
}

module.exports = ComponentsV2;
