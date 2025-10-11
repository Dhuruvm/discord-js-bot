const { AuditLogEvent } = require("discord.js");
const AntinukeHandler = require("@handlers/antinuke");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Role} role
 */
module.exports = async (client, role) => {
  const { guild } = role;

  try {
    // Get audit log to find who created the role
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.RoleCreate,
      limit: 1,
    });

    const roleLog = auditLogs.entries.first();
    if (!roleLog) return;

    const executor = roleLog.executor;
    if (!executor || executor.bot) return;

    // Check antinuke
    await AntinukeHandler.handleRoleCreate(guild, role, executor);
  } catch (error) {
    client.logger.error("RoleCreate Event Error", error);
  }
};
