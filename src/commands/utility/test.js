const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
} = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "test",
  description: "Test embed and component interactions",
  category: "UTILITY",
  botPermissions: ["SendMessages", "EmbedLinks"],
  command: {
    enabled: true,
    usage: "[type]",
    aliases: ["demo", "testbed"],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "type",
        description: "Type of test to run",
        type: 3,
        required: false,
        choices: [
          { name: "Embed", value: "embed" },
          { name: "Buttons", value: "buttons" },
          { name: "Select Menu", value: "select" },
          { name: "Modal", value: "modal" },
          { name: "All", value: "all" },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const type = args[0]?.toLowerCase() || "all";
    await runTest(message, type);
  },

  async interactionRun(interaction) {
    const type = interaction.options.getString("type") || "all";
    await runTest(interaction, type);
  },
};

/**
 * Run the test based on type
 * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} source
 * @param {string} type
 */
async function runTest(source, type) {
  const isInteraction = source.constructor.name === "ChatInputCommandInteraction";
  
  switch (type) {
    case "embed":
      await testEmbed(source, isInteraction);
      break;
    case "buttons":
      await testButtons(source, isInteraction);
      break;
    case "select":
      await testSelectMenu(source, isInteraction);
      break;
    case "modal":
      await testModal(source, isInteraction);
      break;
    case "all":
    default:
      await testAll(source, isInteraction);
      break;
  }
}

/**
 * Test embed functionality
 */
async function testEmbed(source, isInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("✨ Embed Test")
    .setDescription("This is a test embed showcasing various features")
    .setColor("#5865F2")
    .setAuthor({
      name: isInteraction ? source.user.tag : source.author.tag,
      iconURL: isInteraction ? source.user.displayAvatarURL() : source.author.displayAvatarURL(),
    })
    .addFields(
      { name: "Field 1", value: "Inline field", inline: true },
      { name: "Field 2", value: "Another inline", inline: true },
      { name: "Field 3", value: "Third inline", inline: true },
      { name: "Full Width Field", value: "This field takes the full width" }
    )
    .setFooter({ text: "Test Footer • Powered by BlaZe HQ" })
    .setTimestamp();

  if (isInteraction) {
    await source.followUp({ embeds: [embed] });
  } else {
    await source.channel.send({ embeds: [embed] });
  }
}

/**
 * Test button interactions
 */
async function testButtons(source, isInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("🔘 Button Test")
    .setDescription("Click the buttons below to test interactions")
    .setColor("#57F287");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("test_primary")
      .setLabel("Primary")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("test_success")
      .setLabel("Success")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("test_danger")
      .setLabel("Danger")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setLabel("Link")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.js.org")
  );

  const reply = isInteraction
    ? await source.followUp({ embeds: [embed], components: [row] })
    : await source.channel.send({ embeds: [embed], components: [row] });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });

  collector.on("collect", async (i) => {
    const labels = {
      test_primary: "Primary Button",
      test_success: "Success Button",
      test_danger: "Danger Button",
    };

    await i.reply({
      content: `<:success:1424072640829722745> You clicked the **${labels[i.customId]}**!`,
      ephemeral: true,
    });
  });

  collector.on("end", async () => {
    const disabledRow = new ActionRowBuilder().addComponents(
      row.components.map((button) =>
        ButtonBuilder.from(button).setDisabled(true)
      )
    );
    await reply.edit({ components: [disabledRow] });
  });
}

/**
 * Test select menu
 */
async function testSelectMenu(source, isInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("📋 Select Menu Test")
    .setDescription("Choose an option from the menu below")
    .setColor("#FEE75C");

  const select = new StringSelectMenuBuilder()
    .setCustomId("test_select")
    .setPlaceholder("Choose an option...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Option 1")
        .setDescription("First option")
        .setValue("option1")
        .setEmoji("1️⃣"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Option 2")
        .setDescription("Second option")
        .setValue("option2")
        .setEmoji("2️⃣"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Option 3")
        .setDescription("Third option")
        .setValue("option3")
        .setEmoji("3️⃣")
    );

  const row = new ActionRowBuilder().addComponents(select);

  const reply = isInteraction
    ? await source.followUp({ embeds: [embed], components: [row] })
    : await source.channel.send({ embeds: [embed], components: [row] });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000,
  });

  collector.on("collect", async (i) => {
    const value = i.values[0];
    const labels = {
      option1: "First",
      option2: "Second",
      option3: "Third",
    };

    await i.reply({
      content: `<:success:1424072640829722745> You selected the **${labels[value]}** option!`,
      ephemeral: true,
    });
  });

  collector.on("end", async () => {
    const disabledSelect = StringSelectMenuBuilder.from(select).setDisabled(true);
    const disabledRow = new ActionRowBuilder().addComponents(disabledSelect);
    await reply.edit({ components: [disabledRow] });
  });
}

/**
 * Test modal
 */
async function testModal(source, isInteraction) {
  if (!isInteraction) {
    return source.channel.send({
      content: "<:error:1424072711671382076> Modal tests can only be run with slash commands. Use `/test modal`",
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("📝 Modal Test")
    .setDescription("Click the button to open a modal form")
    .setColor("#EB459E");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("test_modal_open")
      .setLabel("Open Modal")
      .setStyle(ButtonStyle.Primary)
  );

  const reply = await source.followUp({ embeds: [embed], components: [row] });

  const buttonCollector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });

  buttonCollector.on("collect", async (i) => {
    const modal = new ModalBuilder()
      .setCustomId("test_modal")
      .setTitle("Test Modal Form");

    const nameInput = new TextInputBuilder()
      .setCustomId("name_input")
      .setLabel("What's your name?")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Enter your name...")
      .setRequired(true);

    const feedbackInput = new TextInputBuilder()
      .setCustomId("feedback_input")
      .setLabel("Your feedback")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Tell us what you think...")
      .setRequired(false);

    const row1 = new ActionRowBuilder().addComponents(nameInput);
    const row2 = new ActionRowBuilder().addComponents(feedbackInput);

    modal.addComponents(row1, row2);

    await i.showModal(modal);

    try {
      const submitted = await i.awaitModalSubmit({
        time: 60000,
        filter: (mi) => mi.customId === "test_modal" && mi.user.id === i.user.id,
      });

      const name = submitted.fields.getTextInputValue("name_input");
      const feedback = submitted.fields.getTextInputValue("feedback_input");

      const resultEmbed = new EmbedBuilder()
        .setTitle("<:success:1424072640829722745> Modal Submitted")
        .setDescription("Here's what you entered:")
        .addFields(
          { name: "Name", value: name },
          { name: "Feedback", value: feedback || "*No feedback provided*" }
        )
        .setColor("#57F287")
        .setTimestamp();

      await submitted.reply({ embeds: [resultEmbed], ephemeral: true });
    } catch (error) {
      // Modal timed out
    }
  });
}

/**
 * Test all features
 */
async function testAll(source, isInteraction) {
  const mainEmbed = new EmbedBuilder()
    .setTitle("🧪 Complete Test Suite")
    .setDescription(
      "This test demonstrates all modern Discord.js components:\n\n" +
      "• **EmbedBuilder** - Rich embed messages\n" +
      "• **ActionRowBuilder** - Component containers\n" +
      "• **ButtonBuilder** - Interactive buttons\n" +
      "• **StringSelectMenuBuilder** - Dropdown menus\n" +
      "• **ModalBuilder** - Form popups (slash command only)\n\n" +
      "Choose a test from the menu below:"
    )
    .setColor("#5865F2")
    .setFooter({ text: "All components use the latest Discord.js v14 API" })
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("test_all_select")
    .setPlaceholder("Select a test to run...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Embed Test")
        .setDescription("Test rich embed features")
        .setValue("embed")
        .setEmoji("✨"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Button Test")
        .setDescription("Test button interactions")
        .setValue("buttons")
        .setEmoji("🔘"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Select Menu Test")
        .setDescription("Test dropdown menus")
        .setValue("select")
        .setEmoji("📋"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Modal Test")
        .setDescription("Test modal forms (slash only)")
        .setValue("modal")
        .setEmoji("📝")
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const reply = isInteraction
    ? await source.followUp({ embeds: [mainEmbed], components: [row] })
    : await source.channel.send({ embeds: [mainEmbed], components: [row] });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 120000,
  });

  collector.on("collect", async (i) => {
    const selected = i.values[0];
    
    await i.deferUpdate();
    
    switch (selected) {
      case "embed":
        await testEmbed(i, true);
        break;
      case "buttons":
        await testButtons(i, true);
        break;
      case "select":
        await testSelectMenu(i, true);
        break;
      case "modal":
        await testModal(i, true);
        break;
    }
  });

  collector.on("end", async () => {
    const disabledSelect = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
    const disabledRow = new ActionRowBuilder().addComponents(disabledSelect);
    await reply.edit({ components: [disabledRow] }).catch(() => {});
  });
}
