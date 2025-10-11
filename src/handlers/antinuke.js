const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const { getSettings } = require("@schemas/Guild");

// Track user actions for rate limiting
const actionTracker = new Map();

class AntinukeHandler {
  /**
   * Track and check if user exceeds rate limit
   */
  static async checkRateLimit(guildId, userId, actionType, limit, timeframe) {
    const key = `${guildId}-${userId}-${actionType}`;
    const now = Date.now();
    
    if (!actionTracker.has(key)) {
      actionTracker.set(key, []);
    }

    const actions = actionTracker.get(key);
    
    // Remove actions outside timeframe
    const validActions = actions.filter(time => now - time < timeframe * 1000);
    actionTracker.set(key, validActions);

    // Add current action
    validActions.push(now);

    // Check if limit exceeded
    return validActions.length > limit;
  }

  /**
   * Punish a user who violated antinuke rules
   */
  static async punishUser(guild, user, reason, punishment) {
    try {
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (!member) return;

      // Don't punish guild owner
      if (member.id === guild.ownerId) return;

      // Don't punish users with higher roles than bot
      if (member.roles.highest.position >= guild.members.me.roles.highest.position) return;

      switch (punishment) {
        case "BAN":
          await guild.members.ban(user.id, { reason: `[ANTINUKE] ${reason}` });
          break;
        
        case "KICK":
          await member.kick(`[ANTINUKE] ${reason}`);
          break;
        
        case "STRIP_ROLES":
          await member.roles.set([], `[ANTINUKE] ${reason}`);
          break;
      }

      return true;
    } catch (error) {
      console.error("Antinuke punishment error:", error);
      return false;
    }
  }

  /**
   * Send log to antinuke log channel
   */
  static async sendLog(guild, settings, title, description, executor, color = 0xFF0000) {
    if (!settings.antinuke?.log_channel) return;

    const channel = guild.channels.cache.get(settings.antinuke.log_channel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ ${title}`)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    if (executor) {
      embed.setFooter({ 
        text: `Executor: ${executor.tag}`, 
        iconURL: executor.displayAvatarURL() 
      });
    }

    await channel.send({ embeds: [embed] }).catch(() => {});
  }

  /**
   * Check if user is whitelisted
   */
  static isWhitelisted(settings, userId, guildOwnerId) {
    if (userId === guildOwnerId) return true;
    if (!settings.antinuke?.whitelist) return false;
    return settings.antinuke.whitelist.includes(userId);
  }

  /**
   * Handle member ban
   */
  static async handleBan(guild, user, executor) {
    const settings = await getSettings(guild);
    
    if (!settings.antinuke?.enabled || !settings.antinuke.anti_ban?.enabled) return;
    if (!executor || this.isWhitelisted(settings, executor.id, guild.ownerId)) return;

    const config = settings.antinuke.anti_ban;
    const exceeded = await this.checkRateLimit(
      guild.id, 
      executor.id, 
      'ban', 
      config.limit, 
      config.timeframe
    );

    if (exceeded) {
      await this.sendLog(
        guild,
        settings,
        "Anti-Ban Triggered",
        `**${executor.tag}** exceeded ban limit (${config.limit}/${config.timeframe}s)\n\n**Action:** ${settings.antinuke.punishment}`,
        executor
      );

      await this.punishUser(
        guild, 
        executor, 
        `Mass ban detected (${config.limit}+ bans in ${config.timeframe}s)`,
        settings.antinuke.punishment
      );
    }
  }

  /**
   * Handle member kick
   */
  static async handleKick(guild, member, executor) {
    const settings = await getSettings(guild);
    
    if (!settings.antinuke?.enabled || !settings.antinuke.anti_kick?.enabled) return;
    if (!executor || this.isWhitelisted(settings, executor.id, guild.ownerId)) return;

    const config = settings.antinuke.anti_kick;
    const exceeded = await this.checkRateLimit(
      guild.id, 
      executor.id, 
      'kick', 
      config.limit, 
      config.timeframe
    );

    if (exceeded) {
      await this.sendLog(
        guild,
        settings,
        "Anti-Kick Triggered",
        `**${executor.tag}** exceeded kick limit (${config.limit}/${config.timeframe}s)\n\n**Action:** ${settings.antinuke.punishment}`,
        executor
      );

      await this.punishUser(
        guild, 
        executor, 
        `Mass kick detected (${config.limit}+ kicks in ${config.timeframe}s)`,
        settings.antinuke.punishment
      );
    }
  }

  /**
   * Handle role creation
   */
  static async handleRoleCreate(guild, role, executor) {
    const settings = await getSettings(guild);
    
    if (!settings.antinuke?.enabled || !settings.antinuke.anti_role_create?.enabled) return;
    if (!executor || this.isWhitelisted(settings, executor.id, guild.ownerId)) return;

    const config = settings.antinuke.anti_role_create;
    const exceeded = await this.checkRateLimit(
      guild.id, 
      executor.id, 
      'role_create', 
      config.limit, 
      config.timeframe
    );

    if (exceeded) {
      // Delete the created role
      await role.delete("[ANTINUKE] Mass role creation detected").catch(() => {});

      await this.sendLog(
        guild,
        settings,
        "Anti-Role Create Triggered",
        `**${executor.tag}** exceeded role creation limit (${config.limit}/${config.timeframe}s)\n\n**Role Deleted:** ${role.name}\n**Action:** ${settings.antinuke.punishment}`,
        executor
      );

      await this.punishUser(
        guild, 
        executor, 
        `Mass role creation detected (${config.limit}+ roles in ${config.timeframe}s)`,
        settings.antinuke.punishment
      );
    }
  }

  /**
   * Handle role deletion
   */
  static async handleRoleDelete(guild, role, executor) {
    const settings = await getSettings(guild);
    
    if (!settings.antinuke?.enabled || !settings.antinuke.anti_role_delete?.enabled) return;
    if (!executor || this.isWhitelisted(settings, executor.id, guild.ownerId)) return;

    const config = settings.antinuke.anti_role_delete;
    const exceeded = await this.checkRateLimit(
      guild.id, 
      executor.id, 
      'role_delete', 
      config.limit, 
      config.timeframe
    );

    if (exceeded) {
      await this.sendLog(
        guild,
        settings,
        "Anti-Role Delete Triggered",
        `**${executor.tag}** exceeded role deletion limit (${config.limit}/${config.timeframe}s)\n\n**Deleted Role:** ${role.name}\n**Action:** ${settings.antinuke.punishment}`,
        executor
      );

      await this.punishUser(
        guild, 
        executor, 
        `Mass role deletion detected (${config.limit}+ roles in ${config.timeframe}s)`,
        settings.antinuke.punishment
      );
    }
  }

  /**
   * Handle channel creation
   */
  static async handleChannelCreate(guild, channel, executor) {
    const settings = await getSettings(guild);
    
    if (!settings.antinuke?.enabled || !settings.antinuke.anti_channel_create?.enabled) return;
    if (!executor || this.isWhitelisted(settings, executor.id, guild.ownerId)) return;

    const config = settings.antinuke.anti_channel_create;
    const exceeded = await this.checkRateLimit(
      guild.id, 
      executor.id, 
      'channel_create', 
      config.limit, 
      config.timeframe
    );

    if (exceeded) {
      // Delete the created channel
      await channel.delete("[ANTINUKE] Mass channel creation detected").catch(() => {});

      await this.sendLog(
        guild,
        settings,
        "Anti-Channel Create Triggered",
        `**${executor.tag}** exceeded channel creation limit (${config.limit}/${config.timeframe}s)\n\n**Channel Deleted:** ${channel.name}\n**Action:** ${settings.antinuke.punishment}`,
        executor
      );

      await this.punishUser(
        guild, 
        executor, 
        `Mass channel creation detected (${config.limit}+ channels in ${config.timeframe}s)`,
        settings.antinuke.punishment
      );
    }
  }

  /**
   * Handle channel deletion
   */
  static async handleChannelDelete(guild, channel, executor) {
    const settings = await getSettings(guild);
    
    if (!settings.antinuke?.enabled || !settings.antinuke.anti_channel_delete?.enabled) return;
    if (!executor || this.isWhitelisted(settings, executor.id, guild.ownerId)) return;

    const config = settings.antinuke.anti_channel_delete;
    const exceeded = await this.checkRateLimit(
      guild.id, 
      executor.id, 
      'channel_delete', 
      config.limit, 
      config.timeframe
    );

    if (exceeded) {
      await this.sendLog(
        guild,
        settings,
        "Anti-Channel Delete Triggered",
        `**${executor.tag}** exceeded channel deletion limit (${config.limit}/${config.timeframe}s)\n\n**Deleted Channel:** ${channel.name}\n**Action:** ${settings.antinuke.punishment}`,
        executor
      );

      await this.punishUser(
        guild, 
        executor, 
        `Mass channel deletion detected (${config.limit}+ channels in ${config.timeframe}s)`,
        settings.antinuke.punishment
      );
    }
  }

  /**
   * Handle bot addition
   */
  static async handleBotAdd(guild, member, executor) {
    const settings = await getSettings(guild);
    
    if (!settings.antinuke?.enabled || !settings.antinuke.anti_bot?.enabled) return;
    if (!member.user.bot) return;
    if (!executor || this.isWhitelisted(settings, executor.id, guild.ownerId)) return;

    // Kick/ban the added bot
    const action = settings.antinuke.anti_bot.action || "KICK";
    
    if (action === "KICK") {
      await member.kick("[ANTINUKE] Unauthorized bot addition").catch(() => {});
    } else {
      await guild.members.ban(member.id, { reason: "[ANTINUKE] Unauthorized bot addition" }).catch(() => {});
    }

    await this.sendLog(
      guild,
      settings,
      "Anti-Bot Triggered",
      `**${executor.tag}** attempted to add bot **${member.user.tag}**\n\n**Bot ${action === 'KICK' ? 'Kicked' : 'Banned'}**`,
      executor
    );
  }

  /**
   * Handle webhook creation
   */
  static async handleWebhookCreate(guild, webhook, executor) {
    const settings = await getSettings(guild);
    
    if (!settings.antinuke?.enabled || !settings.antinuke.anti_webhook?.enabled) return;
    if (!executor || this.isWhitelisted(settings, executor.id, guild.ownerId)) return;

    const config = settings.antinuke.anti_webhook;
    const exceeded = await this.checkRateLimit(
      guild.id, 
      executor.id, 
      'webhook_create', 
      config.limit, 
      config.timeframe
    );

    if (exceeded) {
      // Delete the webhook
      await webhook.delete("[ANTINUKE] Mass webhook creation detected").catch(() => {});

      await this.sendLog(
        guild,
        settings,
        "Anti-Webhook Triggered",
        `**${executor.tag}** exceeded webhook creation limit (${config.limit}/${config.timeframe}s)\n\n**Webhook Deleted**\n**Action:** ${settings.antinuke.punishment}`,
        executor
      );

      await this.punishUser(
        guild, 
        executor, 
        `Mass webhook creation detected (${config.limit}+ webhooks in ${config.timeframe}s)`,
        settings.antinuke.punishment
      );
    }
  }

  /**
   * Handle server update
   */
  static async handleServerUpdate(guild, oldGuild, executor) {
    const settings = await getSettings(guild);
    
    if (!settings.antinuke?.enabled || !settings.antinuke.anti_server_update?.enabled) return;
    if (!executor || this.isWhitelisted(settings, executor.id, guild.ownerId)) return;

    await this.sendLog(
      guild,
      settings,
      "Server Updated",
      `**${executor.tag}** updated server settings\n\n**Changes detected**`,
      executor,
      0xFFA500
    );
  }
}

module.exports = AntinukeHandler;
