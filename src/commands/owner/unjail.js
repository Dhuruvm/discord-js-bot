const { jailedBots } = require("./jail");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "fuckoff",
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
      return message.safeReply("❌ Cybork is not jailed in this server!");
    }

    const jailInfo = jailedBots.get(message.guild.id);
    
    // Destroy the voice connection
    if (jailInfo.connection) {
      try {
        jailInfo.connection.destroy();
      } catch (error) {
        console.error("Error destroying voice connection:", error);
      }
    }
    
    jailedBots.delete(message.guild.id);

    return message.safeReply(`✅ **Cybork has been released from:** ${jailInfo.channelName}`);
  },

  async interactionRun(interaction) {
    if (!jailedBots.has(interaction.guild.id)) {
      return interaction.followUp("❌ Cybork is not jailed in this server!");
    }

    const jailInfo = jailedBots.get(interaction.guild.id);
    
    // Destroy the voice connection
    if (jailInfo.connection) {
      try {
        jailInfo.connection.destroy();
      } catch (error) {
        console.error("Error destroying voice connection:", error);
      }
    }
    
    jailedBots.delete(interaction.guild.id);

    return interaction.followUp(`✅ **Cybork has been released from:** ${jailInfo.channelName}`);
  },
};