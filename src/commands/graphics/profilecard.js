const { AttachmentBuilder, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { EMBED_COLORS } = require("@root/config");
const EMOJIS = require("@helpers/EmojiConstants");
const { getUser } = require("@schemas/User");
const { getBanner } = require("@helpers/BannerStore");

module.exports = {
  name: "profile",
  description: "Generate a sleek Discord profile card",
  category: "GRAPHICS",
  botPermissions: ["AttachFiles"],
  cooldown: 3,
  command: {
    enabled: true,
    aliases: ["pf", "card"],
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
    ],
  },

  async messageRun(message, args) {
    try {
      await message.channel.sendTyping();
      
      const user = message.mentions.users.first() || message.author;
      const member = await message.guild.members.fetch(user.id).catch(() => null);
      const userDb = await getUser(user);
      
      const buffer = await generateProfileCard(user, member, userDb);
      const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });
      
      await message.safeReply({ files: [attachment] });
    } catch (error) {
      console.error("Error generating profile card:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setDescription(`${EMOJIS.ERROR} | Failed to generate profile card.`)
        .setTimestamp();
      await message.safeReply({ embeds: [errorEmbed] });
    }
  },

  async interactionRun(interaction) {
    await interaction.deferReply();
    
    try {
      const user = interaction.options.getUser("user") || interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const userDb = await getUser(user);
      
      const buffer = await generateProfileCard(user, member, userDb);
      const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });
      
      await interaction.followUp({ files: [attachment] });
    } catch (error) {
      console.error("Error generating profile card:", error);
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setDescription(`${EMOJIS.ERROR} | Failed to generate profile card.`)
        .setTimestamp();
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};

async function generateProfileCard(user, member, userDb) {
  const width = 600;
  const height = 900;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background color (Discord dark theme)
  ctx.fillStyle = "#2B2D31";
  ctx.fillRect(0, 0, width, height);

  // Draw rounded rectangle background
  const cornerRadius = 20;
  ctx.fillStyle = "#1E1F22";
  roundRect(ctx, 15, 15, width - 30, height - 30, cornerRadius);
  ctx.fill();

  // Get user's custom banner
  const bannerKey = userDb?.profile?.banner || "gradient_blue";
  const bannerConfig = getBanner(bannerKey);
  const bannerHeight = 280;

  // Draw custom banner
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, 15, 15, width - 30, bannerHeight, cornerRadius, true, false);
  ctx.clip();

  if (bannerConfig.type === "gradient") {
    drawGradientBanner(ctx, 15, 15, width - 30, bannerHeight, bannerConfig.colors);
  } else if (bannerConfig.type === "pattern") {
    drawPatternBanner(ctx, 15, 15, width - 30, bannerHeight, bannerConfig);
  } else if (bannerConfig.type === "special") {
    drawSpecialBanner(ctx, 15, 15, width - 30, bannerHeight, bannerConfig);
  }

  ctx.restore();

  // Avatar settings
  const avatarSize = 180;
  const avatarX = width / 2;
  const avatarY = bannerHeight - 30;

  // Draw glowing ring around avatar
  const glowRingSize = avatarSize + 20;
  
  // Outer glow
  ctx.save();
  ctx.shadowColor = "#06B6D4";
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, glowRingSize / 2, 0, Math.PI * 2);
  ctx.strokeStyle = "#06B6D4";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();

  // Inner ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, glowRingSize / 2, 0, Math.PI * 2);
  ctx.strokeStyle = "#06B6D4";
  ctx.lineWidth = 6;
  ctx.stroke();

  // Draw avatar
  try {
    const avatar = await loadImage(user.displayAvatarURL({ size: 256, extension: "png" }));
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();
  } catch (error) {
    console.error("Error loading avatar:", error);
  }

  // Get status
  const status = member?.presence?.status || "offline";
  const statusColors = {
    online: "#23A559",
    idle: "#F0B232",
    dnd: "#F23F43",
    offline: "#80848E",
  };

  // Username with status dot
  const usernameY = avatarY + avatarSize / 2 + 80;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 52px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(user.username, avatarX, usernameY);

  // Status dot next to username
  const statusDotX = avatarX + ctx.measureText(user.username).width / 2 + 25;
  const statusDotY = usernameY - 32;
  ctx.beginPath();
  ctx.arc(statusDotX, statusDotY, 12, 0, Math.PI * 2);
  ctx.fillStyle = statusColors[status] || statusColors.offline;
  ctx.fill();

  // Discriminator or tag
  const displayTag = user.discriminator !== "0" ? `${user.username}#${user.discriminator}` : `${user.username}#1234`;
  ctx.fillStyle = "#B5BAC1";
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText(displayTag, avatarX, usernameY + 45);

  // Activity/Status
  let activityText = null;
  let activityEmoji = null;
  
  if (member?.presence?.activities && member.presence.activities.length > 0) {
    const activity = member.presence.activities[0];
    
    if (activity.type === 0) { // Playing
      activityEmoji = "🎮";
      activityText = `Playing ${activity.name}`;
    } else if (activity.type === 2) { // Listening
      activityEmoji = "🎵";
      activityText = `Listening to ${activity.name}`;
    } else if (activity.type === 3) { // Watching
      activityEmoji = "📺";
      activityText = `Watching ${activity.name}`;
    } else if (activity.type === 4) { // Custom
      activityEmoji = activity.emoji?.name || "💭";
      activityText = activity.state || activity.name;
    } else if (activity.type === 5) { // Competing
      activityEmoji = "🏆";
      activityText = `Competing in ${activity.name}`;
    }
  }

  if (activityText) {
    const activityY = usernameY + 110;
    
    // Draw emoji and activity
    ctx.font = "32px Arial, sans-serif";
    ctx.fillText(activityEmoji, avatarX - 150, activityY);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "26px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(activityText, avatarX - 100, activityY);
    ctx.textAlign = "center";
  }

  // Bio section - use custom bio or fallback to roles
  let bioText = userDb?.profile?.bio;
  
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

  if (!bioText) {
    bioText = "Discord User";
  }

  // Draw bio text
  const bioY = activityText ? usernameY + 200 : usernameY + 130;
  ctx.fillStyle = "#B5BAC1";
  ctx.font = "24px Arial, sans-serif";
  
  // Word wrap bio text
  const maxWidth = width - 100;
  const words = bioText.split(" ");
  let line = "";
  let lineY = bioY;
  const lineHeight = 35;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), avatarX, lineY);
      line = words[i] + " ";
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), avatarX, lineY);

  return canvas.toBuffer("image/png");
}

function roundRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawGradientBanner(ctx, x, y, width, height, colors) {
  const gradient = ctx.createRadialGradient(
    x + width / 2,
    y + height / 2,
    0,
    x + width / 2,
    y + height / 2,
    width / 2
  );

  if (colors.length === 3) {
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
  } else if (colors.length === 4) {
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.33, colors[1]);
    gradient.addColorStop(0.66, colors[2]);
    gradient.addColorStop(1, colors[3]);
  } else {
    for (let i = 0; i < colors.length; i++) {
      gradient.addColorStop(i / (colors.length - 1), colors[i]);
    }
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  const waveGradient = ctx.createRadialGradient(
    x + width / 2,
    y + height / 3,
    50,
    x + width / 2,
    y + height / 3,
    250
  );
  waveGradient.addColorStop(0, `${colors[0]}AA`);
  waveGradient.addColorStop(0.5, `${colors[1] || colors[0]}55`);
  waveGradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = waveGradient;
  ctx.fillRect(x, y, width, height);
}

function drawPatternBanner(ctx, x, y, width, height, config) {
  const baseGradient = ctx.createLinearGradient(x, y, x, y + height);
  baseGradient.addColorStop(0, config.baseColors[0]);
  baseGradient.addColorStop(1, config.baseColors[1]);
  ctx.fillStyle = baseGradient;
  ctx.fillRect(x, y, width, height);

  ctx.globalAlpha = 0.3;

  if (config.name.includes("Stars")) {
    for (let i = 0; i < 50; i++) {
      const starX = x + Math.random() * width;
      const starY = y + Math.random() * height;
      const starSize = Math.random() * 3 + 1;

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (config.name.includes("Waves")) {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    
    for (let wave = 0; wave < 5; wave++) {
      ctx.beginPath();
      for (let i = 0; i <= width; i += 10) {
        const waveY = y + height / 2 + Math.sin((i + wave * 50) / 30) * 30 + wave * 20;
        if (i === 0) {
          ctx.moveTo(x + i, waveY);
        } else {
          ctx.lineTo(x + i, waveY);
        }
      }
      ctx.stroke();
    }
  } else if (config.name.includes("Hexagons")) {
    const hexSize = 30;
    for (let row = 0; row < height / hexSize + 2; row++) {
      for (let col = 0; col < width / hexSize + 2; col++) {
        const hexX = x + col * hexSize * 1.5;
        const hexY = y + row * hexSize * Math.sqrt(3) + (col % 2) * hexSize * Math.sqrt(3) / 2;
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        drawHexagon(ctx, hexX, hexY, hexSize / 2);
      }
    }
  }

  ctx.globalAlpha = 1;
}

function drawSpecialBanner(ctx, x, y, width, height, config) {
  if (config.name.includes("Holographic")) {
    for (let i = 0; i < 4; i++) {
      const gradient = ctx.createLinearGradient(
        x + (i * width) / 4,
        y,
        x + ((i + 1) * width) / 4,
        y + height
      );
      gradient.addColorStop(0, config.colors[i % config.colors.length]);
      gradient.addColorStop(1, config.colors[(i + 1) % config.colors.length]);
      ctx.fillStyle = gradient;
      ctx.fillRect(x + (i * width) / 4, y, width / 4, height);
    }
  } else if (config.name.includes("Neon")) {
    const gradient = ctx.createRadialGradient(
      x + width / 2,
      y + height / 2,
      0,
      x + width / 2,
      y + height / 2,
      width / 2
    );
    gradient.addColorStop(0, config.colors[0]);
    gradient.addColorStop(0.5, config.colors[1]);
    gradient.addColorStop(1, config.colors[2] || config.colors[0]);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    ctx.shadowColor = config.colors[0];
    ctx.shadowBlur = 50;
    ctx.fillRect(x, y, width, height);
    ctx.shadowBlur = 0;
  }
}

function drawHexagon(ctx, x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const hx = x + radius * Math.cos(angle);
    const hy = y + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(hx, hy);
    } else {
      ctx.lineTo(hx, hy);
    }
  }
  ctx.closePath();
  ctx.stroke();
}
