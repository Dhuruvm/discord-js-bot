const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "antiban",
  description: "Configure anti-ban protection to prevent mass bans",
  category: "SECURITY",
  userPermissions: ["Administrator"],
  botPermissions: ["Administrator"],
  command: {
    enabled: true,
    usage: "enable | disable | config | limit <number>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "enable",
        description: "Enable anti-ban protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "disable",
        description: "Disable anti-ban protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "limit",
        description: "Set the ban limit before action",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "Max bans allowed in 10 seconds (1-10)",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
            maxValue: 10,
          },
        ],
      },
      {
        name: "config",
        description: "View current anti-ban configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "enable") {
      const response = await enableAntiBan(settings);
      return message.safeReply(response);
    }

    if (subcommand === "disable") {
      const response = await disableAntiBan(settings);
      return message.safeReply(response);
    }

    if (subcommand === "limit") {
      const limit = parseInt(args[1]);
      if (isNaN(limit) || limit < 1 || limit > 10) {
        return message.safeReply(
          ContainerBuilder.error("Invalid Limit", "Please provide a limit between 1 and 10", 0xFF0000)
        );
      }
      const response = await setLimit(settings, limit);
      return message.safeReply(response);
    }

    if (subcommand === "config") {
      const response = await showConfig(settings);
      return message.safeReply(response);
    }

    return message.safeReply(
      ContainerBuilder.info(
        "Anti-Ban Protection",
        `**Available Commands:**\n\n\`${data.prefix}antiban enable\` - Enable protection\n\`${data.prefix}antiban disable\` - Disable protection\n\`${data.prefix}antiban limit <1-10>\` - Set ban limit\n\`${data.prefix}antiban config\` - View configuration`,
        0x5865F2
      )
    );
  },

  async interactionRun(interaction, data) {
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;
    if (subcommand === "enable") {
      response = await enableAntiBan(settings);
    } else if (subcommand === "disable") {
      response = await disableAntiBan(settings);
    } else if (subcommand === "limit") {
      const limit = interaction.options.getInteger("amount");
      response = await setLimit(settings, limit);
    } else if (subcommand === "config") {
      response = await showConfig(settings);
    }

    await interaction.editReply(response);
  },
};

async function enableAntiBan(settings) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_ban) {
    settings.antinuke.anti_ban = { enabled: true, limit: 3, timeframe: 10 };
  } else {
    settings.antinuke.anti_ban.enabled = true;
  }
  
  // Enable main antinuke if not already
  settings.antinuke.enabled = true;
  await settings.save();

  return ContainerBuilder.success(
    "Anti-Ban Enabled",
    `<:success:1424072640829722745> **Anti-ban protection is now active**\n\n**Limit:** ${settings.antinuke.anti_ban.limit} bans per 10 seconds\n**Action:** Users exceeding this limit will be ${settings.antinuke.punishment || 'BANNED'}`,
    0x00FF00
  );
}

async function disableAntiBan(settings) {
  if (!settings.antinuke?.anti_ban?.enabled) {
    return ContainerBuilder.info("Already Disabled", "Anti-ban protection is not currently active", 0xFFA500);
  }

  settings.antinuke.anti_ban.enabled = false;
  await settings.save();

  return ContainerBuilder.warning(
    "Anti-Ban Disabled",
    "🛑 **Anti-ban protection has been disabled**\n\nYour server is no longer protected from mass bans",
    0xFF6B00
  );
}

async function setLimit(settings, limit) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_ban) settings.antinuke.anti_ban = {};

  settings.antinuke.anti_ban.limit = limit;
  settings.antinuke.anti_ban.timeframe = 10;
  await settings.save();

  return ContainerBuilder.success(
    "Limit Updated",
    `<:success:1424072640829722745> **Ban limit updated**\n\n**New Limit:** ${limit} bans per 10 seconds`,
    0x00FF00
  );
}

async function showConfig(settings) {
  const config = settings.antinuke?.anti_ban || { enabled: false, limit: 3, timeframe: 10 };
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("# 🚫 Anti-Ban Configuration"));
  components.push(ContainerBuilder.createSeparator());
  
  const status = config.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  components.push(ContainerBuilder.createTextDisplay(`**Status:** ${status}`));
  components.push(ContainerBuilder.createTextDisplay(`**Ban Limit:** ${config.limit} bans per ${config.timeframe} seconds`));
  components.push(ContainerBuilder.createTextDisplay(`**Punishment:** ${settings.antinuke?.punishment || 'BAN'}`));
  
  return {
    flags: 1 << 15,
    components: [
      {
        type: 17,
        accent_color: config.enabled ? 0x00FF00 : 0xFF0000,
        components: components
      }
    ]
  };
}
