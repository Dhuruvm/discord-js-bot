const { jailedBots } = require("./jail");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "fuckoff",
  description: "Release bot from voice channel jail (owner/access only)",
  category: "OWNER",
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    if (!jailedBots.has(message.guild.id)) {
      return message.safeReply("❌ Bot is not jailed in this server!");
    }

    const jailInfo = jailedBots.get(message.guild.id);
    
    // Stop audio player first
    if (jailInfo.player) {
      try {
        jailInfo.player.stop();
      } catch (error) {
        console.error("Error stopping player:", error);
      }
    }
    
    // Destroy the voice connection
    if (jailInfo.connection) {
      try {
        jailInfo.connection.destroy();
      } catch (error) {
        console.error("Error destroying voice connection:", error);
      }
    }
    
    jailedBots.delete(message.guild.id);

    return message.safeReply(`✅ **Bot has been released from:** ${jailInfo.channelName}`);
  },

  async interactionRun(interaction) {
    if (!jailedBots.has(interaction.guild.id)) {
      return interaction.followUp("❌ Bot is not jailed in this server!");
    }

    const jailInfo = jailedBots.get(interaction.guild.id);
    
    // Stop audio player first
    if (jailInfo.player) {
      try {
        jailInfo.player.stop();
      } catch (error) {
        console.error("Error stopping player:", error);
      }
    }
    
    // Destroy the voice connection
    if (jailInfo.connection) {
      try {
        jailInfo.connection.destroy();
      } catch (error) {
        console.error("Error destroying voice connection:", error);
      }
    }
    
    jailedBots.delete(interaction.guild.id);

    return interaction.followUp(`✅ **Bot has been released from:** ${jailInfo.channelName}`);
  },
};