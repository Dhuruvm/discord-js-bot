const { OWNER_IDS } = require("@root/config.js");
const emojis = require("@root/emojis.json");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const { OWNER_IDS } = require("@root/config.js");
const emojis = require("@root/emojis.json");

/**
 * Handle bug report modal submissions
 */
module.exports = async ({ interaction, client }) => {
  await interaction.deferReply({ ephemeral: true });

  const title = interaction.fields.getTextInputValue("bug-title");
  const description = interaction.fields.getTextInputValue("bug-description");
  const steps = interaction.fields.getTextInputValue("bug-steps");
  const expected = interaction.fields.getTextInputValue("bug-expected") || "Not specified";
  const additional = interaction.fields.getTextInputValue("bug-additional") || "None";

  const user = interaction.user;
  const guild = interaction.guild;

  // Build bug report for owner
  const ownerReportText = `${emojis.error} **New Bug Report**\n\n` +
    `**Reporter Information**\n` +
    `${emojis.user} User: ${user.tag} (${user.id})\n` +
    `${emojis.server} Server: ${guild?.name || 'DM'} (${guild?.id || 'N/A'})\n` +
    `${emojis.clock} Time: <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
    `**Bug Title**\n${title}\n\n` +
    `**Description**\n${description}\n\n` +
    `**Steps to Reproduce**\n${steps}\n\n` +
    `**Expected Behavior**\n${expected}\n\n` +
    `**Additional Information**\n${additional}`;

  const ownerReport = ContainerBuilder.quickMessage(
    null,
    ownerReportText,
    [],
    0xFF0000
  );

  // Send to each owner
  let sentCount = 0;
  for (const ownerId of OWNER_IDS) {
    try {
      const owner = await client.users.fetch(ownerId);
      await owner.send(ownerReport);
      sentCount++;
    } catch (error) {
      client.logger.error(`Failed to send bug report to owner ${ownerId}`, error);
    }
  }

  if (sentCount === 0) {
    return interaction.editReply({
      content: `${emojis.error} Failed to send bug report. Please try again later or contact support.`,
    });
  }

  // Send confirmation to user (clean, no emojis)
  const confirmationText = `# Bug Report Submitted\n\n` +
    `**Thank you for reporting this bug!**\n\n` +
    `Your report has been successfully submitted to the development team. We appreciate your feedback and will review it as soon as possible.\n\n` +
    `**Report Details**\n` +
    `Title: ${title}\n` +
    `Status: Pending Review\n\n` +
    `*You can close this message.*`;

  const confirmation = new ContainerBuilder()
    .addContainer({
      accentColor: 0x43B581,
      components: [ContainerBuilder.createTextDisplay(confirmationText)]
    })
    .build();

  return interaction.editReply(confirmation);
};
