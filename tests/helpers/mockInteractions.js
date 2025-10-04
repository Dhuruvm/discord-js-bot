/**
 * Mock Interaction Helpers for Testing
 */

function createBaseMockInteraction() {
  return {
    user: {
      id: "user123",
      username: "testuser",
      tag: "testuser#0001",
    },
    guild: {
      id: "guild123",
      channels: {
        cache: new Map(),
      },
    },
    channel: {
      id: "channel123",
      send: jest.fn().mockResolvedValue({ id: "message123" }),
      messages: {
        fetch: jest.fn(),
      },
    },
    reply: jest.fn().mockResolvedValue({}),
    followUp: jest.fn().mockResolvedValue({}),
    deferReply: jest.fn().mockResolvedValue({}),
    deferUpdate: jest.fn().mockResolvedValue({}),
    editReply: jest.fn().mockResolvedValue({}),
    deleteReply: jest.fn().mockResolvedValue({}),
    showModal: jest.fn().mockResolvedValue({}),
    replied: false,
    deferred: false,
  };
}

function createMockButtonInteraction(customId) {
  const base = createBaseMockInteraction();
  return {
    ...base,
    customId,
    componentType: 2, // Button
    message: {
      id: "message123",
      edit: jest.fn(),
    },
  };
}

function createMockModalInteraction(customId, fields = {}) {
  const base = createBaseMockInteraction();
  return {
    ...base,
    customId,
    fields: {
      getTextInputValue: (fieldId) => fields[fieldId] || "",
    },
  };
}

function createMockSelectMenuInteraction(customId, values = []) {
  const base = createBaseMockInteraction();
  return {
    ...base,
    customId,
    componentType: 3, // Select Menu
    values,
    message: {
      id: "message123",
      edit: jest.fn(),
    },
  };
}

module.exports = {
  createMockButtonInteraction,
  createMockModalInteraction,
  createMockSelectMenuInteraction,
};
