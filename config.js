module.exports = {
  DEVELOPER: "Blackbit Studio", // Bot developer credit
  OWNER_IDS: ["1354287041772392478"], // Bot owner ID's
  SUPPORT_SERVER: "https://discord.gg/mvusstXJS", // Your bot support server
  PREFIX_COMMANDS: {
    ENABLED: true, // Enable/Disable prefix commands
    DEFAULT_PREFIX: "!", // Default prefix for the bot
  },
  INTERACTIONS: {
    SLASH: false, // Should the interactions be enabled
    CONTEXT: false, // Should contexts be enabled
    GLOBAL: false, // Should the interactions be registered globally
    TEST_GUILD_ID: "xxxxxxxxxxx", // Guild ID where the interactions should be registered. [** Test you commands here first **]
  },
  EMBED_COLORS: {
    BOT_EMBED: "#FFFFFF",
    TRANSPARENT: "#FFFFFF",
    SUCCESS: "#FFFFFF",
    ERROR: "#FFFFFF",
    WARNING: "#FFFFFF",
    PRIMARY: "#FFFFFF",
    SECONDARY: "#FFFFFF",
  },
  CACHE_SIZE: {
    GUILDS: 100,
    USERS: 10000,
    MEMBERS: 10000,
  },
  MESSAGES: {
    API_ERROR: "Unexpected Backend Error! Try again later or contact support server",
  },

  // PLUGINS

  AUTOMOD: {
    ENABLED: true,
    LOG_EMBED: "#FFFFFF",
    DM_EMBED: "#FFFFFF",
  },

  DASHBOARD: {
    enabled: false, // enable or disable dashboard
    baseURL: "http://localhost:5000", // base url
    failureURL: "http://localhost:5000", // failure redirect url
    port: "5000", // port to run the bot on
  },

  ECONOMY: {
    ENABLED: true,
    CURRENCY: "₪",
    DAILY_COINS: 100, // coins to be received by daily command
    MIN_BEG_AMOUNT: 100, // minimum coins to be received when beg command is used
    MAX_BEG_AMOUNT: 2500, // maximum coins to be received when beg command is used
  },

  MUSIC: {
    ENABLED: false,
    IDLE_TIME: 60, // Time in seconds before the bot disconnects from an idle voice channel
    MAX_SEARCH_RESULTS: 5,
    DEFAULT_SOURCE: "SC", // YT = Youtube, YTM = Youtube Music, SC = SoundCloud
    // Add any number of lavalink nodes here
    // Refer to https://github.com/freyacodes/Lavalink to host your own lavalink server
    LAVALINK_NODES: [
      {
        host: "localhost",
        port: 2333,
        password: "youshallnotpass",
        id: "Local Node",
        secure: false,
      },
    ],
  },

  GIVEAWAYS: {
    ENABLED: true,
    REACTION: "🎁",
    START_EMBED: "#FFFFFF",
    END_EMBED: "#FFFFFF",
  },

  IMAGE: {
    ENABLED: true,
    BASE_API: "https://strangeapi.hostz.me/api",
  },

  INVITE: {
    ENABLED: true,
  },

  MODERATION: {
    ENABLED: true,
    EMBED_COLORS: {
      TIMEOUT: "#FFFFFF",
      UNTIMEOUT: "#FFFFFF",
      KICK: "#FFFFFF",
      SOFTBAN: "#FFFFFF",
      BAN: "#FFFFFF",
      UNBAN: "#FFFFFF",
      VMUTE: "#FFFFFF",
      VUNMUTE: "#FFFFFF",
      DEAFEN: "#FFFFFF",
      UNDEAFEN: "#FFFFFF",
      DISCONNECT: "#FFFFFF",
      MOVE: "#FFFFFF",
    },
  },

  PRESENCE: {
    ENABLED: true, // Whether or not the bot should update its status
    STATUS: "online", // The bot's status [online, idle, dnd, invisible]
    TYPE: "WATCHING", // Status type for the bot [ CUSTOM | PLAYING | LISTENING | WATCHING | COMPETING ]
    // Your bot status message (note: in custom status type you won't have "Playing", "Listening", "Competing" prefix)
    MESSAGE: ["{members} members in {servers} servers", "Cybork is here to help!", "Use /help for commands"],
  },

  STATS: {
    ENABLED: true,
    XP_COOLDOWN: 5, // Cooldown in seconds between messages
    DEFAULT_LVL_UP_MSG: "{member:tag}, You just advanced to **Level {level}**",
  },

  SUGGESTIONS: {
    ENABLED: true, // Should the suggestion system be enabled
    EMOJI: {
      UP_VOTE: "⬆️",
      DOWN_VOTE: "⬇️",
    },
    DEFAULT_EMBED: "#FFFFFF",
    APPROVED_EMBED: "#FFFFFF",
    DENIED_EMBED: "#FFFFFF",
  },

  TICKET: {
    ENABLED: true,
    CREATE_EMBED: "#FFFFFF",
    CLOSE_EMBED: "#FFFFFF",
  },

  // Command Categories
  COMMAND_CATEGORIES: {
    FUN: {
      name: "Fun",
      image: "https://icons.iconarchive.com/icons/flameia/aqua-smiles/64/make-fun-icon.png",
      emoji: "😂",
    },
    GRAPHICS: {
      name: "Graphics",
      image: "https://icons.iconarchive.com/icons/graphicloads/100-flat/64/paint-icon.png",
      emoji: "🎨",
    },
    IMAGE: {
      name: "Image",
      image: "https://icons.iconarchive.com/icons/dapino/summer-holiday/64/photo-icon.png",
      emoji: "🖼️",
    },
  },
};