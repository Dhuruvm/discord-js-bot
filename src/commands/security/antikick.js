const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "antikick",
  description: "Configure anti-kick protection to prevent mass kicks",
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
        description: "Enable anti-kick protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "disable",
        description: "Disable anti-kick protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "limit",
        description: "Set the kick limit before action",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "Max kicks allowed in 10 seconds (1-10)",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
            maxValue: 10,
          },
        ],
      },
      {
        name: "config",
        description: "View current anti-kick configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "enable") {
      const response = await enableAntiKick(settings);
      return message.safeReply(response);
    }

    if (subcommand === "disable") {
      const response = await disableAntiKick(settings);
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
        "Anti-Kick Protection",
        `**Available Commands:**\n\n\`${data.prefix}antikick enable\` - Enable protection\n\`${data.prefix}antikick disable\` - Disable protection\n\`${data.prefix}antikick limit <1-10>\` - Set kick limit\n\`${data.prefix}antikick config\` - View configuration`,
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
      response = await enableAntiKick(settings);
    } else if (subcommand === "disable") {
      response = await disableAntiKick(settings);
    } else if (subcommand === "limit") {
      const limit = interaction.options.getInteger("amount");
      response = await setLimit(settings, limit);
    } else if (subcommand === "config") {
      response = await showConfig(settings);
    }

    await interaction.editReply(response);
  },
};

async function enableAntiKick(settings) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_kick) {
    settings.antinuke.anti_kick = { enabled: true, limit: 3, timeframe: 10 };
  } else {
    settings.antinuke.anti_kick.enabled = true;
  }
  
  settings.antinuke.enabled = true;
  await settings.save();

  return ContainerBuilder.success(
    "Anti-Kick Enabled",
    `<:success:1424072640829722745> **Anti-kick protection is now active**\n\n**Limit:** ${settings.antinuke.anti_kick.limit} kicks per 10 seconds\n**Action:** Users exceeding this limit will be ${settings.antinuke.punishment || 'BANNED'}`,
    0x00FF00
  );
}

async function disableAntiKick(settings) {
  if (!settings.antinuke?.anti_kick?.enabled) {
    return ContainerBuilder.info("Already Disabled", "Anti-kick protection is not currently active", 0xFFA500);
  }

  settings.antinuke.anti_kick.enabled = false;
  await settings.save();

  return ContainerBuilder.warning(
    "Anti-Kick Disabled",
    "🛑 **Anti-kick protection has been disabled**\n\nYour server is no longer protected from mass kicks",
    0xFF6B00
  );
}

async function setLimit(settings, limit) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_kick) settings.antinuke.anti_kick = {};

  settings.antinuke.anti_kick.limit = limit;
  settings.antinuke.anti_kick.timeframe = 10;
  await settings.save();

  return ContainerBuilder.success(
    "Limit Updated",
    `<:success:1424072640829722745> **Kick limit updated**\n\n**New Limit:** ${limit} kicks per 10 seconds`,
    0x00FF00
  );
}

async function showConfig(settings) {
  const config = settings.antinuke?.anti_kick || { enabled: false, limit: 3, timeframe: 10 };
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("# 👢 Anti-Kick Configuration"));
  components.push(ContainerBuilder.createSeparator());
  
  const status = config.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  components.push(ContainerBuilder.createTextDisplay(`**Status:** ${status}`));
  components.push(ContainerBuilder.createTextDisplay(`**Kick Limit:** ${config.limit} kicks per ${config.timeframe} seconds`));
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
