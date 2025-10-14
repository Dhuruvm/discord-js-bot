const Canvas = require("canvas");
const { error, debug } = require("@helpers/Logger");
const fetch = require("node-fetch");

/**
 * Image Processing Utility
 * Handles aspect ratio adjustments, cropping, and resizing for PFP and banners
 */
class ImageProcessor {
  /**
   * Process image for profile picture (square 1:1)
   * @param {string} imageUrl - URL of the image
   * @param {number} size - Target size (default 512)
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async processForPFP(imageUrl, size = 512) {
    try {
      const image = await this.loadImage(imageUrl);
      
      // Create square canvas
      const canvas = Canvas.createCanvas(size, size);
      const ctx = canvas.getContext("2d");
      
      // Calculate crop dimensions to maintain aspect ratio
      const minDim = Math.min(image.width, image.height);
      const sx = (image.width - minDim) / 2;
      const sy = (image.height - minDim) / 2;
      
      // Draw cropped and resized image
      ctx.drawImage(image, sx, sy, minDim, minDim, 0, 0, size, size);
      
      return canvas.toBuffer("image/png");
    } catch (ex) {
      error("processForPFP", ex);
      return null;
    }
  }

  /**
   * Process image for banner (wide 16:9)
   * @param {string} imageUrl - URL of the image
   * @param {number} width - Target width (default 960)
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async processForBanner(imageUrl, width = 960) {
    try {
      const image = await this.loadImage(imageUrl);
      
      // Calculate height for 16:9 aspect ratio
      const height = Math.floor(width / (16 / 9));
      
      // Create banner canvas
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      
      // Calculate dimensions to fill canvas while maintaining aspect
      const targetRatio = 16 / 9;
      const imageRatio = image.width / image.height;
      
      let sx, sy, sWidth, sHeight;
      
      if (imageRatio > targetRatio) {
        // Image is wider than target
        sHeight = image.height;
        sWidth = sHeight * targetRatio;
        sx = (image.width - sWidth) / 2;
        sy = 0;
      } else {
        // Image is taller than target
        sWidth = image.width;
        sHeight = sWidth / targetRatio;
        sx = 0;
        sy = (image.height - sHeight) / 2;
      }
      
      // Draw cropped and resized image
      ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, width, height);
      
      return canvas.toBuffer("image/png");
    } catch (ex) {
      error("processForBanner", ex);
      return null;
    }
  }

  /**
   * Load image from URL
   * @param {string} url - Image URL
   * @returns {Promise<Canvas.Image>} Loaded image
   */
  async loadImage(url) {
    try {
      const response = await fetch(url);
      const buffer = await response.buffer();
      return await Canvas.loadImage(buffer);
    } catch (ex) {
      error("loadImage", ex);
      throw ex;
    }
  }

  /**
   * Get image dimensions
   * @param {string} url - Image URL
   * @returns {Promise<{width: number, height: number}>} Image dimensions
   */
  async getImageDimensions(url) {
    try {
      const image = await this.loadImage(url);
      return {
        width: image.width,
        height: image.height,
      };
    } catch (ex) {
      error("getImageDimensions", ex);
      return null;
    }
  }

  /**
   * Add rounded corners to image
   * @param {Buffer} imageBuffer - Image buffer
   * @param {number} radius - Corner radius
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async addRoundedCorners(imageBuffer, radius = 20) {
    try {
      const image = await Canvas.loadImage(imageBuffer);
      const canvas = Canvas.createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      
      // Draw rounded rectangle clipping path
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(image.width - radius, 0);
      ctx.quadraticCurveTo(image.width, 0, image.width, radius);
      ctx.lineTo(image.width, image.height - radius);
      ctx.quadraticCurveTo(image.width, image.height, image.width - radius, image.height);
      ctx.lineTo(radius, image.height);
      ctx.quadraticCurveTo(0, image.height, 0, image.height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();
      
      // Draw image
      ctx.drawImage(image, 0, 0);
      
      return canvas.toBuffer("image/png");
    } catch (ex) {
      error("addRoundedCorners", ex);
      return imageBuffer;
    }
  }
}

module.exports = new ImageProcessor();
