/**
 * Embed Component Handlers
 * Centralized handlers for embed-related interactions
 */

const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
} = require("discord.js");
const { isValidColor, isHex } = require("@helpers/Utils");

/**
 * Handle embed creation button click
 * @param {Object} context - Handler context
 */
async function handleEmbedAdd({ interaction, data }) {
  // Data contains channelId
  const channelId = data;
  
  await interaction.showModal(
    new ModalBuilder({
      customId: `embed:modal:${channelId}`,
      title: "Embed Generator",
      components: [
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("title")
            .setLabel("Embed Title")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("author")
            .setLabel("Embed Author")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("description")
            .setLabel("Embed Description")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("color")
            .setLabel("Embed Color (hex or name)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("#FF5733 or red")
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("footer")
            .setLabel("Embed Footer")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
      ],
    })
  );
}

/**
 * Handle embed modal submission
 * @param {Object} context - Handler context
 */
async function handleEmbedModal({ interaction, data, client }) {
  const channelId = data;
  const channel = interaction.guild.channels.cache.get(channelId);
  
  if (!channel) {
    return interaction.reply({
      content: "Channel not found. Please try again.",
      ephemeral: true,
    });
  }

  // Acknowledge immediately
  await interaction.deferReply({ ephemeral: true });

  const title = interaction.fields.getTextInputValue("title");
  const author = interaction.fields.getTextInputValue("author");
  const description = interaction.fields.getTextInputValue("description");
  const footer = interaction.fields.getTextInputValue("footer");
  const color = interaction.fields.getTextInputValue("color");

  // Validation
  if (!title && !author && !description && !footer) {
    return interaction.editReply("You can't send an empty embed!");
  }

  if (color && !isValidColor(color) && !isHex(color)) {
    return interaction.editReply("Invalid color! Please use a valid color name or hex code.");
  }

  // Build embed
  const embed = new EmbedBuilder();
  if (title) embed.setTitle(title);
  if (author) embed.setAuthor({ name: author });
  if (description) embed.setDescription(description);
  if (footer) embed.setFooter({ text: footer });
  if (color && (isValidColor(color) || isHex(color))) embed.setColor(color);

  // Create field management buttons
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`embed:field:add:${channelId}`)
      .setLabel("Add Field")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`embed:field:remove:${channelId}`)
      .setLabel("Remove Field")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`embed:done:${channelId}`)
      .setLabel("Done")
      .setStyle(ButtonStyle.Primary)
  );

  // Send to target channel
  const sentMsg = await channel.send({
    content: "Please add fields using the buttons below. Click done when finished.",
    embeds: [embed],
    components: [buttonRow],
  });

  await interaction.editReply(`Embed setup started in ${channel}. Message ID: ${sentMsg.id}`);

  // Store embed state in cache for field management
  client.embedCache = client.embedCache || new Map();
  client.embedCache.set(sentMsg.id, {
    embed,
    channelId,
    creatorId: interaction.user.id,
    messageId: sentMsg.id,
  });

  // Setup collector
  const collector = channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === interaction.user.id && i.message.id === sentMsg.id,
    idle: 5 * 60 * 1000, // 5 minutes
  });

  collector.on("end", async () => {
    await sentMsg.edit({ content: "", components: [] }).catch(() => {});
    client.embedCache.delete(sentMsg.id);
  });
}

/**
 * Handle adding a field to embed
 * @param {Object} context - Handler context
 */
async function handleFieldAdd({ interaction, data, client }) {
  const channelId = data;
  const embedData = client.embedCache.get(interaction.message.id);
  
  if (!embedData) {
    return interaction.reply({
      content: "Embed session expired. Please start over.",
      ephemeral: true,
    });
  }

  await interaction.showModal(
    new ModalBuilder({
      customId: `embed:field:modal:${interaction.message.id}`,
      title: "Add Field",
      components: [
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("name")
            .setLabel("Field Name")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(256)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("value")
            .setLabel("Field Value")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1024)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("inline")
            .setLabel("Inline? (true/false)")
            .setStyle(TextInputStyle.Short)
            .setValue("true")
            .setRequired(true)
        ),
      ],
    })
  );
}

/**
 * Handle field modal submission
 * @param {Object} context - Handler context
 */
async function handleFieldModal({ interaction, data, client }) {
  const messageId = data;
  const embedData = client.embedCache.get(messageId);
  
  if (!embedData) {
    return interaction.reply({
      content: "Embed session expired. Please start over.",
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const name = interaction.fields.getTextInputValue("name");
  const value = interaction.fields.getTextInputValue("value");
  let inline = interaction.fields.getTextInputValue("inline").toLowerCase();

  // Validate inline
  inline = inline === "true";

  // Add field
  const fields = embedData.embed.data.fields || [];
  
  // Limit to 25 fields (Discord limit)
  if (fields.length >= 25) {
    return interaction.editReply("Maximum of 25 fields reached!");
  }

  fields.push({ name, value, inline });
  embedData.embed.setFields(fields);

  // Update message
  const message = await interaction.channel.messages.fetch(messageId);
  await message.edit({ embeds: [embedData.embed] });

  await interaction.editReply("Field added successfully!");
}

/**
 * Handle removing last field
 * @param {Object} context - Handler context
 */
async function handleFieldRemove({ interaction, data, client }) {
  const embedData = client.embedCache.get(interaction.message.id);
  
  if (!embedData) {
    return interaction.reply({
      content: "Embed session expired. Please start over.",
      ephemeral: true,
    });
  }

  await interaction.deferUpdate();

  const fields = embedData.embed.data.fields;
  if (!fields || fields.length === 0) {
    return interaction.followUp({
      content: "There are no fields to remove",
      ephemeral: true,
    });
  }

  fields.pop();
  embedData.embed.setFields(fields);

  await interaction.editReply({ embeds: [embedData.embed] });
  
  await interaction.followUp({
    content: "Last field removed",
    ephemeral: true,
  });
}

/**
 * Handle finishing embed creation
 * @param {Object} context - Handler context
 */
async function handleEmbedDone({ interaction, data, client }) {
  const embedData = client.embedCache.get(interaction.message.id);
  
  if (!embedData) {
    return interaction.reply({
      content: "Embed session expired.",
      ephemeral: true,
    });
  }

  await interaction.deferUpdate();

  // Final message
  await interaction.editReply({
    content: "",
    embeds: [embedData.embed],
    components: [],
  });

  await interaction.followUp({
    content: "✅ Embed created successfully!",
    ephemeral: true,
  });

  // Cleanup
  client.embedCache.delete(interaction.message.id);
}

module.exports = {
  handleEmbedAdd,
  handleEmbedModal,
  handleFieldAdd,
  handleFieldModal,
  handleFieldRemove,
  handleEmbedDone,
};
