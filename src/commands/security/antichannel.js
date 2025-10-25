const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "antichannel",
  description: "Configure anti-channel protection to prevent mass channel creation/deletion",
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
        description: "Enable anti-channel protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "disable",
        description: "Disable anti-channel protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "limit",
        description: "Set the channel action limit",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "Max channel actions in 10 seconds (1-10)",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
            maxValue: 10,
          },
        ],
      },
      {
        name: "config",
        description: "View current anti-channel configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "enable") {
      const response = await enableAntiChannel(settings);
      return message.safeReply(response);
    }

    if (subcommand === "disable") {
      const response = await disableAntiChannel(settings);
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
        "Anti-Channel Protection",
        `**Available Commands:**\n\n\`${data.prefix}antichannel enable\` - Enable protection\n\`${data.prefix}antichannel disable\` - Disable protection\n\`${data.prefix}antichannel limit <1-10>\` - Set channel limit\n\`${data.prefix}antichannel config\` - View configuration`,
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
      response = await enableAntiChannel(settings);
    } else if (subcommand === "disable") {
      response = await disableAntiChannel(settings);
    } else if (subcommand === "limit") {
      const limit = interaction.options.getInteger("amount");
      response = await setLimit(settings, limit);
    } else if (subcommand === "config") {
      response = await showConfig(settings);
    }

    await interaction.editReply(response);
  },
};

async function enableAntiChannel(settings) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_channel_create) {
    settings.antinuke.anti_channel_create = { enabled: true, limit: 3, timeframe: 10 };
  } else {
    settings.antinuke.anti_channel_create.enabled = true;
  }
  if (!settings.antinuke.anti_channel_delete) {
    settings.antinuke.anti_channel_delete = { enabled: true, limit: 3, timeframe: 10 };
  } else {
    settings.antinuke.anti_channel_delete.enabled = true;
  }
  
  settings.antinuke.enabled = true;
  await settings.save();

  return ContainerBuilder.success(
    "Anti-Channel Enabled",
    `<:success:1424072640829722745> **Anti-channel protection is now active**\n\n**Limit:** ${settings.antinuke.anti_channel_create.limit} actions per 10 seconds\n**Action:** Users exceeding this limit will be ${settings.antinuke.punishment || 'BANNED'}`,
    0x00FF00
  );
}

async function disableAntiChannel(settings) {
  if (!settings.antinuke?.anti_channel_create?.enabled && !settings.antinuke?.anti_channel_delete?.enabled) {
    return ContainerBuilder.info("Already Disabled", "Anti-channel protection is not currently active", 0xFFA500);
  }

  if (settings.antinuke.anti_channel_create) settings.antinuke.anti_channel_create.enabled = false;
  if (settings.antinuke.anti_channel_delete) settings.antinuke.anti_channel_delete.enabled = false;
  await settings.save();

  return ContainerBuilder.warning(
    "Anti-Channel Disabled",
    "🛑 **Anti-channel protection has been disabled**\n\nYour server is no longer protected from mass channel actions",
    0xFF6B00
  );
}

async function setLimit(settings, limit) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_channel_create) settings.antinuke.anti_channel_create = {};
  if (!settings.antinuke.anti_channel_delete) settings.antinuke.anti_channel_delete = {};

  settings.antinuke.anti_channel_create.limit = limit;
  settings.antinuke.anti_channel_create.timeframe = 10;
  settings.antinuke.anti_channel_delete.limit = limit;
  settings.antinuke.anti_channel_delete.timeframe = 10;
  await settings.save();

  return ContainerBuilder.success(
    "Limit Updated",
    `<:success:1424072640829722745> **Channel action limit updated**\n\n**New Limit:** ${limit} actions per 10 seconds`,
    0x00FF00
  );
}

async function showConfig(settings) {
  const configCreate = settings.antinuke?.anti_channel_create || { enabled: false, limit: 3, timeframe: 10 };
  const configDelete = settings.antinuke?.anti_channel_delete || { enabled: false, limit: 3, timeframe: 10 };
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("# 📁 Anti-Channel Configuration"));
  components.push(ContainerBuilder.createSeparator());
  
  const statusCreate = configCreate.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  const statusDelete = configDelete.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  
  components.push(ContainerBuilder.createTextDisplay(`**Channel Creation:** ${statusCreate}`));
  components.push(ContainerBuilder.createTextDisplay(`**Channel Deletion:** ${statusDelete}`));
  components.push(ContainerBuilder.createTextDisplay(`**Action Limit:** ${configCreate.limit} per ${configCreate.timeframe} seconds`));
  components.push(ContainerBuilder.createTextDisplay(`**Punishment:** ${settings.antinuke?.punishment || 'BAN'}`));
  
  return {
    flags: 1 << 15,
    components: [
      {
        type: 17,
        accent_color: (configCreate.enabled || configDelete.enabled) ? 0x00FF00 : 0xFF0000,
        components: components
      }
    ]
  };
}
