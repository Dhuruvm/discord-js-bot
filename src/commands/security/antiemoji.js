const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "antiemoji",
  description: "Configure anti-emoji protection to prevent mass emoji deletion",
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
        description: "Enable anti-emoji protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "disable",
        description: "Disable anti-emoji protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "limit",
        description: "Set the emoji deletion limit",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "Max emoji deletions in 10 seconds (1-10)",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
            maxValue: 10,
          },
        ],
      },
      {
        name: "config",
        description: "View current anti-emoji configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "enable") {
      const response = await enableAntiEmoji(settings);
      return message.safeReply(response);
    }

    if (subcommand === "disable") {
      const response = await disableAntiEmoji(settings);
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
        "Anti-Emoji Protection",
        `**Available Commands:**\n\n\`${data.prefix}antiemoji enable\` - Enable protection\n\`${data.prefix}antiemoji disable\` - Disable protection\n\`${data.prefix}antiemoji limit <1-10>\` - Set emoji limit\n\`${data.prefix}antiemoji config\` - View configuration`,
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
      response = await enableAntiEmoji(settings);
    } else if (subcommand === "disable") {
      response = await disableAntiEmoji(settings);
    } else if (subcommand === "limit") {
      const limit = interaction.options.getInteger("amount");
      response = await setLimit(settings, limit);
    } else if (subcommand === "config") {
      response = await showConfig(settings);
    }

    await interaction.editReply(response);
  },
};

async function enableAntiEmoji(settings) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_emoji_delete) {
    settings.antinuke.anti_emoji_delete = { enabled: true, limit: 3, timeframe: 10 };
  } else {
    settings.antinuke.anti_emoji_delete.enabled = true;
  }
  
  settings.antinuke.enabled = true;
  await settings.save();

  return ContainerBuilder.success(
    "Anti-Emoji Enabled",
    `<:success:1424072640829722745> **Anti-emoji protection is now active**\n\n**Limit:** ${settings.antinuke.anti_emoji_delete.limit} deletions per 10 seconds\n**Action:** Users exceeding this limit will be ${settings.antinuke.punishment || 'BANNED'}`,
    0x00FF00
  );
}

async function disableAntiEmoji(settings) {
  if (!settings.antinuke?.anti_emoji_delete?.enabled) {
    return ContainerBuilder.info("Already Disabled", "Anti-emoji protection is not currently active", 0xFFA500);
  }

  settings.antinuke.anti_emoji_delete.enabled = false;
  await settings.save();

  return ContainerBuilder.warning(
    "Anti-Emoji Disabled",
    "🛑 **Anti-emoji protection has been disabled**\n\nYour server is no longer protected from mass emoji deletion",
    0xFF6B00
  );
}

async function setLimit(settings, limit) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_emoji_delete) settings.antinuke.anti_emoji_delete = {};

  settings.antinuke.anti_emoji_delete.limit = limit;
  settings.antinuke.anti_emoji_delete.timeframe = 10;
  await settings.save();

  return ContainerBuilder.success(
    "Limit Updated",
    `<:success:1424072640829722745> **Emoji deletion limit updated**\n\n**New Limit:** ${limit} deletions per 10 seconds`,
    0x00FF00
  );
}

async function showConfig(settings) {
  const config = settings.antinuke?.anti_emoji_delete || { enabled: false, limit: 3, timeframe: 10 };
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("# 😀 Anti-Emoji Configuration"));
  components.push(ContainerBuilder.createSeparator());
  
  const status = config.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  components.push(ContainerBuilder.createTextDisplay(`**Status:** ${status}`));
  components.push(ContainerBuilder.createTextDisplay(`**Deletion Limit:** ${config.limit} per ${config.timeframe} seconds`));
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
