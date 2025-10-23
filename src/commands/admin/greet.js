const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");
const InteractionHelpers = require("@helpers/InteractionHelpers");
const { buildGreeting } = require("@handlers/greeting");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "greet",
  description: "Configure welcome greeting system",
  category: "GATEWAY",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    aliases: ["welcome"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "channel",
        description: "Manage greeting channels",
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: "add",
            description: "Add a greeting channel",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "channel",
                description: "Channel to send greetings",
                type: ApplicationCommandOptionType.Channel,
                channelTypes: [ChannelType.GuildText],
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remove a greeting channel",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "channel",
                description: "Channel to remove",
                type: ApplicationCommandOptionType.Channel,
                channelTypes: [ChannelType.GuildText],
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: "embed",
        description: "Configure greeting embed",
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: "toggle",
            description: "Enable or disable embed mode",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "enabled",
                description: "Enable embed mode",
                type: ApplicationCommandOptionType.Boolean,
                required: true,
              },
            ],
          },
          {
            name: "message",
            description: "Set embed description message",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "message",
                description: "Embed description (use {variables})",
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
          {
            name: "reset",
            description: "Reset embed settings to default",
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: "autodel",
        description: "Configure auto-delete for greetings",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "enabled",
            description: "Enable auto-delete",
            type: ApplicationCommandOptionType.Boolean,
            required: true,
          },
          {
            name: "delay",
            description: "Seconds before deletion (default: 10)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 5,
            maxValue: 300,
          },
        ],
      },
      {
        name: "message",
        description: "Set plain text greeting message",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message",
            description: "Greeting message (use {variables})",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "config",
        description: "View current greeting configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "test",
        description: "Send a test greeting",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "variables",
        description: "Show available message variables",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "reset",
        description: "Reset all greeting settings",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    
    if (args.length === 0) {
      return message.safeReply(`Usage: \`${data.prefix}greet <subcommand>\`\n\nAvailable subcommands:\n• \`channel add <#channel>\` - Add greeting channel\n• \`channel remove <#channel>\` - Remove greeting channel\n• \`embed toggle <true/false>\` - Toggle embed mode\n• \`embed message <text>\` - Set embed message\n• \`embed reset\` - Reset embed settings\n• \`autodel <true/false> [delay]\` - Configure auto-delete\n• \`message <text>\` - Set plain text message\n• \`config\` - View configuration\n• \`test\` - Send test greeting\n• \`variables\` - Show available variables\n• \`reset\` - Reset all settings`);
    }

    const sub = args[0].toLowerCase();
    let response;

    if (sub === "channel") {
      const action = args[1]?.toLowerCase();
      if (action === "add") {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
        if (!channel) return message.safeReply("Please provide a valid channel");
        response = await addChannel({ guild: message.guild }, channel, settings);
      } else if (action === "remove") {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
        if (!channel) return message.safeReply("Please provide a valid channel");
        response = await removeChannel(message, channel, settings);
      } else {
        return message.safeReply(`Invalid channel action. Use: \`${data.prefix}greet channel <add/remove> <#channel>\``);
      }
    } else if (sub === "embed") {
      const action = args[1]?.toLowerCase();
      if (action === "toggle") {
        const enabled = args[2]?.toLowerCase() === "true" || args[2]?.toLowerCase() === "yes";
        response = await toggleEmbed(settings, enabled);
      } else if (action === "message") {
        const msg = args.slice(2).join(" ");
        if (!msg) return message.safeReply("Please provide a message");
        response = await setEmbedMessage(settings, msg);
      } else if (action === "reset") {
        response = await resetEmbed(settings);
      } else {
        return message.safeReply(`Invalid embed action. Use: \`${data.prefix}greet embed <toggle/message/reset>\``);
      }
    } else if (sub === "autodel") {
      const enabled = args[1]?.toLowerCase() === "true" || args[1]?.toLowerCase() === "yes";
      const delay = parseInt(args[2]) || 10;
      response = await setAutoDelete(settings, enabled, delay);
    } else if (sub === "message") {
      const msg = args.slice(1).join(" ");
      if (!msg) return message.safeReply("Please provide a message");
      response = await setMessage(settings, msg);
    } else if (sub === "config") {
      response = await showConfig({ guild: message.guild }, settings);
    } else if (sub === "test") {
      response = await sendTest({ member: message.member, guild: message.guild }, settings);
    } else if (sub === "variables") {
      response = showVariables();
    } else if (sub === "reset") {
      response = await resetGreeting(settings);
    } else {
      return message.safeReply(`Unknown subcommand. Use \`${data.prefix}greet\` to see available options.`);
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;

    if (group === "channel") {
      if (sub === "add") {
        const channel = interaction.options.getChannel("channel");
        response = await addChannel(interaction, channel, settings);
      } else if (sub === "remove") {
        const channel = interaction.options.getChannel("channel");
        response = await removeChannel(interaction, channel, settings);
      }
    } else if (group === "embed") {
      if (sub === "toggle") {
        const enabled = interaction.options.getBoolean("enabled");
        response = await toggleEmbed(settings, enabled);
      } else if (sub === "message") {
        const message = interaction.options.getString("message");
        response = await setEmbedMessage(settings, message);
      } else if (sub === "reset") {
        response = await resetEmbed(settings);
      }
    } else {
      if (sub === "autodel") {
        const enabled = interaction.options.getBoolean("enabled");
        const delay = interaction.options.getInteger("delay") || 10;
        response = await setAutoDelete(settings, enabled, delay);
      } else if (sub === "message") {
        const message = interaction.options.getString("message");
        response = await setMessage(settings, message);
      } else if (sub === "config") {
        response = await showConfig(interaction, settings);
      } else if (sub === "test") {
        response = await sendTest(interaction, settings);
      } else if (sub === "variables") {
        response = showVariables();
      } else if (sub === "reset") {
        response = await resetGreeting(settings);
      }
    }

    await interaction.followUp(response);
  },
};

async function addChannel({ guild }, channel, settings) {
  if (!channel.permissionsFor(guild.members.me).has(["SendMessages", "EmbedLinks"])) {
    return ModernEmbed.simpleError(`I need SendMessages and EmbedLinks permissions in ${channel}`);
  }

  if (!settings.welcome) settings.welcome = { enabled: true };
  if (!settings.welcome.channels) settings.welcome.channels = [];

  if (settings.welcome.channels.includes(channel.id)) {
    return ModernEmbed.simpleError(`${channel} is already a greeting channel`);
  }

  settings.welcome.channels.push(channel.id);
  settings.welcome.enabled = true;
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Greeting Channel Added\n\n${channel} will now receive welcome messages`);
}

async function removeChannel(interaction, channel, settings) {
  if (!settings.welcome?.channels?.includes(channel.id)) {
    return ModernEmbed.simpleError(`${channel} is not a greeting channel`);
  }

  settings.welcome.channels = settings.welcome.channels.filter(id => id !== channel.id);
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Greeting Channel Removed\n\n${channel} will no longer receive welcome messages`);
}

async function toggleEmbed(settings, enabled) {
  if (!settings.welcome) settings.welcome = {};
  if (!settings.welcome.embed) settings.welcome.embed = {};

  settings.welcome.embed.enabled = enabled;
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Embed Mode ${enabled ? 'Enabled' : 'Disabled'}\n\nGreetings will ${enabled ? 'use embed format' : 'use plain text format'}`);
}

async function setEmbedMessage(settings, message) {
  if (!settings.welcome) settings.welcome = {};
  if (!settings.welcome.embed) settings.welcome.embed = {};

  settings.welcome.embed.description = message;
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Embed Message Updated\n\nNew greeting: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
}

async function resetEmbed(settings) {
  if (!settings.welcome) settings.welcome = {};
  settings.welcome.embed = {
    enabled: false,
    description: "Welcome to {server}, {user}!",
    color: "#FFFFFF",
    thumbnail: true,
    footer: "Member #{memberCount}",
    image: null
  };
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Embed Settings Reset\n\nEmbed configuration restored to defaults`);
}

async function setAutoDelete(settings, enabled, delay) {
  if (!settings.welcome) settings.welcome = {};
  settings.welcome.auto_delete = { enabled, delay };
  await settings.save();

  return ModernEmbed.simpleSuccess(
    `✅ Auto-Delete ${enabled ? 'Enabled' : 'Disabled'}\n\n${enabled ? `Greetings will be deleted after ${delay} seconds` : 'Greetings will not be auto-deleted'}`
  );
}

async function setMessage(settings, message) {
  if (!settings.welcome) settings.welcome = {};
  settings.welcome.content = message;
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Greeting Message Updated\n\nNew message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
}

async function showConfig({ guild }, settings) {
  const embed = new ModernEmbed()
    .setColor(0x5865F2)
    .setHeader("⚙️ Greeting Configuration", "Current welcome system settings");

  const status = settings.welcome?.enabled ? "✅ Enabled" : "❌ Disabled";
  embed.addField("Status", status, true);

  const channels = settings.welcome?.channels?.length > 0
    ? settings.welcome.channels.map(id => `<#${id}>`).join(", ")
    : "None configured";
  embed.addField("Channels", channels, false);

  const embedMode = settings.welcome?.embed?.enabled ? "✅ Enabled" : "❌ Disabled";
  embed.addField("Embed Mode", embedMode, true);

  const autoDelete = settings.welcome?.auto_delete?.enabled
    ? `✅ ${settings.welcome.auto_delete.delay}s`
    : "❌ Disabled";
  embed.addField("Auto-Delete", autoDelete, true);

  const message = settings.welcome?.content || settings.welcome?.embed?.description || "Not set";
  embed.addField("Message", message.substring(0, 100), false);

  embed.setFooter("Use /greet to configure settings");

  return embed.build();
}

async function sendTest({ member, guild }, settings) {
  if (!settings.welcome?.enabled || !settings.welcome?.channels?.length) {
    return ModernEmbed.simpleError("Please configure at least one greeting channel first");
  }

  const channel = guild.channels.cache.get(settings.welcome.channels[0]);
  if (!channel) {
    return ModernEmbed.simpleError("Configured channel not found");
  }

  try {
    const greeting = await buildGreeting(member, "WELCOME", settings.welcome);
    await channel.send(greeting);
    return ModernEmbed.simpleSuccess(`✅ Test greeting sent to ${channel}`);
  } catch (error) {
    return ModernEmbed.simpleError(`Failed to send test: ${error.message}`);
  }
}

function showVariables() {
  const embed = new ModernEmbed()
    .setColor(0x5865F2)
    .setHeader("📝 Available Variables", "Use these in your greeting messages");

  embed.addField("User Variables", 
    "`{user}` - User mention\n`{username}` - Username\n`{tag}` - User#1234\n`{id}` - User ID", false);
  
  embed.addField("Server Variables",
    "`{server}` - Server name\n`{memberCount}` - Total members\n`{members}` - Same as memberCount", false);

  embed.setFooter("Example: Welcome {user} to {server}! You are member #{memberCount}");

  return embed.build();
}

async function resetGreeting(settings) {
  settings.welcome = {
    enabled: false,
    channels: [],
    content: null,
    auto_delete: { enabled: false, delay: 10 },
    embed: {
      enabled: false,
      description: "Welcome to {server}, {user}!",
      color: "#FFFFFF",
      thumbnail: true,
      footer: "Member #{memberCount}",
      image: null
    }
  };
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Greeting System Reset\n\nAll greeting settings have been reset to defaults`);
}
