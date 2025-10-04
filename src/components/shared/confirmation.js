/**
 * Reusable Confirmation Dialog Component
 * Creates yes/no confirmation prompts
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require("discord.js");

class ConfirmationHandler {
  /**
   * Show a confirmation dialog
   * @param {Object} options - Confirmation options
   * @param {import('discord.js').CommandInteraction|import('discord.js').Message} options.interaction - The interaction
   * @param {string} options.content - Confirmation message
   * @param {EmbedBuilder} options.embed - Optional embed
   * @param {string} options.confirmLabel - Label for confirm button (default: "Confirm")
   * @param {string} options.cancelLabel - Label for cancel button (default: "Cancel")
   * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
   * @param {boolean} options.ephemeral - Whether reply should be ephemeral (default: true)
   * @returns {Promise<boolean>} - True if confirmed, false if cancelled or timed out
   */
  static async prompt({
    interaction,
    content,
    embed,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    timeout = 30000,
    ephemeral = true,
  }) {
    const userId = interaction.user?.id || interaction.author?.id;

    // Build buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm:yes")
        .setLabel(confirmLabel)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("confirm:no")
        .setLabel(cancelLabel)
        .setStyle(ButtonStyle.Danger)
    );

    // Send message
    const messagePayload = {
      content,
      embeds: embed ? [embed] : [],
      components: [row],
      ephemeral,
    };

    const message = interaction.deferred || interaction.replied
      ? await interaction.editReply({ ...messagePayload, fetchReply: true })
      : await interaction.reply({ ...messagePayload, fetchReply: true });

    try {
      // Wait for button interaction
      const btnInteraction = await message.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === userId,
        time: timeout,
      });

      await btnInteraction.deferUpdate();

      const confirmed = btnInteraction.customId === "confirm:yes";

      // Update message
      const disabledRow = new ActionRowBuilder().addComponents(
        row.components.map(btn => ButtonBuilder.from(btn.data).setDisabled(true))
      );

      await btnInteraction.editReply({
        content: confirmed ? "✅ Confirmed" : "❌ Cancelled",
        embeds: [],
        components: [disabledRow],
      });

      return confirmed;
    } catch (error) {
      // Timeout or error
      const disabledRow = new ActionRowBuilder().addComponents(
        row.components.map(btn => ButtonBuilder.from(btn.data).setDisabled(true))
      );

      await message.edit({
        content: "⏱️ Confirmation timed out",
        embeds: [],
        components: [disabledRow],
      }).catch(() => {});

      return false;
    }
  }

  /**
   * Show a dangerous action confirmation with additional warning
   * @param {Object} options - Confirmation options (same as prompt())
   * @param {string} options.warningText - Warning text to display
   * @returns {Promise<boolean>}
   */
  static async dangerousAction({ interaction, content, warningText, timeout = 30000, ephemeral = true }) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("⚠️ Warning")
      .setDescription(content)
      .addFields({
        name: "This action cannot be undone",
        value: warningText || "Please confirm you want to proceed.",
      });

    return this.prompt({
      interaction,
      content: "",
      embed,
      confirmLabel: "Yes, I'm sure",
      cancelLabel: "Cancel",
      timeout,
      ephemeral,
    });
  }
}

module.exports = ConfirmationHandler;
