const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "antibot",
  description: "Configure anti-bot protection to prevent unauthorized bot additions",
  category: "SECURITY",
  userPermissions: ["Administrator"],
  botPermissions: ["Administrator"],
  command: {
    enabled: true,
    usage: "enable | disable | config | action <kick/ban>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "enable",
        description: "Enable anti-bot protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "disable",
        description: "Disable anti-bot protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "action",
        description: "Set action for unauthorized bots",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "type",
            description: "Action to take",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: "Kick", value: "KICK" },
              { name: "Ban", value: "BAN" },
            ],
          },
        ],
      },
      {
        name: "config",
        description: "View current anti-bot configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "enable") {
      const response = await enableAntiBot(settings);
      return message.safeReply(response);
    }

    if (subcommand === "disable") {
      const response = await disableAntiBot(settings);
      return message.safeReply(response);
    }

    if (subcommand === "action") {
      const action = args[1]?.toUpperCase();
      if (!action || !["KICK", "BAN"].includes(action)) {
        return message.safeReply(
          ContainerBuilder.error("Invalid Action", "Please specify either `kick` or `ban`", 0xFF0000)
        );
      }
      const response = await setAction(settings, action);
      return message.safeReply(response);
    }

    if (subcommand === "config") {
      const response = await showConfig(settings);
      return message.safeReply(response);
    }

    return message.safeReply(
      ContainerBuilder.info(
        "Anti-Bot Protection",
        `**Available Commands:**\n\n\`${data.prefix}antibot enable\` - Enable protection\n\`${data.prefix}antibot disable\` - Disable protection\n\`${data.prefix}antibot action <kick/ban>\` - Set action\n\`${data.prefix}antibot config\` - View configuration`,
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
      response = await enableAntiBot(settings);
    } else if (subcommand === "disable") {
      response = await disableAntiBot(settings);
    } else if (subcommand === "action") {
      const action = interaction.options.getString("type");
      response = await setAction(settings, action);
    } else if (subcommand === "config") {
      response = await showConfig(settings);
    }

    await interaction.editReply(response);
  },
};

async function enableAntiBot(settings) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_bot) {
    settings.antinuke.anti_bot = { enabled: true, action: "KICK" };
  } else {
    settings.antinuke.anti_bot.enabled = true;
  }
  
  settings.antinuke.enabled = true;
  await settings.save();

  return ContainerBuilder.success(
    "Anti-Bot Enabled",
    `<:success:1424072640829722745> **Anti-bot protection is now active**\n\n**Action:** Unauthorized bots will be ${settings.antinuke.anti_bot.action === 'KICK' ? 'kicked' : 'banned'}\n\n*Only whitelisted users can add bots*`,
    0x00FF00
  );
}

async function disableAntiBot(settings) {
  if (!settings.antinuke?.anti_bot?.enabled) {
    return ContainerBuilder.info("Already Disabled", "Anti-bot protection is not currently active", 0xFFA500);
  }

  settings.antinuke.anti_bot.enabled = false;
  await settings.save();

  return ContainerBuilder.warning(
    "Anti-Bot Disabled",
    "🛑 **Anti-bot protection has been disabled**\n\nAnyone with permissions can now add bots to the server",
    0xFF6B00
  );
}

async function setAction(settings, action) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_bot) settings.antinuke.anti_bot = {};

  settings.antinuke.anti_bot.action = action;
  await settings.save();

  return ContainerBuilder.success(
    "Action Updated",
    `<:success:1424072640829722745> **Bot action updated**\n\n**New Action:** Unauthorized bots will be ${action === 'KICK' ? 'kicked' : 'banned'}`,
    0x00FF00
  );
}

async function showConfig(settings) {
  const config = settings.antinuke?.anti_bot || { enabled: false, action: "KICK" };
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("# 🤖 Anti-Bot Configuration"));
  components.push(ContainerBuilder.createSeparator());
  
  const status = config.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  components.push(ContainerBuilder.createTextDisplay(`**Status:** ${status}`));
  components.push(ContainerBuilder.createTextDisplay(`**Bot Action:** ${config.action === 'KICK' ? 'Kick' : 'Ban'} unauthorized bots`));
  components.push(ContainerBuilder.createTextDisplay(`**Note:** Only whitelisted users can add bots when enabled`));
  
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
