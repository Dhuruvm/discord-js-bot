const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
  AttachmentBuilder,
} = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { getBuffer } = require("@helpers/HttpUtils");
const PinterestScraper = require("@helpers/PinterestScraper");
const emojis = require("@root/emojis.json");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "pfp",
  description: "Search Pinterest for profile pictures and banners",
  category: "PFP",
  botPermissions: ["SendMessages", "EmbedLinks", "AttachFiles"],
  cooldown: 5,
  command: {
    enabled: true,
    usage: "<query> [--gender male|female|neutral] [--type pfp|banner] [--format gif|image]",
    minArgsCount: 1,
    aliases: ["pinterest", "banner"],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "query",
        description: "Search query for images",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "gender",
        description: "Gender filter",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "Male", value: "male" },
          { name: "Female", value: "female" },
          { name: "Neutral", value: "neutral" },
        ],
      },
      {
        name: "type",
        description: "Image type",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "Profile Picture", value: "pfp" },
          { name: "Banner", value: "banner" },
        ],
      },
      {
        name: "format",
        description: "Image format",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "Image", value: "image" },
          { name: "GIF", value: "gif" },
        ],
      },
      {
        name: "style",
        description: "Additional style keywords (e.g., aesthetic, anime, dark)",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const params = parseArgs(args);
    await runPFPSearch(message, params, false);
  },

  async interactionRun(interaction) {
    await interaction.deferReply();
    
    const params = {
      query: interaction.options.getString("query"),
      gender: interaction.options.getString("gender") || "neutral",
      type: interaction.options.getString("type") || "pfp",
      format: interaction.options.getString("format") || "image",
      style: interaction.options.getString("style") || "",
    };
    
    await runPFPSearch(interaction, params, true);
  },
};

/**
 * Parse command arguments
 */
function parseArgs(args) {
  const params = {
    query: "",
    gender: "neutral",
    type: "pfp",
    format: "image",
    style: "",
  };

  let queryParts = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const flag = arg.substring(2);
      const value = args[i + 1];

      switch (flag) {
        case "gender":
          params.gender = value || "neutral";
          i++;
          break;
        case "type":
          params.type = value || "pfp";
          i++;
          break;
        case "format":
          params.format = value || "image";
          i++;
          break;
        case "style":
          params.style = value || "";
          i++;
          break;
      }
    } else {
      queryParts.push(arg);
    }
  }

  params.query = queryParts.join(" ");
  return params;
}

/**
 * Run Pinterest search
 */
async function runPFPSearch(source, params, isInteraction) {
  const loadingEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`${emojis.loading} Searching Pinterest...`);

  const loadingMsg = isInteraction
    ? await source.editReply({ embeds: [loadingEmbed] })
    : await source.channel.send({ embeds: [loadingEmbed] });

  try {
    // Search Pinterest using scraper
    const results = await PinterestScraper.searchAndStore(params.gender, params.type);

    if (!results || results.length === 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setDescription(`${emojis.error} No results found. Try again later or check different filters.`);
      
      return loadingMsg.edit({ embeds: [errorEmbed] });
    }

    // Initialize state
    const state = {
      currentIndex: 0,
      results: results,
      params: params,
      userId: isInteraction ? source.user.id : source.author.id,
    };

    await displayResult(loadingMsg, state);
    setupCollector(loadingMsg, state);
  } catch (error) {
    console.error("Pinterest search error:", error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(`${emojis.error} Search failed: ${error.message}`);
    
    return loadingMsg.edit({ embeds: [errorEmbed] });
  }
}

/**
 * Display search result
 */
async function displayResult(message, state) {
  const result = state.results[state.currentIndex];
  const { params } = state;

  // Build embed
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle(result.title || "Pinterest Result")
    .setURL(result.link)
    .setDescription(
      result.isFallback
        ? `${emojis.warning} Pinterest API unavailable. Click the title to search manually.`
        : result.description || "No description available"
    )
    .addFields([
      {
        name: "Type",
        value: params.type === "pfp" ? "Profile Picture" : "Banner",
        inline: true,
      },
      {
        name: "Format",
        value: params.format === "gif" ? "GIF" : "Image",
        inline: true,
      },
      {
        name: "Gender",
        value: params.gender,
        inline: true,
      },
    ])
    .setFooter({ 
      text: `Result ${state.currentIndex + 1} / ${state.results.length}` 
    })
    .setTimestamp();

  if (result.image && !result.isFallback) {
    embed.setImage(result.image);
  }

  // Navigation buttons
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pfp_prev")
      .setLabel("Previous")
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(state.currentIndex === 0),
    new ButtonBuilder()
      .setCustomId("pfp_next")
      .setLabel("Next")
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(state.currentIndex >= state.results.length - 1)
  );

  // Filter buttons
  const filterRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pfp_gender")
      .setLabel(`Gender: ${params.gender}`)
      .setEmoji("👤")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("pfp_type")
      .setLabel(params.type === "pfp" ? "PFP" : "Banner")
      .setEmoji(params.type === "pfp" ? "🖼️" : "🎞️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("pfp_format")
      .setLabel(params.format === "gif" ? "GIF" : "Image")
      .setEmoji(params.format === "gif" ? "🎬" : "📷")
      .setStyle(ButtonStyle.Secondary)
  );

  // Action buttons
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pfp_download")
      .setLabel("Download")
      .setEmoji("💾")
      .setStyle(ButtonStyle.Success)
      .setDisabled(result.isFallback),
    new ButtonBuilder()
      .setLabel("View on Pinterest")
      .setStyle(ButtonStyle.Link)
      .setURL(result.link)
  );

  await message.edit({
    embeds: [embed],
    components: [navRow, filterRow, actionRow],
  });
}

/**
 * Setup interaction collector
 */
function setupCollector(message, state) {
  const collector = message.createMessageComponentCollector({
    time: 300000, // 5 minutes
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== state.userId) {
      return interaction.reply({
        content: `${emojis.error} This is not your search!`,
        ephemeral: true,
      });
    }

    try {
      switch (interaction.customId) {
        case "pfp_prev":
          state.currentIndex = Math.max(0, state.currentIndex - 1);
          await interaction.deferUpdate();
          await displayResult(message, state);
          break;

        case "pfp_next":
          state.currentIndex = Math.min(state.results.length - 1, state.currentIndex + 1);
          await interaction.deferUpdate();
          await displayResult(message, state);
          break;

        case "pfp_gender":
          const genders = ["neutral", "male", "female"];
          const currentIdx = genders.indexOf(state.params.gender);
          state.params.gender = genders[(currentIdx + 1) % genders.length];
          await interaction.deferUpdate();
          await refreshSearch(message, state);
          break;

        case "pfp_type":
          state.params.type = state.params.type === "pfp" ? "banner" : "pfp";
          await interaction.deferUpdate();
          await refreshSearch(message, state);
          break;

        case "pfp_format":
          state.params.format = state.params.format === "image" ? "gif" : "image";
          await interaction.deferUpdate();
          await refreshSearch(message, state);
          break;

        case "pfp_download":
          await handleDownload(interaction, state);
          break;
      }
    } catch (error) {
      console.error("Collector error:", error);
      await interaction.reply({
        content: `${emojis.error} An error occurred: ${error.message}`,
        ephemeral: true,
      });
    }
  });

  collector.on("end", () => {
    const components = message.components.map(row => {
      const newRow = new ActionRowBuilder();
      row.components.forEach(component => {
        if (component.data.style === ButtonStyle.Link) {
          newRow.addComponents(ButtonBuilder.from(component));
        } else {
          newRow.addComponents(ButtonBuilder.from(component).setDisabled(true));
        }
      });
      return newRow;
    });
    
    message.edit({ components }).catch(() => {});
  });
}

/**
 * Refresh search with new filters
 */
async function refreshSearch(message, state) {
  const loadingEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`${emojis.loading} Refreshing results...`);

  await message.edit({ embeds: [loadingEmbed], components: [] });

  try {
    const results = await PinterestScraper.searchAndStore(state.params.gender, state.params.type);

    if (!results || results.length === 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setDescription(`${emojis.error} No results with these filters.`);
      
      return message.edit({ embeds: [errorEmbed] });
    }

    state.results = results;
    state.currentIndex = 0;
    await displayResult(message, state);
  } catch (error) {
    console.error("Refresh error:", error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(`${emojis.error} Failed to refresh: ${error.message}`);
    
    await message.edit({ embeds: [errorEmbed] });
  }
}

/**
 * Handle image download
 */
async function handleDownload(interaction, state) {
  await interaction.deferReply({ ephemeral: true });

  const result = state.results[state.currentIndex];

  if (!result.image || result.isFallback) {
    return interaction.followUp({
      content: `${emojis.error} No image available to download.`,
      ephemeral: true,
    });
  }

  try {
    const response = await getBuffer(result.image);

    if (!response.success) {
      return interaction.followUp({
        content: `${emojis.error} Failed to download image.`,
        ephemeral: true,
      });
    }

    const filename = `${state.params.type}_${Date.now()}.${result.image.endsWith('.gif') ? 'gif' : 'png'}`;
    const attachment = new AttachmentBuilder(response.buffer, { name: filename });

    await interaction.followUp({
      content: `${emojis.success} Here's your ${state.params.type === "pfp" ? "profile picture" : "banner"}!`,
      files: [attachment],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Download error:", error);
    await interaction.followUp({
      content: `${emojis.error} Download failed: ${error.message}`,
      ephemeral: true,
    });
  }
}
