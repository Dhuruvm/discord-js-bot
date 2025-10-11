const { AuditLogEvent } = require("discord.js");
const AntinukeHandler = require("@handlers/antinuke");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').GuildBan} ban
 */
module.exports = async (client, ban) => {
  const { guild, user } = ban;

  try {
    // Get audit log to find who banned the user
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberBanAdd,
      limit: 1,
    });

    const banLog = auditLogs.entries.first();
    if (!banLog) return;

    const executor = banLog.executor;
    if (!executor || executor.bot) return;

    // Check antinuke
    await AntinukeHandler.handleBan(guild, user, executor);
  } catch (error) {
    client.logger.error("GuildBanAdd Event Error", error);
  }
};
