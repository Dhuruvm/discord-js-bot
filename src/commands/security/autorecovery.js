const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "autorecovery",
  description: "Configure automatic server recovery features",
  category: "SECURITY",
  userPermissions: ["Administrator"],
  botPermissions: ["Administrator"],
  command: {
    enabled: true,
    usage: "enable | disable | config | channels | roles",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "enable",
        description: "Enable auto-recovery features",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "disable",
        description: "Disable auto-recovery features",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "channels",
        description: "Toggle channel recovery",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "enabled",
            description: "Enable channel recovery",
            type: ApplicationCommandOptionType.Boolean,
            required: true,
          },
        ],
      },
      {
        name: "roles",
        description: "Toggle role recovery",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "enabled",
            description: "Enable role recovery",
            type: ApplicationCommandOptionType.Boolean,
            required: true,
          },
        ],
      },
      {
        name: "config",
        description: "View current auto-recovery configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "enable") {
      const response = await enableAutoRecovery(settings);
      return message.safeReply(response);
    }

    if (subcommand === "disable") {
      const response = await disableAutoRecovery(settings);
      return message.safeReply(response);
    }

    if (subcommand === "channels") {
      const enabled = args[1]?.toLowerCase() === "true" || args[1]?.toLowerCase() === "yes";
      const response = await toggleChannels(settings, enabled);
      return message.safeReply(response);
    }

    if (subcommand === "roles") {
      const enabled = args[1]?.toLowerCase() === "true" || args[1]?.toLowerCase() === "yes";
      const response = await toggleRoles(settings, enabled);
      return message.safeReply(response);
    }

    if (subcommand === "config") {
      const response = await showConfig(settings);
      return message.safeReply(response);
    }

    return message.safeReply(
      ContainerBuilder.info(
        "Auto-Recovery System",
        `**Available Commands:**\n\n\`${data.prefix}autorecovery enable\` - Enable all recovery\n\`${data.prefix}autorecovery disable\` - Disable all recovery\n\`${data.prefix}autorecovery channels <true/false>\` - Toggle channel recovery\n\`${data.prefix}autorecovery roles <true/false>\` - Toggle role recovery\n\`${data.prefix}autorecovery config\` - View configuration`,
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
      response = await enableAutoRecovery(settings);
    } else if (subcommand === "disable") {
      response = await disableAutoRecovery(settings);
    } else if (subcommand === "channels") {
      const enabled = interaction.options.getBoolean("enabled");
      response = await toggleChannels(settings, enabled);
    } else if (subcommand === "roles") {
      const enabled = interaction.options.getBoolean("enabled");
      response = await toggleRoles(settings, enabled);
    } else if (subcommand === "config") {
      response = await showConfig(settings);
    }

    await interaction.editReply(response);
  },
};

async function enableAutoRecovery(settings) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.auto_recovery) {
    settings.antinuke.auto_recovery = { 
      enabled: true, 
      recover_channels: true,
      recover_roles: true
    };
  } else {
    settings.antinuke.auto_recovery.enabled = true;
    settings.antinuke.auto_recovery.recover_channels = true;
    settings.antinuke.auto_recovery.recover_roles = true;
  }
  
  settings.antinuke.enabled = true;
  await settings.save();

  return ContainerBuilder.success(
    "Auto-Recovery Enabled",
    `<:success:1424072640829722745> **Auto-recovery is now active**\n\n**Features Enabled:**\n• Channel recovery\n• Role recovery\n\n*The bot will attempt to restore deleted channels and roles*`,
    0x00FF00
  );
}

async function disableAutoRecovery(settings) {
  if (!settings.antinuke?.auto_recovery?.enabled) {
    return ContainerBuilder.info("Already Disabled", "Auto-recovery is not currently active", 0xFFA500);
  }

  settings.antinuke.auto_recovery.enabled = false;
  await settings.save();

  return ContainerBuilder.warning(
    "Auto-Recovery Disabled",
    "🛑 **Auto-recovery has been disabled**\n\nDeleted items will not be automatically restored",
    0xFF6B00
  );
}

async function toggleChannels(settings, enabled) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.auto_recovery) {
    settings.antinuke.auto_recovery = { enabled: true, recover_channels: enabled, recover_roles: false };
  } else {
    settings.antinuke.auto_recovery.recover_channels = enabled;
    settings.antinuke.auto_recovery.enabled = true;
  }
  
  await settings.save();

  return ContainerBuilder.success(
    "Channel Recovery Updated",
    `<:success:1424072640829722745> **Channel recovery ${enabled ? 'enabled' : 'disabled'}**\n\n${enabled ? 'Deleted channels will be automatically restored' : 'Deleted channels will not be restored'}`,
    0x00FF00
  );
}

async function toggleRoles(settings, enabled) {
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.auto_recovery) {
    settings.antinuke.auto_recovery = { enabled: true, recover_channels: false, recover_roles: enabled };
  } else {
    settings.antinuke.auto_recovery.recover_roles = enabled;
    settings.antinuke.auto_recovery.enabled = true;
  }
  
  await settings.save();

  return ContainerBuilder.success(
    "Role Recovery Updated",
    `<:success:1424072640829722745> **Role recovery ${enabled ? 'enabled' : 'disabled'}**\n\n${enabled ? 'Deleted roles will be automatically restored' : 'Deleted roles will not be restored'}`,
    0x00FF00
  );
}

async function showConfig(settings) {
  const config = settings.antinuke?.auto_recovery || { 
    enabled: false, 
    recover_channels: false,
    recover_roles: false
  };
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("# 🔄 Auto-Recovery Configuration"));
  components.push(ContainerBuilder.createSeparator());
  
  const status = config.enabled ? "<:success:1424072640829722745> **ENABLED**" : "<:error:1424072711671382076> **DISABLED**";
  components.push(ContainerBuilder.createTextDisplay(`**Status:** ${status}`));
  
  const channelStatus = config.recover_channels ? "<:success:1424072640829722745> **ON**" : "<:error:1424072711671382076> **OFF**";
  const roleStatus = config.recover_roles ? "<:success:1424072640829722745> **ON**" : "<:error:1424072711671382076> **OFF**";
  
  components.push(ContainerBuilder.createSeparator());
  components.push(ContainerBuilder.createTextDisplay("**Recovery Modules:**"));
  components.push(ContainerBuilder.createTextDisplay(`• Channel Recovery: ${channelStatus}`));
  components.push(ContainerBuilder.createTextDisplay(`• Role Recovery: ${roleStatus}`));
  
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
