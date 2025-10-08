const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getUser, updateCache } = require("@schemas/User");
const {  getAllBanners, canAffordBanner, getBanner } = require("@helpers/BannerStore");
const EMOJIS = require("@helpers/EmojiConstants");

module.exports = {
  name: "editprofile",
  description: "Customize your profile card with bio and banner",
  category: "PROFILE",
  botPermissions: ["EmbedLinks"],
  cooldown: 5,
  command: {
    enabled: true,
    usage: "<bio|banner|view>",
    aliases: ["customize", "profileedit"],
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "bio",
        description: "Set your custom bio",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "text",
            description: "Your bio text (max 200 characters)",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "banner",
        description: "Choose a banner from the store",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "color",
        description: "Set your profile accent color",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "hex",
            description: "Hex color code (e.g., #5865F2)",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "theme",
        description: "Set your profile theme",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "style",
            description: "Choose a theme",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: "Dark", value: "dark" },
              { name: "Light", value: "light" },
            ],
          },
        ],
      },
      {
        name: "view",
        description: "View your current profile customization",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "reset",
        description: "Reset profile customization to default",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0]?.toLowerCase();
    const userDb = await getUser(message.author);

    if (sub === "bio") {
      return handleBioMessage(message, args.slice(1).join(" "), userDb);
    }

    if (sub === "banner") {
      return handleBannerMenu(message, userDb);
    }

    if (sub === "color" || sub === "colour") {
      return handleColorMessage(message, args[1], userDb);
    }

    if (sub === "theme") {
      return handleThemeMessage(message, args[1], userDb);
    }

    if (sub === "view") {
      return showProfileSettings(message, userDb);
    }

    if (sub === "reset") {
      return handleReset(message, userDb);
    }

    return message.safeReply("Usage: `!editprofile <bio|banner|color|theme|view|reset>`");
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const userDb = await getUser(interaction.user);

    if (sub === "bio") {
      const bioText = interaction.options.getString("text");
      return handleBioInteraction(interaction, bioText, userDb);
    }

    if (sub === "banner") {
      return handleBannerMenu(interaction, userDb);
    }

    if (sub === "color") {
      const hexColor = interaction.options.getString("hex");
      return handleColorInteraction(interaction, hexColor, userDb);
    }

    if (sub === "theme") {
      const themeStyle = interaction.options.getString("style");
      return handleThemeInteraction(interaction, themeStyle, userDb);
    }

    if (sub === "view") {
      return showProfileSettings(interaction, userDb);
    }

    if (sub === "reset") {
      return handleReset(interaction, userDb);
    }
  },
};

async function handleBioMessage(message, bioText, userDb) {
  if (!bioText || bioText.length === 0) {
    return message.safeReply("Please provide bio text. Example: `!editprofile bio Your bio here`");
  }

  if (bioText.length > 200) {
    return message.safeReply("Bio must be 200 characters or less!");
  }

  if (!userDb.profile) userDb.profile = {};
  userDb.profile.bio = bioText;
  await userDb.save();
  
  // Update cache after save
  updateCache(message.author.id, userDb);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(`${EMOJIS.SUCCESS} | Bio updated successfully!\n\n**New Bio:**\n${bioText}`)
    .setTimestamp();

  return message.safeReply({ embeds: [embed] });
}

async function handleBioInteraction(interaction, bioText, userDb) {
  if (bioText.length > 200) {
    return interaction.followUp({
      content: "Bio must be 200 characters or less!",
      ephemeral: true,
    });
  }

  if (!userDb.profile) userDb.profile = {};
  userDb.profile.bio = bioText;
  await userDb.save();
  
  // Update cache after save
  updateCache(interaction.user.id, userDb);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(`${EMOJIS.SUCCESS} | Bio updated successfully!\n\n**New Bio:**\n${bioText}`)
    .setTimestamp();

  return interaction.followUp({ embeds: [embed] });
}

async function handleBannerMenu(source, userDb) {
  const isInteraction = source.constructor.name === "ChatInputCommandInteraction";
  const coins = userDb.coins || 0;
  const allBanners = getAllBanners();

  const embed = new EmbedBuilder()
    .setTitle("🎨 Banner Store")
    .setDescription(
      `Choose a banner for your profile card!\n\n` +
      `**Your Balance:** ${coins} coins\n\n` +
      `Select a category below to browse banners:`
    )
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTimestamp();

  const categorySelect = new StringSelectMenuBuilder()
    .setCustomId("banner_category")
    .setPlaceholder("Select a banner category...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Gradient Banners")
        .setValue("gradient")
        .setDescription("Beautiful gradient banners")
        .setEmoji("🌈"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Pattern Banners")
        .setValue("pattern")
        .setDescription("Unique pattern designs")
        .setEmoji("✨"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Special Effects")
        .setValue("special")
        .setDescription("Premium special effects")
        .setEmoji("💎"),
      new StringSelectMenuOptionBuilder()
        .setLabel("All Banners")
        .setValue("all")
        .setDescription("View all available banners")
        .setEmoji("📋")
    );

  const row = new ActionRowBuilder().addComponents(categorySelect);

  const reply = isInteraction
    ? await source.followUp({ embeds: [embed], components: [row] })
    : await source.channel.send({ embeds: [embed], components: [row] });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 120000,
    filter: (i) => i.user.id === (isInteraction ? source.user.id : source.author.id),
  });

  collector.on("collect", async (i) => {
    const category = i.values[0];
    await showBannerList(i, userDb, category);
  });

  collector.on("end", async () => {
    const disabledRow = new ActionRowBuilder().addComponents(
      StringSelectMenuBuilder.from(categorySelect).setDisabled(true)
    );
    await reply.edit({ components: [disabledRow] }).catch(() => {});
  });
}

async function showBannerList(interaction, userDb, category) {
  const coins = userDb.coins || 0;
  const allBanners = getAllBanners();
  const currentBanner = userDb.profile?.banner || "gradient_blue";

  let filteredBanners = Object.entries(allBanners);
  if (category !== "all") {
    filteredBanners = filteredBanners.filter(([id, banner]) => banner.type === category);
  }

  const bannerOptions = filteredBanners.slice(0, 25).map(([id, banner]) => {
    const canAfford = coins >= banner.price;
    const owned = banner.price === 0 || userDb.profile?.ownedBanners?.includes(id);
    const isCurrent = id === currentBanner;
    
    let label = banner.name;
    if (isCurrent) label = `✅ ${label} (Current)`;
    else if (!canAfford && !owned) label = `🔒 ${label}`;

    return new StringSelectMenuOptionBuilder()
      .setLabel(label)
      .setValue(id)
      .setDescription(`${banner.description} - ${banner.price === 0 ? "Free" : banner.price + " coins"}`)
      .setEmoji(banner.type === "gradient" ? "🌈" : banner.type === "pattern" ? "✨" : "💎");
  });

  if (bannerOptions.length === 0) {
    return interaction.update({
      content: "No banners found in this category!",
      components: [],
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`${category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)} Banners`)
    .setDescription(`**Your Balance:** ${coins} coins\n\nSelect a banner to purchase or equip:`)
    .setColor(EMBED_COLORS.BOT_EMBED);

  const bannerSelect = new StringSelectMenuBuilder()
    .setCustomId("banner_select")
    .setPlaceholder("Choose a banner...")
    .addOptions(bannerOptions);

  const row = new ActionRowBuilder().addComponents(bannerSelect);

  await interaction.update({ embeds: [embed], components: [row] });

  const response = await interaction.message.awaitMessageComponent({
    componentType: ComponentType.StringSelect,
    time: 60000,
    filter: (i) => i.customId === "banner_select" && i.user.id === interaction.user.id,
  }).catch(() => null);

  if (response) {
    const bannerId = response.values[0];
    await handleBannerPurchase(response, userDb, bannerId);
  }
}

async function handleBannerPurchase(interaction, userDb, bannerId) {
  const banner = getBanner(bannerId);
  if (!banner || !bannerId) {
    return interaction.update({
      content: "Invalid banner selection!",
      components: [],
    });
  }

  const coins = userDb.coins || 0;
  
  // Initialize profile and owned banners if needed
  if (!userDb.profile) userDb.profile = {};
  if (!userDb.profile.ownedBanners) userDb.profile.ownedBanners = [];

  // Check if user already owns this banner
  const owned = banner.price === 0 || userDb.profile.ownedBanners.includes(bannerId);

  // If not owned, validate purchase
  if (!owned) {
    if (coins < banner.price) {
      return interaction.update({
        content: `${EMOJIS.ERROR} | You don't have enough coins!\n\n**Required:** ${banner.price} coins\n**Your Balance:** ${coins} coins\n**Need:** ${banner.price - coins} more coins`,
        components: [],
      });
    }

    // Deduct coins and track ownership
    userDb.coins -= banner.price;
    userDb.profile.ownedBanners.push(bannerId);
  }

  // Equip the banner
  userDb.profile.banner = bannerId;
  
  // Save to database
  await userDb.save();
  
  // Update cache to reflect changes immediately
  updateCache(interaction.user.id, userDb);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(
      owned
        ? `${EMOJIS.SUCCESS} | Banner "${banner.name}" equipped!`
        : `${EMOJIS.SUCCESS} | Banner "${banner.name}" purchased and equipped!\n\n**Cost:** ${banner.price} coins\n**Remaining Balance:** ${userDb.coins} coins`
    )
    .setTimestamp();

  return interaction.update({ embeds: [embed], components: [] });
}

async function showProfileSettings(source, userDb) {
  const isInteraction = source.constructor.name === "ChatInputCommandInteraction";
  const bio = userDb.profile?.bio || "*No bio set*";
  const bannerKey = userDb.profile?.banner || "gradient_blue";
  const banner = getBanner(bannerKey);
  const accentColor = userDb.profile?.accentColor || "#5865F2";
  const theme = userDb.profile?.theme || "dark";

  const embed = new EmbedBuilder()
    .setTitle("⚙️ Your Profile Settings")
    .setColor(accentColor)
    .addFields(
      { name: "Bio", value: bio },
      { name: "Current Banner", value: `${banner.name} (${banner.description})` },
      { name: "Accent Color", value: accentColor, inline: true },
      { name: "Theme", value: theme === "dark" ? "🌙 Dark" : "☀️ Light", inline: true },
      { name: "Coins", value: `${userDb.coins || 0} coins`, inline: true }
    )
    .setTimestamp();

  if (isInteraction) {
    return source.followUp({ embeds: [embed] });
  } else {
    return source.channel.send({ embeds: [embed] });
  }
}

async function handleColorMessage(message, hexColor, userDb) {
  if (!hexColor) {
    return message.safeReply("Please provide a hex color. Example: `!editprofile color #5865F2`");
  }

  if (!hexColor.startsWith("#")) {
    hexColor = "#" + hexColor;
  }

  if (!/^#[0-9A-F]{6}$/i.test(hexColor)) {
    return message.safeReply("Invalid hex color! Please use format: #RRGGBB (e.g., #5865F2)");
  }

  if (!userDb.profile) userDb.profile = {};
  userDb.profile.accentColor = hexColor;
  await userDb.save();
  updateCache(message.author.id, userDb);

  const embed = new EmbedBuilder()
    .setColor(hexColor)
    .setDescription(`${EMOJIS.SUCCESS} | Accent color updated successfully!\n\n**New Color:** ${hexColor}`)
    .setTimestamp();

  return message.safeReply({ embeds: [embed] });
}

async function handleColorInteraction(interaction, hexColor, userDb) {
  if (!hexColor.startsWith("#")) {
    hexColor = "#" + hexColor;
  }

  if (!/^#[0-9A-F]{6}$/i.test(hexColor)) {
    return interaction.followUp({
      content: "Invalid hex color! Please use format: #RRGGBB (e.g., #5865F2)",
      ephemeral: true,
    });
  }

  if (!userDb.profile) userDb.profile = {};
  userDb.profile.accentColor = hexColor;
  await userDb.save();
  updateCache(interaction.user.id, userDb);

  const embed = new EmbedBuilder()
    .setColor(hexColor)
    .setDescription(`${EMOJIS.SUCCESS} | Accent color updated successfully!\n\n**New Color:** ${hexColor}`)
    .setTimestamp();

  return interaction.followUp({ embeds: [embed] });
}

async function handleThemeMessage(message, themeStyle, userDb) {
  if (!themeStyle || !["dark", "light"].includes(themeStyle.toLowerCase())) {
    return message.safeReply("Please specify a valid theme: `dark` or `light`");
  }

  themeStyle = themeStyle.toLowerCase();
  
  if (!userDb.profile) userDb.profile = {};
  userDb.profile.theme = themeStyle;
  await userDb.save();
  updateCache(message.author.id, userDb);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(`${EMOJIS.SUCCESS} | Profile theme updated to **${themeStyle}** mode!`)
    .setTimestamp();

  return message.safeReply({ embeds: [embed] });
}

async function handleThemeInteraction(interaction, themeStyle, userDb) {
  if (!userDb.profile) userDb.profile = {};
  userDb.profile.theme = themeStyle;
  await userDb.save();
  updateCache(interaction.user.id, userDb);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(`${EMOJIS.SUCCESS} | Profile theme updated to **${themeStyle}** mode!`)
    .setTimestamp();

  return interaction.followUp({ embeds: [embed] });
}

async function handleReset(source, userDb) {
  const isInteraction = source.constructor.name === "ChatInputCommandInteraction";
  const userId = isInteraction ? source.user.id : source.author.id;

  if (!userDb.profile) userDb.profile = {};
  userDb.profile.bio = null;
  userDb.profile.banner = "gradient_blue";
  userDb.profile.accentColor = null;
  userDb.profile.theme = "dark";
  await userDb.save();
  
  // Update cache after reset
  updateCache(userId, userDb);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(`${EMOJIS.SUCCESS} | Profile customization reset to default!`)
    .setTimestamp();

  if (isInteraction) {
    return source.followUp({ embeds: [embed] });
  } else {
    return source.channel.send({ embeds: [embed] });
  }
}
