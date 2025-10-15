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
      return message.safeReply("<:error:1424072711671382076> Bot is not jailed in this server!");
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

    return message.safeReply(`<:success:1424072640829722745> **Bot has been released from:** ${jailInfo.channelName}`);
  },

  async interactionRun(interaction) {
    if (!jailedBots.has(interaction.guild.id)) {
      return interaction.followUp("<:error:1424072711671382076> Bot is not jailed in this server!");
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

    return interaction.followUp(`<:success:1424072640829722745> **Bot has been released from:** ${jailInfo.channelName}`);
  },
};