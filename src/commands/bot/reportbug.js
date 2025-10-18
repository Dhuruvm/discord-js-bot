const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { OWNER_IDS } = require("@root/config.js");
const emojis = require("@root/emojis.json");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "reportbug",
  description: "Report a bug to the bot developers",
  category: "BOT",
  command: {
    enabled: true,
    aliases: ["bug", "bugreport"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [],
  },

  async messageRun(message, args) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
    const ContainerBuilder = require("@helpers/ContainerBuilder");

    const bugReportText = ContainerBuilder.createTextDisplay(
      `# Report a Bug\n\n` +
      `Click the button below to open the bug report form.\n\n` +
      `**What to include in your report:**\n` +
      `• A clear title describing the bug\n` +
      `• Detailed description of what happened\n` +
      `• Steps to reproduce the issue\n` +
      `• What you expected to happen\n` +
      `• Any additional information (screenshots, error messages, etc.)`
    );

    const button = new ButtonBuilder()
      .setCustomId("bug:report")
      .setLabel("Open Bug Report Form")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🐛");

    const row = new ActionRowBuilder().addComponents(button);

    const response = new ContainerBuilder()
      .addContainer({
        accentColor: 0xFFFFFF,
        components: [bugReportText, row]
      })
      .build();

    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("bug:submit")
      .setTitle("Report a Bug");

    const bugTitleInput = new TextInputBuilder()
      .setCustomId("bug-title")
      .setLabel("Bug Title")
      .setPlaceholder("Brief description of the bug")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const bugDescriptionInput = new TextInputBuilder()
      .setCustomId("bug-description")
      .setLabel("Bug Description")
      .setPlaceholder("Detailed explanation of what happened")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    const stepsToReproduceInput = new TextInputBuilder()
      .setCustomId("bug-steps")
      .setLabel("Steps to Reproduce")
      .setPlaceholder("1. First I did...\n2. Then I...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    const expectedBehaviorInput = new TextInputBuilder()
      .setCustomId("bug-expected")
      .setLabel("Expected Behavior")
      .setPlaceholder("What should have happened?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(300);

    const additionalInfoInput = new TextInputBuilder()
      .setCustomId("bug-additional")
      .setLabel("Additional Information")
      .setPlaceholder("Screenshots, error messages, etc.")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    const row1 = new ActionRowBuilder().addComponents(bugTitleInput);
    const row2 = new ActionRowBuilder().addComponents(bugDescriptionInput);
    const row3 = new ActionRowBuilder().addComponents(stepsToReproduceInput);
    const row4 = new ActionRowBuilder().addComponents(expectedBehaviorInput);
    const row5 = new ActionRowBuilder().addComponents(additionalInfoInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    await interaction.showModal(modal);
  },
};
