const { inviteHandler, greetingHandler } = require("@src/handlers");
const { getSettings } = require("@schemas/Guild");
const AntinukeHandler = require("@handlers/antinuke");
const { AuditLogEvent } = require("discord.js");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').GuildMember|import('discord.js').PartialGuildMember} member
 */
module.exports = async (client, member) => {
  if (member.partial) await member.user.fetch();
  if (!member.guild) return;

  const { guild } = member;
  const settings = await getSettings(guild);

  // Antinuke: Check for kicks
  try {
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberKick,
      limit: 1,
    });

    const kickLog = auditLogs.entries.first();
    if (kickLog && kickLog.target?.id === member.id) {
      const executor = kickLog.executor;
      if (executor && !executor.bot) {
        await AntinukeHandler.handleKick(guild, member, executor);
      }
    }
  } catch (error) {
    client.logger.error("Antinuke Kick Check Error", error);
  }

  // Check for counter channel
  if (settings.counters.find((doc) => ["MEMBERS", "BOTS", "USERS"].includes(doc.counter_type.toUpperCase()))) {
    if (member.user.bot) {
      settings.data.bots -= 1;
      await settings.save();
    }
    if (!client.counterUpdateQueue.includes(guild.id)) client.counterUpdateQueue.push(guild.id);
  }

  // Invite Tracker
  const inviterData = await inviteHandler.trackLeftMember(guild, member.user);

  // Farewell message
  greetingHandler.sendFarewell(member, inviterData);
};
