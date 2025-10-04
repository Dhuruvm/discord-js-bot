
const botstats = require("../shared/botstats");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "botinfo",
  description: "shows bot information",
  category: "INFORMATION",
  botPermissions: ["EmbedLinks"],
  cooldown: 5,
  command: {
    enabled: true,
    aliases: ["botstats", "stats", "bi"],
  },

  async messageRun(message, args) {
    const response = await botstats(message.client);
    await message.safeReply(response);
  },
};
