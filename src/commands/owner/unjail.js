const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const EMOJIS = require("@helpers/EmojiConstants");
const { jailedBots } = require("./jail");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "unjail",
  description: "Release bot from voice channel jail (owner only)",
  category: "OWNER",
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args) {
    if (!jailedBots.has(message.guild.id)) {
      return message.safeReply("❌ Bot is not jailed in this server!");
    }

    const jailInfo = jailedBots.get(message.guild.id);
    jailedBots.delete(message.guild.id);

    return message.safeReply(`✅ Bot has been released from jail in **${jailInfo.channelName}**`);
  },

  async interactionRun(interaction) {
    if (!jailedBots.has(interaction.guild.id)) {
      return interaction.followUp("❌ Bot is not jailed in this server!");
    }

    const jailInfo = jailedBots.get(interaction.guild.id);
    jailedBots.delete(interaction.guild.id);

    return interaction.followUp(`✅ Bot has been released from jail in **${jailInfo.channelName}**`);
  },
};