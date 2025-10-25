const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "antirole",
  description: "Configure anti-role protection to prevent mass role creation/deletion",
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
        description: "Enable anti-role protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "disable",
        description: "Disable anti-role protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "limit",
        description: "Set the role action limit",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "Max role actions in 10 seconds (1-10)",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
            maxValue: 10,
          },
        ],
      },
      {
        name: "config",
        description: "View current anti-role configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "enable") {
      const response = await enableAntiRole(settings);
      return message.safeReply(response);
    }

    if (subcommand === "disable") {
      const response = await disableAntiRole(settings);
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
        "Anti-Role Protection",
        `**Available Commands:**\n\n\`${data.prefix}antirole enable\` - Enable protection\n\`${data.prefix}antirole disable\` - Disable protection\n\`${data.prefix}antirole limit <1-10>\` - Set role limit\n\`${data.prefix}antirole config\` - View configuration`,
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
      response = await enableAntiRole(settings);
    } else if (subcommand === "disable") {
      response = await disableAntiRole(settings);
    } else if (subcommand === "limit") {
      const limit = interaction.options.getInteger("amount");
      response = await setLimit(settings, limit);
    } else if (subcommand === "config") {
      response = await showConfig(settings);
    }

    await interaction.editReply(response);
  },
};

async function enableAntiRole(settings) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_role_create) {
    settings.antinuke.anti_role_create = { enabled: true, limit: 3, timeframe: 10 };
  } else {
    settings.antinuke.anti_role_create.enabled = true;
  }
  if (!settings.antinuke.anti_role_delete) {
    settings.antinuke.anti_role_delete = { enabled: true, limit: 3, timeframe: 10 };
  } else {
    settings.antinuke.anti_role_delete.enabled = true;
  }
  
  settings.antinuke.enabled = true;
  await settings.save();

  return ContainerBuilder.success(
    "Anti-Role Enabled",
    `<:success:1424072640829722745> **Anti-role protection is now active**\n\n**Limit:** ${settings.antinuke.anti_role_create.limit} actions per 10 seconds\n**Action:** Users exceeding this limit will be ${settings.antinuke.punishment || 'BANNED'}`,
    0x00FF00
  );
}

async function disableAntiRole(settings) {
  if (!settings.antinuke?.anti_role_create?.enabled && !settings.antinuke?.anti_role_delete?.enabled) {
    return ContainerBuilder.info("Already Disabled", "Anti-role protection is not currently active", 0xFFA500);
  }

  if (settings.antinuke.anti_role_create) settings.antinuke.anti_role_create.enabled = false;
  if (settings.antinuke.anti_role_delete) settings.antinuke.anti_role_delete.enabled = false;
  await settings.save();

  return ContainerBuilder.warning(
    "Anti-Role Disabled",
    "🛑 **Anti-role protection has been disabled**\n\nYour server is no longer protected from mass role actions",
    0xFF6B00
  );
}

async function setLimit(settings, limit) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_role_create) settings.antinuke.anti_role_create = {};
  if (!settings.antinuke.anti_role_delete) settings.antinuke.anti_role_delete = {};

  settings.antinuke.anti_role_create.limit = limit;
  settings.antinuke.anti_role_create.timeframe = 10;
  settings.antinuke.anti_role_delete.limit = limit;
  settings.antinuke.anti_role_delete.timeframe = 10;
  await settings.save();

  return ContainerBuilder.success(
    "Limit Updated",
    `<:success:1424072640829722745> **Role action limit updated**\n\n**New Limit:** ${limit} actions per 10 seconds`,
    0x00FF00
  );
}

async function showConfig(settings) {
  const configCreate = settings.antinuke?.anti_role_create || { enabled: false, limit: 3, timeframe: 10 };
  const configDelete = settings.antinuke?.anti_role_delete || { enabled: false, limit: 3, timeframe: 10 };
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("# 🎭 Anti-Role Configuration"));
  components.push(ContainerBuilder.createSeparator());
  
  const statusCreate = configCreate.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  const statusDelete = configDelete.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  
  components.push(ContainerBuilder.createTextDisplay(`**Role Creation:** ${statusCreate}`));
  components.push(ContainerBuilder.createTextDisplay(`**Role Deletion:** ${statusDelete}`));
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
