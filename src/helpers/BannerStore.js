/**
 * Banner Store - Provides various banner designs for profile cards
 */

const BANNERS = {
  // Gradient Banners
  gradient_blue: {
    name: "Ocean Blue",
    type: "gradient",
    colors: ["#3B5998", "#1E3A8A", "#1E1F22"],
    description: "Deep ocean blue gradient",
    price: 0, // Free
  },
  gradient_purple: {
    name: "Royal Purple",
    type: "gradient",
    colors: ["#9333EA", "#7C3AED", "#6B21A8"],
    description: "Majestic purple gradient",
    price: 500,
  },
  gradient_pink: {
    name: "Sunset Pink",
    type: "gradient",
    colors: ["#EC4899", "#DB2777", "#BE185D"],
    description: "Vibrant sunset pink gradient",
    price: 500,
  },
  gradient_orange: {
    name: "Fire Orange",
    type: "gradient",
    colors: ["#F97316", "#EA580C", "#C2410C"],
    description: "Blazing orange gradient",
    price: 500,
  },
  gradient_green: {
    name: "Forest Green",
    type: "gradient",
    colors: ["#10B981", "#059669", "#047857"],
    description: "Fresh forest green gradient",
    price: 500,
  },
  gradient_red: {
    name: "Crimson Red",
    type: "gradient",
    colors: ["#EF4444", "#DC2626", "#B91C1C"],
    description: "Bold crimson red gradient",
    price: 500,
  },
  gradient_cyan: {
    name: "Cyber Cyan",
    type: "gradient",
    colors: ["#06B6D4", "#0891B2", "#0E7490"],
    description: "Futuristic cyan gradient",
    price: 500,
  },
  gradient_gold: {
    name: "Golden Sunset",
    type: "gradient",
    colors: ["#F59E0B", "#D97706", "#B45309"],
    description: "Luxurious golden gradient",
    price: 1000,
  },
  
  // Rainbow & Multi-color
  gradient_rainbow: {
    name: "Rainbow Pride",
    type: "gradient",
    colors: ["#FF0080", "#FF8C00", "#40E0D0", "#9370DB"],
    description: "Vibrant rainbow gradient",
    price: 1500,
  },
  gradient_aurora: {
    name: "Aurora Borealis",
    type: "gradient",
    colors: ["#00FFA3", "#03E1FF", "#DC1FFF"],
    description: "Mystical aurora colors",
    price: 1500,
  },
  
  // Dark Themes
  gradient_dark: {
    name: "Midnight Black",
    type: "gradient",
    colors: ["#1E293B", "#0F172A", "#020617"],
    description: "Sleek dark gradient",
    price: 750,
  },
  gradient_galaxy: {
    name: "Deep Space",
    type: "gradient",
    colors: ["#1E1B4B", "#312E81", "#4C1D95"],
    description: "Cosmic galaxy colors",
    price: 1000,
  },
  
  // Premium Patterns
  pattern_stars: {
    name: "Starry Night",
    type: "pattern",
    baseColors: ["#0F172A", "#1E293B"],
    description: "Twinkling stars pattern",
    price: 2000,
  },
  pattern_waves: {
    name: "Ocean Waves",
    type: "pattern",
    baseColors: ["#0891B2", "#06B6D4"],
    description: "Flowing wave pattern",
    price: 2000,
  },
  pattern_hexagons: {
    name: "Tech Hexagons",
    type: "pattern",
    baseColors: ["#3B82F6", "#2563EB"],
    description: "Modern hexagonal pattern",
    price: 2500,
  },
  
  // Special/Animated Effects
  special_holographic: {
    name: "Holographic",
    type: "special",
    colors: ["#FF00FF", "#00FFFF", "#FFFF00", "#FF00FF"],
    description: "Holographic shimmer effect",
    price: 5000,
  },
  special_neon: {
    name: "Neon Glow",
    type: "special",
    colors: ["#FF1493", "#00FFFF", "#FF1493"],
    description: "Bright neon glow",
    price: 3000,
  },
};

/**
 * Get banner configuration by ID
 * @param {string} bannerId 
 * @returns {object|null}
 */
function getBanner(bannerId) {
  return BANNERS[bannerId] || BANNERS.gradient_blue;
}

/**
 * Get all available banners
 * @returns {object}
 */
function getAllBanners() {
  return BANNERS;
}

/**
 * Get banners by price range
 * @param {number} maxPrice 
 * @returns {Array}
 */
function getAffordableBanners(maxPrice) {
  return Object.entries(BANNERS)
    .filter(([id, banner]) => banner.price <= maxPrice)
    .map(([id, banner]) => ({ id, ...banner }));
}

/**
 * Get banners by category/type
 * @param {string} type 
 * @returns {Array}
 */
function getBannersByType(type) {
  return Object.entries(BANNERS)
    .filter(([id, banner]) => banner.type === type)
    .map(([id, banner]) => ({ id, ...banner }));
}

/**
 * Check if user can afford banner
 * @param {number} userCoins 
 * @param {string} bannerId 
 * @returns {boolean}
 */
function canAffordBanner(userCoins, bannerId) {
  const banner = BANNERS[bannerId];
  if (!banner) return false;
  return userCoins >= banner.price;
}

module.exports = {
  BANNERS,
  getBanner,
  getAllBanners,
  getAffordableBanners,
  getBannersByType,
  canAffordBanner,
};
