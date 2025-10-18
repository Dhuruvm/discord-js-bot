/**
 * Centralized Interaction Component Router
 * Handles all button, select menu, and modal interactions with namespaced custom IDs
 * 
 * Custom ID Format: category:action:data
 * Examples:
 * - embed:add:channelId
 * - ticket:create:userId
 * - help:category:ADMIN
 */

const { ComponentType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");

class InteractionRouter {
  constructor(client) {
    this.client = client;
    this.handlers = new Map();
    this.modalHandlers = new Map();
  }

  /**
   * Register a component handler
   * @param {string} category - The category (e.g., 'embed', 'ticket')
   * @param {string} action - The specific action (e.g., 'add', 'remove')
   * @param {Function} handler - The handler function
   */
  registerComponent(category, action, handler) {
    const key = `${category}:${action}`;
    this.handlers.set(key, handler);
  }

  /**
   * Register a modal handler
   * @param {string} category - The category
   * @param {string} action - The specific action
   * @param {Function} handler - The handler function
   */
  registerModal(category, action, handler) {
    const key = `${category}:${action}`;
    this.modalHandlers.set(key, handler);
  }

  /**
   * Parse a namespaced custom ID
   * @param {string} customId
   * @returns {{category: string, action: string, data: string}}
   */
  parseCustomId(customId) {
    const parts = customId.split(":");
    return {
      category: parts[0],
      action: parts[1],
      data: parts.slice(2).join(":"),
    };
  }

  /**
   * Route a component interaction to the appropriate handler
   * @param {import('discord.js').MessageComponentInteraction} interaction
   */
  async routeComponent(interaction) {
    try {
      const { category, action, data } = this.parseCustomId(interaction.customId);
      const key = `${category}:${action}`;
      
      const handler = this.handlers.get(key);
      if (!handler) {
        this.client.logger.warn(`No handler registered for component: ${key}`);
        return;
      }

      // Get guild settings if in a guild
      let settings = null;
      if (interaction.guild) {
        settings = await getSettings(interaction.guild);
      }

      // Execute handler with context
      await handler({
        interaction,
        data,
        settings,
        client: this.client,
      });
    } catch (error) {
      this.client.logger.error(`InteractionRouter Component Error [${interaction.customId}]`, error);
      
      // Try to respond with error
      const errorMessage = "An error occurred while processing your interaction. Please try again or use `/reportbug` to report this issue.";
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        } else if (interaction.deferred) {
          await interaction.editReply({ content: errorMessage });
        } else {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        }
      } catch (replyError) {
        this.client.logger.error("Failed to send error response", replyError);
      }
    }
  }

  /**
   * Route a modal submit to the appropriate handler
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   */
  async routeModal(interaction) {
    try {
      const { category, action, data } = this.parseCustomId(interaction.customId);
      const key = `${category}:${action}`;
      
      const handler = this.modalHandlers.get(key);
      if (!handler) {
        this.client.logger.warn(`No handler registered for modal: ${key}`);
        return;
      }

      // Get guild settings if in a guild
      let settings = null;
      if (interaction.guild) {
        settings = await getSettings(interaction.guild);
      }

      // Execute handler with context
      await handler({
        interaction,
        data,
        settings,
        client: this.client,
      });
    } catch (error) {
      this.client.logger.error(`InteractionRouter Modal Error [${interaction.customId}]`, error);
      
      // Try to respond with error
      const errorMessage = "An error occurred while processing your submission. Please try again or use `/reportbug` to report this issue.";
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        } else if (interaction.deferred) {
          await interaction.editReply({ content: errorMessage });
        } else {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        }
      } catch (replyError) {
        this.client.logger.error("Failed to send error response", replyError);
      }
    }
  }

  /**
   * Initialize the interaction router
   */
  initialize() {
    // Register handlers from component modules
    this.registerEmbedHandlers();
    this.registerTicketHandlers();
    this.registerGiveawayHandlers();
    this.registerSuggestionHandlers();
    this.registerBugReportHandlers();
    
    this.client.logger.success(`Interaction Router initialized with ${this.handlers.size} component handlers and ${this.modalHandlers.size} modal handlers`);
  }

  /**
   * Register embed-related handlers
   */
  registerEmbedHandlers() {
    // These are placeholders - actual implementations should import from component files
    // This demonstrates the architecture
    
    this.registerComponent("embed", "add", async ({ interaction }) => {
      // Handler logic here
      await interaction.deferUpdate();
    });

    this.registerComponent("embed", "field_add", async ({ interaction }) => {
      await interaction.deferUpdate();
    });

    this.registerComponent("embed", "field_rem", async ({ interaction }) => {
      await interaction.deferUpdate();
    });

    this.registerComponent("embed", "field_done", async ({ interaction }) => {
      await interaction.deferUpdate();
    });
  }

  /**
   * Register ticket-related handlers
   */
  registerTicketHandlers() {
    this.registerComponent("ticket", "create", async ({ interaction, settings }) => {
      // Handler logic for ticket creation
      await interaction.deferUpdate();
    });

    this.registerComponent("ticket", "close", async ({ interaction }) => {
      await interaction.deferUpdate();
    });
  }

  /**
   * Register giveaway-related handlers
   */
  registerGiveawayHandlers() {
    this.registerComponent("giveaway", "setup", async ({ interaction }) => {
      await interaction.deferUpdate();
    });

    this.registerComponent("giveaway", "edit", async ({ interaction }) => {
      await interaction.deferUpdate();
    });
  }

  /**
   * Register suggestion-related handlers
   */
  registerSuggestionHandlers() {
    this.registerComponent("suggestion", "approve", async ({ interaction }) => {
      await interaction.deferUpdate();
    });

    this.registerComponent("suggestion", "reject", async ({ interaction }) => {
      await interaction.deferUpdate();
    });

    this.registerComponent("suggestion", "delete", async ({ interaction }) => {
      await interaction.deferUpdate();
    });
  }

  /**
   * Register bug report handlers
   */
  registerBugReportHandlers() {
    const bugReportHandler = require("@src/components/bug-report/modal-handler");
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
    
    // Handle button click to show modal
    this.registerComponent("bug", "report", async ({ interaction }) => {
      try {
        const modal = new ModalBuilder()
          .setCustomId("bug:report:modal")
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
      } catch (error) {
        this.client.logger.error("Error showing bug report modal", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            content: "Failed to open bug report form. Please try again.", 
            ephemeral: true 
          }).catch(() => {});
        }
      }
    });
    
    // Handle modal submission with updated customId
    this.registerModal("bug", "report:modal", bugReportHandler);
  }
}

module.exports = InteractionRouter;
