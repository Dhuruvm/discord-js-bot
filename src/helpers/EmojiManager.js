const fs = require("fs");
const path = require("path");

const EMOJI_FILE = path.join(__dirname, "../../emojis.json");

class EmojiManager {
  constructor() {
    this.emojis = this.loadEmojis();
    this.lastLoadTime = Date.now();
    this.cacheTimeout = 60000;
  }

  loadEmojis() {
    try {
      const data = fs.readFileSync(EMOJI_FILE, "utf8");
      this.lastLoadTime = Date.now();
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading emojis:", error);
      return {
        success: "<:success:1424072640829722745>",
        error: "<:error:1424072711671382076>",
        warning: "⚠️",
        info: "ℹ️",
        loading: "⏳"
      };
    }
  }

  saveEmojis() {
    try {
      fs.writeFileSync(EMOJI_FILE, JSON.stringify(this.emojis, null, 2));
      return true;
    } catch (error) {
      console.error("Error saving emojis:", error);
      return false;
    }
  }

  get(key, fallback = "") {
    if (Date.now() - this.lastLoadTime > this.cacheTimeout) {
      this.reload();
    }
    return this.emojis[key] || fallback;
  }
  
  has(key) {
    return key in this.emojis;
  }
  
  getAll() {
    if (Date.now() - this.lastLoadTime > this.cacheTimeout) {
      this.reload();
    }
    return { ...this.emojis };
  }
  
  format(name, text) {
    const emoji = this.get(name);
    return emoji ? `${emoji} ${text}` : text;
  }

  set(key, value) {
    this.emojis[key] = value;
    return this.saveEmojis();
  }

  remove(key) {
    if (this.emojis[key]) {
      delete this.emojis[key];
      return this.saveEmojis();
    }
    return false;
  }

  list() {
    return this.emojis;
  }

  reload() {
    this.emojis = this.loadEmojis();
    return true;
  }

  getSuccess() {
    return this.emojis.success || "✅";
  }

  getError() {
    return this.emojis.error || "❌";
  }

  getWarning() {
    return this.emojis.warning || "⚠️";
  }

  getInfo() {
    return this.emojis.info || "ℹ️";
  }

  getLoading() {
    return this.emojis.loading || "⏳";
  }
}

module.exports = new EmojiManager();
