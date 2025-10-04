/**
 * Embed Component Interaction Tests
 * Tests for embed command interaction flows
 */

const { createMockButtonInteraction, createMockModalInteraction } = require("../helpers/mockInteractions");
const embedHandlers = require("../../src/components/embed/handlers");

describe("Embed Component Interactions", () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
      },
      embedCache: new Map(),
    };
  });

  describe("handleEmbedAdd", () => {
    it("should show modal when add button is clicked", async () => {
      const interaction = createMockButtonInteraction("embed:add:123456");
      
      await embedHandlers.handleEmbedAdd({
        interaction,
        data: "123456",
        client: mockClient,
      });

      expect(interaction.showModal).toHaveBeenCalled();
      expect(interaction.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Embed Generator",
          }),
        })
      );
    });

    it("should include channelId in modal customId", async () => {
      const channelId = "987654321";
      const interaction = createMockButtonInteraction(`embed:add:${channelId}`);
      
      await embedHandlers.handleEmbedAdd({
        interaction,
        data: channelId,
        client: mockClient,
      });

      const modalCall = interaction.showModal.mock.calls[0][0];
      expect(modalCall.data.custom_id).toBe(`embed:modal:${channelId}`);
    });
  });

  describe("handleEmbedModal", () => {
    it("should create embed with provided fields", async () => {
      const channelId = "123456";
      const interaction = createMockModalInteraction(`embed:modal:${channelId}`, {
        title: "Test Title",
        author: "Test Author",
        description: "Test Description",
        color: "#FF5733",
        footer: "Test Footer",
      });

      // Mock channel
      interaction.guild.channels.cache.set(channelId, {
        send: jest.fn().mockResolvedValue({
          id: "message123",
          edit: jest.fn(),
        }),
      });

      await embedHandlers.handleEmbedModal({
        interaction,
        data: channelId,
        client: mockClient,
      });

      expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
      expect(interaction.guild.channels.cache.get(channelId).send).toHaveBeenCalled();
    });

    it("should reject empty embed", async () => {
      const channelId = "123456";
      const interaction = createMockModalInteraction(`embed:modal:${channelId}`, {
        title: "",
        author: "",
        description: "",
        color: "",
        footer: "",
      });

      interaction.guild.channels.cache.set(channelId, {
        send: jest.fn(),
      });

      await embedHandlers.handleEmbedModal({
        interaction,
        data: channelId,
        client: mockClient,
      });

      expect(interaction.editReply).toHaveBeenCalledWith("You can't send an empty embed!");
    });

    it("should reject invalid color", async () => {
      const channelId = "123456";
      const interaction = createMockModalInteraction(`embed:modal:${channelId}`, {
        title: "Test",
        color: "invalid_color_123",
      });

      interaction.guild.channels.cache.set(channelId, {
        send: jest.fn(),
      });

      await embedHandlers.handleEmbedModal({
        interaction,
        data: channelId,
        client: mockClient,
      });

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.stringContaining("Invalid color")
      );
    });
  });

  describe("handleFieldAdd", () => {
    it("should show field modal when field add button clicked", async () => {
      const messageId = "message123";
      const interaction = createMockButtonInteraction(`embed:field:add:123456`);
      interaction.message.id = messageId;

      // Setup cache
      mockClient.embedCache.set(messageId, {
        embed: { data: { fields: [] } },
        channelId: "123456",
        creatorId: "user123",
      });

      await embedHandlers.handleFieldAdd({
        interaction,
        data: "123456",
        client: mockClient,
      });

      expect(interaction.showModal).toHaveBeenCalled();
    });

    it("should error if embed session expired", async () => {
      const interaction = createMockButtonInteraction("embed:field:add:123456");
      interaction.message.id = "expired_message";

      await embedHandlers.handleFieldAdd({
        interaction,
        data: "123456",
        client: mockClient,
      });

      expect(interaction.reply).toHaveBeenCalledWith({
        content: expect.stringContaining("expired"),
        ephemeral: true,
      });
    });
  });

  describe("handleFieldModal", () => {
    it("should add field to embed", async () => {
      const messageId = "message123";
      const interaction = createMockModalInteraction(`embed:field:modal:${messageId}`, {
        name: "Field Name",
        value: "Field Value",
        inline: "true",
      });

      const mockEmbed = {
        data: { fields: [] },
        setFields: jest.fn(),
      };

      mockClient.embedCache.set(messageId, {
        embed: mockEmbed,
        channelId: "123456",
        creatorId: "user123",
      });

      interaction.channel.messages.fetch = jest.fn().mockResolvedValue({
        edit: jest.fn(),
      });

      await embedHandlers.handleFieldModal({
        interaction,
        data: messageId,
        client: mockClient,
      });

      expect(mockEmbed.setFields).toHaveBeenCalledWith([
        { name: "Field Name", value: "Field Value", inline: true },
      ]);
    });

    it("should prevent adding more than 25 fields", async () => {
      const messageId = "message123";
      const interaction = createMockModalInteraction(`embed:field:modal:${messageId}`, {
        name: "Field 26",
        value: "Too many",
        inline: "false",
      });

      const mockEmbed = {
        data: {
          fields: new Array(25).fill({ name: "Field", value: "Value", inline: false }),
        },
        setFields: jest.fn(),
      };

      mockClient.embedCache.set(messageId, {
        embed: mockEmbed,
      });

      await embedHandlers.handleFieldModal({
        interaction,
        data: messageId,
        client: mockClient,
      });

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.stringContaining("Maximum of 25 fields")
      );
    });
  });

  describe("handleFieldRemove", () => {
    it("should remove last field from embed", async () => {
      const messageId = "message123";
      const interaction = createMockButtonInteraction("embed:field:remove:123456");
      interaction.message.id = messageId;

      const mockEmbed = {
        data: {
          fields: [
            { name: "Field 1", value: "Value 1" },
            { name: "Field 2", value: "Value 2" },
          ],
        },
        setFields: jest.fn(),
      };

      mockClient.embedCache.set(messageId, {
        embed: mockEmbed,
      });

      await embedHandlers.handleFieldRemove({
        interaction,
        data: "123456",
        client: mockClient,
      });

      expect(mockEmbed.setFields).toHaveBeenCalledWith([
        { name: "Field 1", value: "Value 1" },
      ]);
    });
  });
});
