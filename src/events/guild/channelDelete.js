const { AuditLogEvent } = require("discord.js");
const AntinukeHandler = require("@handlers/antinuke");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').GuildChannel} channel
 */
module.exports = async (client, channel) => {
  const { guild } = channel;

  try {
    // Get audit log to find who deleted the channel
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.ChannelDelete,
      limit: 1,
    });

    const channelLog = auditLogs.entries.first();
    if (!channelLog) return;

    const executor = channelLog.executor;
    if (!executor || executor.bot) return;

    // Check antinuke
    await AntinukeHandler.handleChannelDelete(guild, channel, executor);
  } catch (error) {
    client.logger.error("ChannelDelete Event Error", error);
  }
};
