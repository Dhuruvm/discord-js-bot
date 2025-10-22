const mongoose = require("mongoose");
const { CACHE_SIZE, PREFIX_COMMANDS, STATS } = require("@root/config.js");
const FixedSizeMap = require("fixedsize-map");
const { getUser } = require("./User");

const cache = new FixedSizeMap(CACHE_SIZE.GUILDS);

const Schema = new mongoose.Schema({
  _id: String,
  data: {
    name: String,
    region: String,
    owner: { type: String, ref: "users" },
    joinedAt: Date,
    leftAt: Date,
    bots: { type: Number, default: 0 },
  },
  prefix: { type: String, default: PREFIX_COMMANDS.DEFAULT_PREFIX },
  stats: {
    enabled: Boolean,
    xp: {
      message: { type: String, default: STATS.DEFAULT_LVL_UP_MSG },
      channel: String,
    },
  },
  ticket: {
    log_channel: String,
    limit: { type: Number, default: 10 },
    categories: [
      {
        _id: false,
        name: String,
        staff_roles: [String],
      },
    ],
  },
  automod: {
    debug: Boolean,
    strikes: { type: Number, default: 10 },
    action: { type: String, default: "TIMEOUT" },
    wh_channels: [String],
    anti_attachments: Boolean,
    anti_invites: Boolean,
    anti_links: Boolean,
    anti_spam: {
      enabled: Boolean,
      threshold: { type: Number, default: 5 },
      timeframe: { type: Number, default: 5 },
    },
    anti_ghostping: Boolean,
    anti_massmention: Number,
    max_lines: Number,
    anti_badwords: {
      enabled: Boolean,
      keywords: [String],
      action: { type: String, enum: ["DELETE", "WARN", "TIMEOUT", "KICK", "BAN"], default: "DELETE" },
    },
    anti_zalgo: {
      enabled: Boolean,
      threshold: { type: Number, default: 50 },
    },
    anti_caps: {
      enabled: Boolean,
      threshold: { type: Number, default: 70 },
      min_length: { type: Number, default: 10 },
    },
  },
  invite: {
    tracking: Boolean,
    ranks: [
      {
        invites: { type: Number, required: true },
        _id: { type: String, required: true },
      },
    ],
  },
  flag_translation: {
    enabled: Boolean,
  },
  modlog_channel: String,
  max_warn: {
    action: {
      type: String,
      enum: ["TIMEOUT", "KICK", "BAN"],
      default: "KICK",
    },
    limit: { type: Number, default: 5 },
  },
  counters: [
    {
      _id: false,
      counter_type: String,
      name: String,
      channel_id: String,
    },
  ],
  welcome: {
    enabled: Boolean,
    channel: String,
    channels: [String],
    content: String,
    auto_delete: {
      enabled: Boolean,
      delay: { type: Number, default: 10 },
    },
    embed: {
      enabled: Boolean,
      description: String,
      color: String,
      thumbnail: Boolean,
      footer: String,
      image: String,
    },
  },
  farewell: {
    enabled: Boolean,
    channel: String,
    content: String,
    embed: {
      description: String,
      color: String,
      thumbnail: Boolean,
      footer: String,
      image: String,
    },
  },
  autorole: {
    humans: [String],
    bots: [String],
  },
  suggestions: {
    enabled: Boolean,
    channel_id: String,
    approved_channel: String,
    rejected_channel: String,
    staff_roles: [String],
  },
  antinuke: {
    enabled: Boolean,
    log_channel: String,
    whitelist: [String],
    punishment: { type: String, enum: ["BAN", "KICK", "STRIP_ROLES"], default: "BAN" },
    anti_ban: {
      enabled: Boolean,
      limit: { type: Number, default: 3 },
      timeframe: { type: Number, default: 10 },
    },
    anti_kick: {
      enabled: Boolean,
      limit: { type: Number, default: 3 },
      timeframe: { type: Number, default: 10 },
    },
    anti_role_create: {
      enabled: Boolean,
      limit: { type: Number, default: 3 },
      timeframe: { type: Number, default: 10 },
    },
    anti_role_delete: {
      enabled: Boolean,
      limit: { type: Number, default: 3 },
      timeframe: { type: Number, default: 10 },
    },
    anti_channel_create: {
      enabled: Boolean,
      limit: { type: Number, default: 3 },
      timeframe: { type: Number, default: 10 },
    },
    anti_channel_delete: {
      enabled: Boolean,
      limit: { type: Number, default: 3 },
      timeframe: { type: Number, default: 10 },
    },
    anti_webhook: {
      enabled: Boolean,
      limit: { type: Number, default: 3 },
      timeframe: { type: Number, default: 10 },
    },
    anti_bot: {
      enabled: Boolean,
      action: { type: String, enum: ["KICK", "BAN"], default: "KICK" },
    },
    anti_server_update: {
      enabled: Boolean,
    },
    anti_emoji_delete: {
      enabled: Boolean,
      limit: { type: Number, default: 3 },
      timeframe: { type: Number, default: 10 },
    },
    anti_prune: {
      enabled: Boolean,
    },
  },
  // Logging System
  logging: {
    enabled: Boolean,
    channel_logs: {
      enabled: Boolean,
      channel: String,
      events: {
        create: { type: Boolean, default: true },
        delete: { type: Boolean, default: true },
        update: { type: Boolean, default: true },
      },
    },
    member_logs: {
      enabled: Boolean,
      channel: String,
      events: {
        join: { type: Boolean, default: true },
        leave: { type: Boolean, default: true },
        role_add: { type: Boolean, default: true },
        role_remove: { type: Boolean, default: true },
        nickname: { type: Boolean, default: true },
      },
    },
    message_logs: {
      enabled: Boolean,
      channel: String,
      events: {
        delete: { type: Boolean, default: true },
        bulk_delete: { type: Boolean, default: true },
        edit: { type: Boolean, default: true },
      },
      ignore_channels: [String],
    },
    mod_logs: {
      enabled: Boolean,
      channel: String,
      events: {
        ban: { type: Boolean, default: true },
        unban: { type: Boolean, default: true },
        kick: { type: Boolean, default: true },
        timeout: { type: Boolean, default: true },
        warn: { type: Boolean, default: true },
      },
    },
    role_logs: {
      enabled: Boolean,
      channel: String,
      events: {
        create: { type: Boolean, default: true },
        delete: { type: Boolean, default: true },
        update: { type: Boolean, default: true },
      },
    },
  },
  // Global bot settings (stored with _id: "GLOBAL_SETTINGS")
  developers: [String],
  giveaway_reaction: String, // Custom reaction emoji for giveaways
});

const Model = mongoose.model("guild", Schema);

module.exports = {
  /**
   * @param {import('discord.js').Guild} guild
   */
  getSettings: async (guild) => {
    if (!guild) throw new Error("Guild is undefined");
    if (!guild.id) throw new Error("Guild Id is undefined");

    const cached = cache.get(guild.id);
    if (cached) return cached;

    let guildData = await Model.findById(guild.id);
    if (!guildData) {
      // save owner details
      guild
        .fetchOwner()
        .then(async (owner) => {
          const userDb = await getUser(owner);
          await userDb.save();
        })
        .catch((ex) => {});

      // create a new guild model
      guildData = new Model({
        _id: guild.id,
        data: {
          name: guild.name,
          region: guild.preferredLocale,
          owner: guild.ownerId,
          joinedAt: guild.joinedAt,
        },
        developers: [], // Initialize developers as an empty array
      });

      await guildData.save();
    }

    // MIGRATION: Handle legacy data formats for backwards compatibility
    let needsSave = false;

    // Migrate autorole from String to Object
    if (guildData.autorole && typeof guildData.autorole === 'string') {
      guildData.autorole = {
        humans: [guildData.autorole],
        bots: []
      };
      needsSave = true;
    } else if (!guildData.autorole) {
      guildData.autorole = { humans: [], bots: [] };
    }

    // Migrate automod.anti_spam from Boolean to Object
    if (guildData.automod) {
      if (typeof guildData.automod.anti_spam === 'boolean') {
        const wasEnabled = guildData.automod.anti_spam;
        guildData.automod.anti_spam = {
          enabled: wasEnabled,
          threshold: 5,
          timeframe: 5
        };
        needsSave = true;
      } else if (!guildData.automod.anti_spam) {
        guildData.automod.anti_spam = {
          enabled: false,
          threshold: 5,
          timeframe: 5
        };
      }

      // Initialize new automod fields if missing
      if (!guildData.automod.anti_badwords) {
        guildData.automod.anti_badwords = {
          enabled: false,
          keywords: [],
          action: "DELETE"
        };
      }
      if (!guildData.automod.anti_zalgo) {
        guildData.automod.anti_zalgo = {
          enabled: false,
          threshold: 50
        };
      }
      if (!guildData.automod.anti_caps) {
        guildData.automod.anti_caps = {
          enabled: false,
          threshold: 70,
          min_length: 10
        };
      }
    }

    // Initialize welcome.auto_delete if missing
    if (guildData.welcome && !guildData.welcome.auto_delete) {
      guildData.welcome.auto_delete = {
        enabled: false,
        delay: 10
      };
    }

    // Initialize logging if missing
    if (!guildData.logging) {
      guildData.logging = {
        enabled: false,
        channel_logs: { enabled: false },
        member_logs: { enabled: false },
        message_logs: { enabled: false },
        mod_logs: { enabled: false },
        role_logs: { enabled: false }
      };
    }

    // Save migrations if needed
    if (needsSave) {
      await guildData.save();
    }

    cache.add(guild.id, guildData);
    return guildData;
  },
};