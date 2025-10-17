
const axios = require("axios");
const cheerio = require("cheerio");
const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");
const { debug, error } = require("@helpers/Logger");

/**
 * Pinterest Scraper Service
 * Scrapes Pinterest pins and stores them with duplicate detection
 */
class PinterestScraper {
  constructor() {
    this.baseUrl = "https://www.pinterest.com";
    this.storageDir = path.join(process.cwd(), "pinterest_storage");
    this.categories = {
      boy: "aesthetic pfp boy",
      girl: "aesthetic pfp girl",
      matching: "matching pfp",
    };
    
    // In-memory cache for quick duplicate checks
    this.hashCache = new Map();
    
    // Initialize storage
    this.initializeStorage();
  }

  /**
   * Initialize storage directories
   */
  async initializeStorage() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      await fs.mkdir(path.join(this.storageDir, "boy"), { recursive: true });
      await fs.mkdir(path.join(this.storageDir, "girl"), { recursive: true });
      await fs.mkdir(path.join(this.storageDir, "matching"), { recursive: true });
      
      // Load existing hashes into cache
      await this.loadHashCache();
      debug("Pinterest storage initialized");
    } catch (err) {
      error("Failed to initialize Pinterest storage:", err);
    }
  }

  /**
   * Load existing image hashes into cache
   */
  async loadHashCache() {
    try {
      for (const category of Object.keys(this.categories)) {
        const hashFile = path.join(this.storageDir, category, "hashes.json");
        try {
          const data = await fs.readFile(hashFile, "utf8");
          const hashes = JSON.parse(data);
          this.hashCache.set(category, new Set(hashes));
        } catch {
          this.hashCache.set(category, new Set());
        }
      }
    } catch (err) {
      error("Failed to load hash cache:", err);
    }
  }

  /**
   * Save hash cache to disk
   */
  async saveHashCache(category) {
    try {
      const hashFile = path.join(this.storageDir, category, "hashes.json");
      const hashes = Array.from(this.hashCache.get(category) || []);
      await fs.writeFile(hashFile, JSON.stringify(hashes, null, 2));
    } catch (err) {
      error("Failed to save hash cache:", err);
    }
  }

  /**
   * Generate hash for image URL to detect duplicates
   */
  generateHash(url) {
    return crypto.createHash("md5").update(url).digest("hex");
  }

  /**
   * Check if image is duplicate
   */
  isDuplicate(category, imageUrl) {
    const hash = this.generateHash(imageUrl);
    const categoryHashes = this.hashCache.get(category) || new Set();
    return categoryHashes.has(hash);
  }

  /**
   * Add image hash to cache
   */
  addHash(category, imageUrl) {
    const hash = this.generateHash(imageUrl);
    const categoryHashes = this.hashCache.get(category) || new Set();
    categoryHashes.add(hash);
    this.hashCache.set(category, categoryHashes);
  }

  /**
   * Scrape Pinterest for images
   */
  async scrapePinterest(query, category) {
    try {
      const searchUrl = `${this.baseUrl}/search/pins/?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const pins = [];

      // Extract Pinterest data from script tags
      $("script").each((i, elem) => {
        const content = $(elem).html();
        if (content && content.includes("__PWS_DATA__")) {
          try {
            const jsonMatch = content.match(/__PWS_DATA__\s*=\s*({.*?});/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[1]);
              this.extractPinsFromData(data, pins, category);
            }
          } catch (err) {
            // Continue to next script tag
          }
        }
      });

      return pins.slice(0, 25); // Limit to 25 results
    } catch (err) {
      error("Pinterest scraping error:", err.message);
      return [];
    }
  }

  /**
   * Extract pins from Pinterest data object
   */
  extractPinsFromData(data, pins, category) {
    if (!data || typeof data !== "object") return;

    // Recursively search for pin data
    if (data.images && data.images.orig) {
      const imageUrl = data.images.orig.url;
      if (imageUrl && !this.isDuplicate(category, imageUrl)) {
        pins.push({
          id: data.id || this.generateHash(imageUrl).substring(0, 10),
          title: data.title || data.grid_title || "Untitled",
          description: data.description || "",
          image: imageUrl,
          link: data.link || `https://www.pinterest.com/pin/${data.id}`,
        });
        this.addHash(category, imageUrl);
      }
    }

    // Recursively search nested objects
    for (const key in data) {
      if (typeof data[key] === "object") {
        this.extractPinsFromData(data[key], pins, category);
      }
    }
  }

  /**
   * Save pin metadata to storage
   */
  async savePinMetadata(category, pins) {
    try {
      const metadataFile = path.join(this.storageDir, category, "metadata.json");
      let existingData = [];
      
      try {
        const data = await fs.readFile(metadataFile, "utf8");
        existingData = JSON.parse(data);
      } catch {
        // File doesn't exist, start fresh
      }

      // Merge new pins with existing, avoiding duplicates by ID
      const existingIds = new Set(existingData.map(p => p.id));
      const newPins = pins.filter(p => !existingIds.has(p.id));
      const updatedData = [...existingData, ...newPins];

      await fs.writeFile(metadataFile, JSON.stringify(updatedData, null, 2));
      await this.saveHashCache(category);
      
      debug(`Saved ${newPins.length} new pins to ${category} category`);
    } catch (err) {
      error("Failed to save pin metadata:", err);
    }
  }

  /**
   * Get cached pins from storage
   */
  async getCachedPins(category, limit = 25) {
    try {
      const metadataFile = path.join(this.storageDir, category, "metadata.json");
      const data = await fs.readFile(metadataFile, "utf8");
      const pins = JSON.parse(data);
      
      // Shuffle and return random selection
      const shuffled = pins.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Search with custom query
   */
  async searchCustomQuery(query, limit = 5) {
    const category = "custom";
    const cacheKey = `custom_${this.generateHash(query)}`;
    
    debug(`Scraping Pinterest for custom query: ${query}`);
    const pins = await this.scrapePinterest(query, cacheKey);
    
    if (pins.length > 0) {
      return pins.slice(0, limit);
    }
    
    return this.getFallbackResults(query).slice(0, limit);
  }

  /**
   * Search and store pins
   */
  async searchAndStore(gender = "neutral", type = "pfp", limit = 5) {
    let category = "matching"; // default

    if (type === "pfp") {
      if (gender === "male") category = "boy";
      else if (gender === "female") category = "girl";
    }

    const query = this.categories[category];
    
    // Try to get cached pins first
    let pins = await this.getCachedPins(category);
    
    // If cache is empty or small, scrape new pins
    if (pins.length < 10) {
      debug(`Scraping Pinterest for: ${query}`);
      const newPins = await this.scrapePinterest(query, category);
      
      if (newPins.length > 0) {
        await this.savePinMetadata(category, newPins);
        pins = [...newPins, ...pins];
      }
    }

    const results = pins.length > 0 ? pins : this.getFallbackResults(query);
    return results.slice(0, limit);
  }

  /**
   * Get fallback results when scraping fails
   */
  getFallbackResults(query) {
    const placeholders = [];
    const baseQuery = encodeURIComponent(query);
    
    for (let i = 0; i < 5; i++) {
      placeholders.push({
        id: `fallback-${i}`,
        title: `${query} - Result ${i + 1}`,
        description: "Unable to fetch from Pinterest. Please try again later.",
        image: null,
        link: `https://www.pinterest.com/search/pins/?q=${baseQuery}`,
        isFallback: true,
      });
    }
    
    return placeholders;
  }

  /**
   * Clean up duplicates in storage
   */
  async cleanupDuplicates() {
    try {
      for (const category of Object.keys(this.categories)) {
        const metadataFile = path.join(this.storageDir, category, "metadata.json");
        const data = await fs.readFile(metadataFile, "utf8");
        const pins = JSON.parse(data);
        
        const uniquePins = [];
        const seenHashes = new Set();
        
        for (const pin of pins) {
          const hash = this.generateHash(pin.image);
          if (!seenHashes.has(hash)) {
            uniquePins.push(pin);
            seenHashes.add(hash);
          }
        }
        
        await fs.writeFile(metadataFile, JSON.stringify(uniquePins, null, 2));
        this.hashCache.set(category, seenHashes);
        await this.saveHashCache(category);
        
        debug(`Cleaned ${pins.length - uniquePins.length} duplicates from ${category}`);
      }
    } catch (err) {
      error("Failed to cleanup duplicates:", err);
    }
  }
}

module.exports = new PinterestScraper();
