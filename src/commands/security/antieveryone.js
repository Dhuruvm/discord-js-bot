const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "antieveryone",
  description: "Configure anti-everyone protection to prevent @everyone/@here abuse",
  category: "SECURITY",
  userPermissions: ["Administrator"],
  botPermissions: ["Administrator"],
  command: {
    enabled: true,
    usage: "enable | disable | config",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "enable",
        description: "Enable anti-everyone protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "disable",
        description: "Disable anti-everyone protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "config",
        description: "View current anti-everyone configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "enable") {
      const response = await enableAntiEveryone(settings);
      return message.safeReply(response);
    }

    if (subcommand === "disable") {
      const response = await disableAntiEveryone(settings);
      return message.safeReply(response);
    }

    if (subcommand === "config") {
      const response = await showConfig(settings);
      return message.safeReply(response);
    }

    return message.safeReply(
      ContainerBuilder.info(
        "Anti-Everyone Protection",
        `**Available Commands:**\n\n\`${data.prefix}antieveryone enable\` - Enable protection\n\`${data.prefix}antieveryone disable\` - Disable protection\n\`${data.prefix}antieveryone config\` - View configuration`,
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
      response = await enableAntiEveryone(settings);
    } else if (subcommand === "disable") {
      response = await disableAntiEveryone(settings);
    } else if (subcommand === "config") {
      response = await showConfig(settings);
    }

    await interaction.editReply(response);
  },
};

async function enableAntiEveryone(settings) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_everyone) {
    settings.antinuke.anti_everyone = { enabled: true };
  } else {
    settings.antinuke.anti_everyone.enabled = true;
  }
  
  settings.antinuke.enabled = true;
  await settings.save();

  return ContainerBuilder.success(
    "Anti-Everyone Enabled",
    `<:success:1424072640829722745> **Anti-everyone protection is now active**\n\n@everyone and @here mentions will be logged and monitored.\n\n*Note: This is a monitoring feature. Configure automod for automatic deletion.*`,
    0x00FF00
  );
}

async function disableAntiEveryone(settings) {
  if (!settings.antinuke?.anti_everyone?.enabled) {
    return ContainerBuilder.info("Already Disabled", "Anti-everyone protection is not currently active", 0xFFA500);
  }

  settings.antinuke.anti_everyone.enabled = false;
  await settings.save();

  return ContainerBuilder.warning(
    "Anti-Everyone Disabled",
    "🛑 **Anti-everyone protection has been disabled**\n\n@everyone/@here mentions will no longer be monitored",
    0xFF6B00
  );
}

async function showConfig(settings) {
  const config = settings.antinuke?.anti_everyone || { enabled: false };
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("# 📢 Anti-Everyone Configuration"));
  components.push(ContainerBuilder.createSeparator());
  
  const status = config.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  components.push(ContainerBuilder.createTextDisplay(`**Status:** ${status}`));
  components.push(ContainerBuilder.createTextDisplay(`**Function:** Monitors @everyone and @here usage`));
  components.push(ContainerBuilder.createTextDisplay(`**Tip:** Use automod for automatic message deletion`));
  
  if (settings.antinuke?.log_channel) {
    components.push(ContainerBuilder.createTextDisplay(`**Log Channel:** <#${settings.antinuke.log_channel}>`));
  } else {
    components.push(ContainerBuilder.createTextDisplay(`**Log Channel:** Not configured`));
  }
  
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
