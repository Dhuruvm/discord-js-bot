const { error, debug } = require("@helpers/Logger");
const fetch = require("node-fetch");

/**
 * Pinterest API Service
 * Handles search, caching, rate limiting, and safe search filtering
 */
class PinterestService {
  constructor() {
    this.baseUrl = "https://api.pinterest.com/v5";
    this.accessToken = process.env.PINTEREST_ACCESS_TOKEN;
    this.appId = process.env.PINTEREST_APP_ID;
    this.appSecret = process.env.PINTEREST_APP_SECRET;
    
    // Cache system (10 minute TTL)
    this.cache = new Map();
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes
    
    // Rate limiting
    this.lastRequest = 0;
    this.minRequestInterval = 1000; // 1 second between requests
    this.requestQueue = [];
  }

  /**
   * Search Pinterest for pins based on query
   * @param {Object} options - Search options
   * @param {string} options.query - Search query
   * @param {string} options.gender - Gender filter (male/female/neutral)
   * @param {string} options.type - Type (pfp/banner)
   * @param {string} options.format - Format (gif/image)
   * @param {string} options.style - Style filter
   * @returns {Promise<Array>} Array of pin objects
   */
  async searchPins({ query, gender = "neutral", type = "pfp", format = "image", style = "" }) {
    // Build enhanced query
    let enhancedQuery = query;
    
    // Add type-specific keywords
    if (type === "pfp") {
      enhancedQuery += " profile picture avatar";
    } else if (type === "banner") {
      enhancedQuery += " banner header cover";
    }
    
    // Add gender filter
    if (gender === "male") {
      enhancedQuery += " male man boy";
    } else if (gender === "female") {
      enhancedQuery += " female woman girl";
    }
    
    // Add format filter
    if (format === "gif") {
      enhancedQuery += " animated gif";
    }
    
    // Add style if provided
    if (style) {
      enhancedQuery += ` ${style}`;
    }
    
    // Add safe search
    enhancedQuery += " safe high quality";
    
    // Check cache first
    const cacheKey = this.getCacheKey({ query: enhancedQuery, type, format });
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      debug("Returning cached Pinterest results");
      return cached;
    }
    
    try {
      // Rate limit check
      await this.waitForRateLimit();
      
      // Make API request
      const searchUrl = `${this.baseUrl}/search/pins?query=${encodeURIComponent(enhancedQuery)}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          error("Pinterest API rate limit exceeded");
          return this.getFallbackResults(query, type);
        }
        throw new Error(`Pinterest API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process and filter results
      const pins = this.processResults(data.items || [], type, format);
      
      // Cache results
      this.addToCache(cacheKey, pins);
      
      return pins;
    } catch (ex) {
      error("searchPins", ex);
      // Return fallback results
      return this.getFallbackResults(query, type);
    }
  }

  /**
   * Process and filter Pinterest results
   * @param {Array} items - Raw Pinterest items
   * @param {string} type - Type filter
   * @param {string} format - Format filter
   * @returns {Array} Processed pins
   */
  processResults(items, type, format) {
    if (!items || items.length === 0) return [];
    
    return items
      .filter(item => {
        // Filter by format if GIF is requested
        if (format === "gif") {
          const media = item.media?.images?.originals;
          return media?.url?.endsWith(".gif") || item.dominant_color;
        }
        return true;
      })
      .map(item => ({
        id: item.id,
        title: item.title || "Untitled",
        description: item.description || "",
        image: this.getBestImageUrl(item, type),
        link: item.link || `https://pinterest.com/pin/${item.id}`,
        aspectRatio: type === "pfp" ? "1:1" : "16:9",
      }))
      .slice(0, 25); // Limit to 25 results for carousel
  }

  /**
   * Get the best image URL from a pin based on type
   * @param {Object} item - Pinterest pin item
   * @param {string} type - Type (pfp/banner)
   * @returns {string} Image URL
   */
  getBestImageUrl(item, type) {
    const media = item.media?.images;
    
    if (!media) return null;
    
    // Try to get the best quality image
    if (media.originals?.url) return media.originals.url;
    if (media["600x"]?.url) return media["600x"].url;
    if (media["400x300"]?.url) return media["400x300"].url;
    if (media["200x150"]?.url) return media["200x150"].url;
    
    return null;
  }

  /**
   * Get fallback results using web scraping (when API fails)
   * @param {string} query - Search query
   * @param {string} type - Type
   * @returns {Array} Fallback pins
   */
  getFallbackResults(query, type) {
    debug(`Using fallback for query: ${query}`);
    
    // Return placeholder structure
    const placeholders = [];
    const baseQuery = encodeURIComponent(query);
    
    for (let i = 0; i < 5; i++) {
      placeholders.push({
        id: `fallback-${i}`,
        title: `${query} - Result ${i + 1}`,
        description: "Unable to fetch from Pinterest API. Please try again later.",
        image: null,
        link: `https://www.pinterest.com/search/pins/?q=${baseQuery}`,
        aspectRatio: type === "pfp" ? "1:1" : "16:9",
        isFallback: true,
      });
    }
    
    return placeholders;
  }

  /**
   * Wait for rate limit
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest = Date.now();
  }

  /**
   * Generate cache key
   * @param {Object} params - Parameters
   * @returns {string} Cache key
   */
  getCacheKey(params) {
    return JSON.stringify(params);
  }

  /**
   * Get from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Add to cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  addToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    
    // Clean old cache entries (keep max 100)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new PinterestService();
