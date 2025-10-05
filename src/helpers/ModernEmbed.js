const { EmbedBuilder } = require("discord.js");

/**
 * Modern Embed Helper - Creates clean, professional Discord embeds
 * Compatible with Discord.js 14.14+ using EmbedBuilder
 */
class ModernEmbed {
  constructor() {
    this.embed = new EmbedBuilder();
    this.color = 0xFFFFFF; // White default
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
   * Build and return the embed
   */
  build() {
    return this.embed;
  }

  /**
   * Return as message payload
   */
  toMessage() {
    return { embeds: [this.embed] };
  }

  // Static quick methods for common embed types

  /**
   * Create a success embed
   * @param {string} title - Success title
   * @param {string} description - Success message
   * @param {string} footer - Optional footer text
   */
  static success(title, description, footer) {
    const embed = new ModernEmbed()
      .setColor(0xFFFFFF) // White
      .setHeader(`✅ ${title}`, description)
      .setTimestamp();
    
    if (footer) embed.setFooter(footer);
    return embed.toMessage();
  }

  /**
   * Create an error embed
   * @param {string} title - Error title
   * @param {string} description - Error message
   * @param {string} footer - Optional footer text
   */
  static error(title, description, footer) {
    const embed = new ModernEmbed()
      .setColor(0xFFFFFF) // White
      .setHeader(`❌ ${title}`, description)
      .setTimestamp();
    
    if (footer) embed.setFooter(footer);
    return embed.toMessage();
  }

  /**
   * Create a warning embed
   * @param {string} title - Warning title
   * @param {string} description - Warning message
   * @param {string} footer - Optional footer text
   */
  static warning(title, description, footer) {
    const embed = new ModernEmbed()
      .setColor(0xFFFFFF) // White
      .setHeader(`⚠️ ${title}`, description)
      .setTimestamp();
    
    if (footer) embed.setFooter(footer);
    return embed.toMessage();
  }

  /**
   * Create an info embed
   * @param {string} title - Info title
   * @param {string} description - Info message
   * @param {string} footer - Optional footer text
   */
  static info(title, description, footer) {
    const embed = new ModernEmbed()
      .setColor(0xFFFFFF) // White
      .setHeader(`ℹ️ ${title}`, description)
      .setTimestamp();
    
    if (footer) embed.setFooter(footer);
    return embed.toMessage();
  }
}

module.exports = ModernEmbed;
