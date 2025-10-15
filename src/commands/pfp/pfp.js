const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
  AttachmentBuilder,
} = require("discord.js");
const PinterestService = require("@helpers/PinterestService");
const ImageProcessor = require("@helpers/ImageProcessor");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "pfp",
  description: "Search Pinterest for high-quality profile pictures and banners",
  category: "PFP",
  botPermissions: ["SendMessages", "EmbedLinks", "AttachFiles"],
  command: {
    enabled: true,
    usage: "<query> [--gender male|female|neutral] [--type pfp|banner] [--format gif|image] [--style <style>]",
    minArgsCount: 1,
    aliases: ["pinterest", "banner"],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "query",
        description: "Search query for images",
        type: 3,
        required: true,
      },
      {
        name: "gender",
        description: "Gender filter",
        type: 3,
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
        type: 3,
        required: false,
        choices: [
          { name: "Profile Picture", value: "pfp" },
          { name: "Banner", value: "banner" },
        ],
      },
      {
        name: "format",
        description: "Image format",
        type: 3,
        required: false,
        choices: [
          { name: "Image", value: "image" },
          { name: "GIF", value: "gif" },
        ],
      },
      {
        name: "style",
        description: "Additional style keywords",
        type: 3,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    // Parse command arguments
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
 * @param {string[]} args
 * @returns {Object} Parsed parameters
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
 * Run Pinterest search and display results
 * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} source
 * @param {Object} params
 * @param {boolean} isInteraction
 */
async function runPFPSearch(source, params, isInteraction) {
  // Send loading message
  const loadingMsg = isInteraction
    ? await source.editReply({ content: "🔍 Searching Pinterest..." })
    : await source.channel.send({ content: "🔍 Searching Pinterest..." });

  try {
    // Search Pinterest
    const results = await PinterestService.searchPins(params);

    if (!results || results.length === 0) {
      return loadingMsg.edit(
        ContainerBuilder.error(
          "No Results Found",
          `No images found for "${params.query}". Try different keywords or check your filters.`,
          0xFF0000
        )
      );
    }

    // Initialize carousel state
    const state = {
      currentIndex: 0,
      results: results,
      params: params,
      userId: isInteraction ? source.user.id : source.author.id,
    };

    // Display first result and setup collector once
    await displayResult(loadingMsg, state);
    setupCollector(loadingMsg, state);
  } catch (error) {
    console.error("Error in runPFPSearch:", error);
    return loadingMsg.edit(
      ContainerBuilder.error(
        "Search Failed",
        `An error occurred while searching: ${error.message}`,
        0xFF0000
      )
    );
  }
}

/**
 * Display a result with interactive controls
 * @param {import('discord.js').Message} message
 * @param {Object} state
 */
async function displayResult(message, state) {
  const result = state.results[state.currentIndex];
  const { params } = state;

  // Build container (must have 1-5 components)
  const components = [];

  // Image preview (using MediaGallery)
  if (result.image && !result.isFallback) {
    components.push(ContainerBuilder.createMediaGallery([{
      media: { url: result.image }
    }]));
  }

  // Title
  components.push(
    ContainerBuilder.createTextDisplay(
      `## 🎨 ${result.title || "Pinterest Result"}`
    )
  );

  // Description
  const description = result.isFallback
    ? "⚠️ Pinterest API unavailable. Click the link to search manually."
    : result.description || "No description available";

  components.push(ContainerBuilder.createTextDisplay(description));

  // Separator
  components.push(ContainerBuilder.createSeparator());

  // Info (combine all info into one text display to stay under 5 components)
  components.push(
    ContainerBuilder.createTextDisplay(
      `**Type:** ${params.type === "pfp" ? "Profile Picture" : "Banner"} • **Format:** ${params.format === "gif" ? "GIF" : "Image"} • **Gender:** ${params.gender}\n**Result:** ${state.currentIndex + 1} / ${state.results.length}`
    )
  );

  // Navigation buttons
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pfp_prev")
      .setLabel("Previous")
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(state.currentIndex === 0),
    new ButtonBuilder()
      .setCustomId("pfp_next")
      .setLabel("Next")
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(state.currentIndex >= state.results.length - 1)
  );

  // Filter toggles
  const filterRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pfp_gender")
      .setLabel(`Gender: ${params.gender}`)
      .setEmoji("👤")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("pfp_type")
      .setLabel(`${params.type === "pfp" ? "PFP" : "Banner"}`)
      .setEmoji(params.type === "pfp" ? "🖼️" : "🎞️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("pfp_format")
      .setLabel(`${params.format === "gif" ? "GIF" : "Image"}`)
      .setEmoji(params.format === "gif" ? "🎬" : "📷")
      .setStyle(ButtonStyle.Primary)
  );

  // Action buttons
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pfp_query")
      .setLabel("Custom Query")
      .setEmoji("🔍")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("pfp_save")
      .setLabel("Download")
      .setEmoji("💾")
      .setStyle(ButtonStyle.Success)
      .setDisabled(result.isFallback),
    new ButtonBuilder()
      .setLabel("View on Pinterest")
      .setStyle(ButtonStyle.Link)
      .setURL(result.link)
  );

  // Build and send
  const container = new ContainerBuilder()
    .addContainer({ accentColor: 0xE60023, components })
    .build();

  // Add action rows as separate components
  container.components.push(navRow, filterRow, actionRow);

  await message.edit(container);
}

/**
 * Setup interaction collector (called once)
 * @param {import('discord.js').Message} message
 * @param {Object} state
 */
function setupCollector(message, state) {
  const collector = message.createMessageComponentCollector({
    time: 300000, // 5 minutes
  });

  collector.on("collect", async (interaction) => {
    // Check if user is authorized
    if (interaction.user.id !== state.userId) {
      return interaction.reply({
        content: "❌ This is not your search! Use the command yourself.",
        ephemeral: true,
      });
    }

    const customId = interaction.customId;

    try {
      switch (customId) {
        case "pfp_prev":
          state.currentIndex = Math.max(0, state.currentIndex - 1);
          await interaction.deferUpdate();
          await displayResult(message, state);
          break;

        case "pfp_next":
          state.currentIndex = Math.min(
            state.results.length - 1,
            state.currentIndex + 1
          );
          await interaction.deferUpdate();
          await displayResult(message, state);
          break;

        case "pfp_gender":
          // Cycle through genders
          const genders = ["neutral", "male", "female"];
          const currentGenderIndex = genders.indexOf(state.params.gender);
          state.params.gender = genders[(currentGenderIndex + 1) % genders.length];
          await interaction.deferUpdate();
          await refreshSearch(message, state);
          break;

        case "pfp_type":
          // Toggle type
          state.params.type = state.params.type === "pfp" ? "banner" : "pfp";
          await interaction.deferUpdate();
          await refreshSearch(message, state);
          break;

        case "pfp_format":
          // Toggle format
          state.params.format = state.params.format === "image" ? "gif" : "image";
          await interaction.deferUpdate();
          await refreshSearch(message, state);
          break;

        case "pfp_query":
          // Show modal for custom query
          await showQueryModal(interaction, message, state);
          break;

        case "pfp_save":
          await handleSave(interaction, state);
          break;
      }
    } catch (error) {
      console.error("Collector error:", error);
      await interaction.reply({
        content: `❌ An error occurred: ${error.message}`,
        ephemeral: true,
      });
    }
  });

  collector.on("end", async () => {
    try {
      const disabledRows = [
        new ActionRowBuilder().addComponents(
          message.components[0].components.map((btn) =>
            ButtonBuilder.from(btn).setDisabled(true)
          )
        ),
        new ActionRowBuilder().addComponents(
          message.components[1].components.map((btn) =>
            ButtonBuilder.from(btn).setDisabled(true)
          )
        ),
        new ActionRowBuilder().addComponents(
          message.components[2].components.map((btn) => {
            const button = ButtonBuilder.from(btn);
            if (btn.style !== ButtonStyle.Link) {
              button.setDisabled(true);
            }
            return button;
          })
        ),
      ];
      await message.edit({ components: disabledRows });
    } catch (error) {
      // Message might be deleted
    }
  });
}

/**
 * Refresh search with new parameters
 * @param {import('discord.js').Message} message
 * @param {Object} state
 */
async function refreshSearch(message, state) {
  const results = await PinterestService.searchPins(state.params);

  if (!results || results.length === 0) {
    await message.edit(
      ContainerBuilder.error(
        "No Results",
        "No images found with these filters. Try different options.",
        0xFF0000
      )
    );
    return;
  }

  state.results = results;
  state.currentIndex = 0;
  await displayResult(message, state);
}

/**
 * Show custom query modal
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {import('discord.js').Message} message
 * @param {Object} state
 */
async function showQueryModal(interaction, message, state) {
  const modal = new ModalBuilder()
    .setCustomId("pfp_query_modal")
    .setTitle("Custom Search Query");

  const queryInput = new TextInputBuilder()
    .setCustomId("query_input")
    .setLabel("Enter your search query")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g., aesthetic anime, nature landscape...")
    .setValue(state.params.query)
    .setRequired(true);

  const row = new ActionRowBuilder().addComponents(queryInput);
  modal.addComponents(row);

  await interaction.showModal(modal);

  try {
    const submitted = await interaction.awaitModalSubmit({
      time: 60000,
      filter: (i) =>
        i.customId === "pfp_query_modal" && i.user.id === state.userId,
    });

    state.params.query = submitted.fields.getTextInputValue("query_input");
    await submitted.deferUpdate();
    await refreshSearch(message, state);
  } catch (error) {
    // Modal timed out
  }
}

/**
 * Handle save/download
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {Object} state
 */
async function handleSave(interaction, state) {
  await interaction.deferReply({ ephemeral: true });

  const result = state.results[state.currentIndex];

  if (!result.image) {
    return interaction.followUp({
      content: "❌ No image available to download.",
      ephemeral: true,
    });
  }

  try {
    // Process image based on type
    let buffer;
    if (state.params.type === "pfp") {
      buffer = await ImageProcessor.processForPFP(result.image);
    } else {
      buffer = await ImageProcessor.processForBanner(result.image);
    }

    if (!buffer) {
      return interaction.followUp({
        content: "❌ Failed to process image. Please try another one.",
        ephemeral: true,
      });
    }

    const filename = `${state.params.type}_${Date.now()}.png`;
    const attachment = new AttachmentBuilder(buffer, { name: filename });

    await interaction.followUp({
      content: `✅ Here's your ${state.params.type === "pfp" ? "profile picture" : "banner"}!`,
      files: [attachment],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Save error:", error);
    await interaction.followUp({
      content: `❌ Failed to download: ${error.message}`,
      ephemeral: true,
    });
  }
}
