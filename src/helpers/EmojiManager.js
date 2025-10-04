
const fs = require("fs");
const path = require("path");

const EMOJI_FILE = path.join(__dirname, "../data/emojis.json");

class EmojiManager {
  constructor() {
    this.emojis = this.loadEmojis();
  }

  loadEmojis() {
    try {
      const data = fs.readFileSync(EMOJI_FILE, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading emojis:", error);
      return {};
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

  get(key) {
    return this.emojis[key] || "";
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
}

module.exports = new EmojiManager();
