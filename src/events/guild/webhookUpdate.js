const { AuditLogEvent } = require("discord.js");
const AntinukeHandler = require("@handlers/antinuke");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').GuildChannel} channel
 */
module.exports = async (client, channel) => {
  const { guild } = channel;

  try {
    // Get audit log to find who created webhooks
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.WebhookCreate,
      limit: 1,
    });

    const webhookLog = auditLogs.entries.first();
    if (!webhookLog) return;

    const executor = webhookLog.executor;
    if (!executor || executor.bot) return;

    const webhook = webhookLog.target;

    // Check antinuke
    await AntinukeHandler.handleWebhookCreate(guild, webhook, executor);
  } catch (error) {
    client.logger.error("WebhookUpdate Event Error", error);
  }
};
