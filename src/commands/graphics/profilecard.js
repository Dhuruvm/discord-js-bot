const { AttachmentBuilder, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { EMBED_COLORS } = require("@root/config");
const EMOJIS = require("@helpers/EmojiConstants");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "profilecard",
  description: "Generate a Discord-style profile card",
  category: "GRAPHICS",
  botPermissions: ["AttachFiles"],
  cooldown: 5,
  command: {
    enabled: true,
    aliases: ["profile", "card", "pc"],
    usage: "[user]",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The user to generate a profile card for",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "banner",
        description: "Custom banner image URL",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "bio",
        description: "Custom bio text",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    try {
      await message.channel.sendTyping();
      
      const user = message.mentions.users.first() || message.author;
      const member = await message.guild.members.fetch(user.id).catch(() => null);
      
      const buffer = await generateProfileCard(user, member);
      const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });
      
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setTitle(`${EMOJIS.PERSON} Profile Card`)
        .setDescription(`Profile card for **${user.username}**`)
        .setImage("attachment://profile.png")
        .setTimestamp();
      
      await message.safeReply({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error("Error generating profile card:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setDescription(`${EMOJIS.ERROR} | Failed to generate profile card. Error: ${error.message}`)
        .setTimestamp();
      await message.safeReply({ embeds: [errorEmbed] });
    }
  },

  async interactionRun(interaction) {
    await interaction.deferReply();
    
    try {
      const user = interaction.options.getUser("user") || interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const customBanner = interaction.options.getString("banner");
      const customBio = interaction.options.getString("bio");
      
      const buffer = await generateProfileCard(user, member, customBanner, customBio);
      const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });
      
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setTitle(`${EMOJIS.PERSON} Profile Card`)
        .setDescription(`Profile card for **${user.username}**`)
        .setImage("attachment://profile.png")
        .setTimestamp();
      
      await interaction.followUp({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error("Error generating profile card:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setDescription(`${EMOJIS.ERROR} | Failed to generate profile card. Error: ${error.message}`)
        .setTimestamp();
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};

async function generateProfileCard(user, member, customBanner = null, customBio = null) {
  // Canvas dimensions
  const width = 800;
  const height = 320;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Colors
  const bgColor = "#202225";
  const bannerHeight = height * 0.35;
  const avatarSize = 96;
  const avatarX = 40;
  const avatarY = bannerHeight - avatarSize / 3;

  // Status colors
  const statusColors = {
    online: "#43B581",
    idle: "#FAA61A",
    dnd: "#F04747",
    offline: "#747F8D",
  };

  // Draw background with rounded corners
  ctx.fillStyle = bgColor;
  roundRect(ctx, 0, 0, width, height, 8);
  ctx.fill();

  // Draw banner
  try {
    let bannerImage;
    if (customBanner) {
      bannerImage = await loadImage(customBanner);
    } else {
      // Try to get user banner, fallback to gradient
      const userBanner = user.bannerURL({ size: 1024, extension: "png" });
      if (userBanner) {
        bannerImage = await loadImage(userBanner);
      } else {
        // Draw gradient banner
        const gradient = ctx.createLinearGradient(0, 0, width, bannerHeight);
        gradient.addColorStop(0, "#5865F2");
        gradient.addColorStop(0.5, "#7289DA");
        gradient.addColorStop(1, "#5865F2");
        ctx.fillStyle = gradient;
        roundRect(ctx, 0, 0, width, bannerHeight, 8, true, false);
        ctx.fill();
      }
    }

    if (bannerImage) {
      ctx.save();
      roundRect(ctx, 0, 0, width, bannerHeight, 8, true, false);
      ctx.clip();
      ctx.drawImage(bannerImage, 0, 0, width, bannerHeight);
      ctx.restore();
    }
  } catch (error) {
    // Fallback gradient if banner loading fails
    const gradient = ctx.createLinearGradient(0, 0, width, bannerHeight);
    gradient.addColorStop(0, "#5865F2");
    gradient.addColorStop(0.5, "#7289DA");
    gradient.addColorStop(1, "#5865F2");
    ctx.fillStyle = gradient;
    roundRect(ctx, 0, 0, width, bannerHeight, 8, true, false);
    ctx.fill();
  }

  // Get user status (needs to be outside try block for later use)
  const status = member?.presence?.status || "offline";

  // Draw avatar with glow
  try {
    const avatar = await loadImage(user.displayAvatarURL({ size: 256, extension: "png" }));
    
    // Glow effect
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // Draw avatar circle with border
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 8;
    ctx.stroke();
    
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw status indicator
    const statusSize = 24;
    const statusX = avatarX + avatarSize - statusSize / 2;
    const statusY = avatarY + avatarSize - statusSize / 2;

    ctx.beginPath();
    ctx.arc(statusX, statusY, statusSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(statusX, statusY, (statusSize - 8) / 2, 0, Math.PI * 2);
    ctx.fillStyle = statusColors[status] || statusColors.offline;
    ctx.fill();
  } catch (error) {
    console.error("Error loading avatar:", error);
  }

  // Draw username and discriminator
  const usernameX = avatarX + avatarSize + 20;
  const usernameY = avatarY + avatarSize / 2;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillText(user.username, usernameX, usernameY);

  // Draw discriminator or display name
  const displayTag = user.discriminator !== "0" ? `#${user.discriminator}` : `@${user.username}`;
  ctx.fillStyle = "#b9bbbe";
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText(displayTag, usernameX, usernameY + 28);

  // Draw status text or custom activity
  let statusText = "Offline";
  if (member?.presence) {
    const activity = member.presence.activities[0];
    if (activity) {
      if (activity.type === 0) {
        statusText = `Playing ${activity.name}`;
      } else if (activity.type === 2) {
        statusText = `Listening to ${activity.name}`;
      } else if (activity.type === 3) {
        statusText = `Watching ${activity.name}`;
      } else if (activity.type === 4) {
        statusText = activity.state || activity.name;
      }
    } else {
      statusText = status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  ctx.fillStyle = "#43B581";
  ctx.font = "18px Arial, sans-serif";
  ctx.fillText(statusText, usernameX, usernameY + 56);

  // Draw bio/roles section
  const bioY = avatarY + avatarSize + 30;
  ctx.fillStyle = "#DCDDDE";
  ctx.font = "16px Arial, sans-serif";
  
  let bioText = customBio;
  if (!bioText && member) {
    const roles = member.roles.cache
      .filter((r) => r.id !== member.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => r.name)
      .slice(0, 3);
    
    if (roles.length > 0) {
      bioText = roles.join(" | ");
    }
  }

  if (bioText) {
    // Word wrap bio text
    const maxWidth = width - 80;
    const words = bioText.split(" ");
    let line = "";
    let lineY = bioY;
    const lineHeight = 24;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, 40, lineY);
        line = words[i] + " ";
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 40, lineY);
  }

  return canvas.toBuffer("image/png");
}

function roundRect(ctx, x, y, width, height, radius, topOnly = false, bottomOnly = false) {
  ctx.beginPath();
  
  if (topOnly) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  } else if (bottomOnly) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
  
  ctx.closePath();
}
