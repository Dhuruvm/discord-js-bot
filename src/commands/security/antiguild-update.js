const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "antiguild-update",
  description: "Configure anti-guild-update protection to log server modifications",
  category: "SECURITY",
  userPermissions: ["Administrator"],
  botPermissions: ["Administrator"],
  command: {
    enabled: true,
    usage: "enable | disable | config",
    minArgsCount: 1,
    aliases: ["antiguildupdate", "antiserver"],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "enable",
        description: "Enable anti-guild-update protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "disable",
        description: "Disable anti-guild-update protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "config",
        description: "View current anti-guild-update configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "enable") {
      const response = await enableAntiGuildUpdate(settings);
      return message.safeReply(response);
    }

    if (subcommand === "disable") {
      const response = await disableAntiGuildUpdate(settings);
      return message.safeReply(response);
    }

    if (subcommand === "config") {
      const response = await showConfig(settings);
      return message.safeReply(response);
    }

    return message.safeReply(
      ContainerBuilder.info(
        "Anti-Guild-Update Protection",
        `**Available Commands:**\n\n\`${data.prefix}antiguild-update enable\` - Enable protection\n\`${data.prefix}antiguild-update disable\` - Disable protection\n\`${data.prefix}antiguild-update config\` - View configuration`,
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
      response = await enableAntiGuildUpdate(settings);
    } else if (subcommand === "disable") {
      response = await disableAntiGuildUpdate(settings);
    } else if (subcommand === "config") {
      response = await showConfig(settings);
    }

    await interaction.editReply(response);
  },
};

async function enableAntiGuildUpdate(settings) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.anti_server_update) {
    settings.antinuke.anti_server_update = { enabled: true };
  } else {
    settings.antinuke.anti_server_update.enabled = true;
  }
  
  settings.antinuke.enabled = true;
  await settings.save();

  return ContainerBuilder.success(
    "Anti-Guild-Update Enabled",
    `<:success:1424072640829722745> **Anti-guild-update protection is now active**\n\nAll server modifications will be logged to your antinuke log channel.\n\n*This helps track unauthorized server changes*`,
    0x00FF00
  );
}

async function disableAntiGuildUpdate(settings) {
  if (!settings.antinuke?.anti_server_update?.enabled) {
    return ContainerBuilder.info("Already Disabled", "Anti-guild-update protection is not currently active", 0xFFA500);
  }

  settings.antinuke.anti_server_update.enabled = false;
  await settings.save();

  return ContainerBuilder.warning(
    "Anti-Guild-Update Disabled",
    "🛑 **Anti-guild-update protection has been disabled**\n\nServer modifications will no longer be logged",
    0xFF6B00
  );
}

async function showConfig(settings) {
  const config = settings.antinuke?.anti_server_update || { enabled: false };
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("# 🏰 Anti-Guild-Update Configuration"));
  components.push(ContainerBuilder.createSeparator());
  
  const status = config.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  components.push(ContainerBuilder.createTextDisplay(`**Status:** ${status}`));
  components.push(ContainerBuilder.createTextDisplay(`**Function:** Logs server name, icon, and banner changes`));
  
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
