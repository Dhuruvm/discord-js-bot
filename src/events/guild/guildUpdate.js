const { AuditLogEvent } = require("discord.js");
const AntinukeHandler = require("@handlers/antinuke");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} oldGuild
 * @param {import('discord.js').Guild} newGuild
 */
module.exports = async (client, oldGuild, newGuild) => {
  try {
    // Get audit log to find who updated the server
    const auditLogs = await newGuild.fetchAuditLogs({
      type: AuditLogEvent.GuildUpdate,
      limit: 1,
    });

    const updateLog = auditLogs.entries.first();
    if (!updateLog) return;

    const executor = updateLog.executor;
    if (!executor || executor.bot) return;

    // Check antinuke
    await AntinukeHandler.handleServerUpdate(newGuild, oldGuild, executor);
  } catch (error) {
    client.logger.error("GuildUpdate Event Error", error);
  }
};
