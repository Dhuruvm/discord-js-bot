const { inviteHandler, greetingHandler } = require("@src/handlers");
const { getSettings } = require("@schemas/Guild");
const AntinukeHandler = require("@handlers/antinuke");
const { AuditLogEvent } = require("discord.js");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').GuildMember} member
 */
module.exports = async (client, member) => {
  if (!member || !member.guild) return;

  const { guild } = member;
  const settings = await getSettings(guild);

  // Antinuke: Check for bot additions
  if (member.user.bot) {
    try {
      const auditLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.BotAdd,
        limit: 1,
      });

      const botAddLog = auditLogs.entries.first();
      if (botAddLog) {
        const executor = botAddLog.executor;
        if (executor && !executor.bot) {
          await AntinukeHandler.handleBotAdd(guild, member, executor);
        }
      }
    } catch (error) {
      client.logger.error("Antinuke Bot Add Check Error", error);
    }
  }

  // Autorole
  if (settings.autorole) {
    const role = guild.roles.cache.get(settings.autorole);
    if (role) member.roles.add(role).catch((err) => {});
  }

  // Check for counter channel
  if (settings.counters.find((doc) => ["MEMBERS", "BOTS", "USERS"].includes(doc.counter_type.toUpperCase()))) {
    if (member.user.bot) {
      settings.data.bots += 1;
      await settings.save();
    }
    if (!client.counterUpdateQueue.includes(guild.id)) client.counterUpdateQueue.push(guild.id);
  }

  // Check if invite tracking is enabled
  const inviterData = settings.invite.tracking ? await inviteHandler.trackJoinedMember(member) : {};

  // Send welcome message
  greetingHandler.sendWelcome(member, inviterData);
};
