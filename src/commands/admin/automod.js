const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");
const InteractionHelpers = require("@helpers/InteractionHelpers");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "automod",
  description: "Configure automatic moderation rules",
  category: "AUTOMOD",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    aliases: ["am", "automods"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "antispam",
        description: "Configure anti-spam protection",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "enabled",
            description: "Enable anti-spam",
            type: ApplicationCommandOptionType.Boolean,
            required: true,
          },
          {
            name: "threshold",
            description: "Messages before action (default: 5)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 3,
            maxValue: 10,
          },
          {
            name: "timeframe",
            description: "Seconds to check (default: 5)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 3,
            maxValue: 30,
          },
        ],
      },
      {
        name: "antilink",
        description: "Configure anti-link protection",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "enabled",
            description: "Enable anti-link",
            type: ApplicationCommandOptionType.Boolean,
            required: true,
          },
        ],
      },
      {
        name: "antibadwords",
        description: "Configure bad word filter",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "enabled",
            description: "Enable bad word filter",
            type: ApplicationCommandOptionType.Boolean,
            required: true,
          },
        ],
      },
      {
        name: "antizalgo",
        description: "Configure zalgo text detection",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "enabled",
            description: "Enable anti-zalgo",
            type: ApplicationCommandOptionType.Boolean,
            required: true,
          },
          {
            name: "threshold",
            description: "Detection threshold % (default: 50)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 30,
            maxValue: 90,
          },
        ],
      },
      {
        name: "anticaps",
        description: "Configure excessive caps detection",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "enabled",
            description: "Enable anti-caps",
            type: ApplicationCommandOptionType.Boolean,
            required: true,
          },
          {
            name: "threshold",
            description: "Caps % threshold (default: 70)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 50,
            maxValue: 95,
          },
        ],
      },
      {
        name: "whitelist",
        description: "Manage whitelisted channels",
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: "add",
            description: "Add channel to whitelist",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "channel",
                description: "Channel to whitelist",
                type: ApplicationCommandOptionType.Channel,
                channelTypes: [ChannelType.GuildText],
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remove channel from whitelist",
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
          {
            name: "list",
            description: "View whitelisted channels",
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: "config",
        description: "View automod configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    
    if (args.length === 0) {
      return message.safeReply(`Usage: \`${data.prefix}automod <subcommand>\`\n\nAvailable subcommands:\n• \`antispam <true/false> [threshold] [timeframe]\` - Configure anti-spam\n• \`antilink <true/false>\` - Configure anti-link\n• \`antibadwords <true/false>\` - Configure bad word filter\n• \`antizalgo <true/false> [threshold]\` - Configure zalgo detection\n• \`anticaps <true/false> [threshold]\` - Configure caps detection\n• \`whitelist add <#channel>\` - Add whitelisted channel\n• \`whitelist remove <#channel>\` - Remove whitelisted channel\n• \`whitelist list\` - View whitelisted channels\n• \`config\` - View configuration`);
    }

    const sub = args[0].toLowerCase();
    let response;

    if (sub === "whitelist") {
      const action = args[1]?.toLowerCase();
      if (action === "add") {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
        if (!channel) return message.safeReply("Please provide a valid channel");
        response = await addWhitelist(settings, channel);
      } else if (action === "remove") {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
        if (!channel) return message.safeReply("Please provide a valid channel");
        response = await removeWhitelist(settings, channel);
      } else if (action === "list") {
        response = await listWhitelist(message.guild, settings);
      } else {
        return message.safeReply(`Invalid whitelist action. Use: \`${data.prefix}automod whitelist <add/remove/list>\``);
      }
    } else if (sub === "antispam") {
      const enabled = args[1]?.toLowerCase() === "true" || args[1]?.toLowerCase() === "yes";
      const threshold = parseInt(args[2]) || 5;
      const timeframe = parseInt(args[3]) || 5;
      response = await setAntiSpam(settings, enabled, threshold, timeframe);
    } else if (sub === "antilink") {
      const enabled = args[1]?.toLowerCase() === "true" || args[1]?.toLowerCase() === "yes";
      response = await setAntiLink(settings, enabled);
    } else if (sub === "antibadwords") {
      const enabled = args[1]?.toLowerCase() === "true" || args[1]?.toLowerCase() === "yes";
      response = await setAntiBadwords(settings, enabled);
    } else if (sub === "antizalgo") {
      const enabled = args[1]?.toLowerCase() === "true" || args[1]?.toLowerCase() === "yes";
      const threshold = parseInt(args[2]) || 50;
      response = await setAntiZalgo(settings, enabled, threshold);
    } else if (sub === "anticaps") {
      const enabled = args[1]?.toLowerCase() === "true" || args[1]?.toLowerCase() === "yes";
      const threshold = parseInt(args[2]) || 70;
      response = await setAntiCaps(settings, enabled, threshold);
    } else if (sub === "config") {
      response = await showConfig(settings);
    } else {
      return message.safeReply(`Unknown subcommand. Use \`${data.prefix}automod\` to see available options.`);
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;

    if (group === "whitelist") {
      if (sub === "add") {
        const channel = interaction.options.getChannel("channel");
        response = await addWhitelist(settings, channel);
      } else if (sub === "remove") {
        const channel = interaction.options.getChannel("channel");
        response = await removeWhitelist(settings, channel);
      } else if (sub === "list") {
        response = await listWhitelist(interaction.guild, settings);
      }
    } else {
      if (sub === "antispam") {
        const enabled = interaction.options.getBoolean("enabled");
        const threshold = interaction.options.getInteger("threshold") || 5;
        const timeframe = interaction.options.getInteger("timeframe") || 5;
        response = await setAntiSpam(settings, enabled, threshold, timeframe);
      } else if (sub === "antilink") {
        const enabled = interaction.options.getBoolean("enabled");
        response = await setAntiLink(settings, enabled);
      } else if (sub === "antibadwords") {
        const enabled = interaction.options.getBoolean("enabled");
        response = await setAntiBadwords(settings, enabled);
      } else if (sub === "antizalgo") {
        const enabled = interaction.options.getBoolean("enabled");
        const threshold = interaction.options.getInteger("threshold") || 50;
        response = await setAntiZalgo(settings, enabled, threshold);
      } else if (sub === "anticaps") {
        const enabled = interaction.options.getBoolean("enabled");
        const threshold = interaction.options.getInteger("threshold") || 70;
        response = await setAntiCaps(settings, enabled, threshold);
      } else if (sub === "config") {
        response = await showConfig(settings);
      }
    }

    await interaction.followUp(response);
  },
};

async function setAntiSpam(settings, enabled, threshold, timeframe) {
  if (!settings.automod) settings.automod = {};
  settings.automod.anti_spam = { enabled, threshold, timeframe };
  await settings.save();

  return ModernEmbed.simpleSuccess(
    `✅ Anti-Spam ${enabled ? 'Enabled' : 'Disabled'}\n\n${enabled ? `Will trigger after ${threshold} messages in ${timeframe} seconds` : ''}`
  );
}

async function setAntiLink(settings, enabled) {
  if (!settings.automod) settings.automod = {};
  settings.automod.anti_links = enabled;
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Anti-Link ${enabled ? 'Enabled' : 'Disabled'}\n\n${enabled ? 'Links will be automatically deleted' : ''}`);
}

async function setAntiBadwords(settings, enabled) {
  if (!settings.automod) settings.automod = {};
  if (!settings.automod.anti_badwords) settings.automod.anti_badwords = { keywords: [], action: "DELETE" };
  settings.automod.anti_badwords.enabled = enabled;
  await settings.save();

  return ModernEmbed.simpleSuccess(
    `✅ Bad Word Filter ${enabled ? 'Enabled' : 'Disabled'}\n\n${enabled ? 'Use the dashboard or database to manage keyword list' : ''}`
  );
}

async function setAntiZalgo(settings, enabled, threshold) {
  if (!settings.automod) settings.automod = {};
  settings.automod.anti_zalgo = { enabled, threshold };
  await settings.save();

  return ModernEmbed.simpleSuccess(
    `✅ Anti-Zalgo ${enabled ? 'Enabled' : 'Disabled'}\n\n${enabled ? `Detection threshold: ${threshold}%` : ''}`
  );
}

async function setAntiCaps(settings, enabled, threshold) {
  if (!settings.automod) settings.automod = {};
  settings.automod.anti_caps = { enabled, threshold, min_length: 10 };
  await settings.save();

  return ModernEmbed.simpleSuccess(
    `✅ Anti-Caps ${enabled ? 'Enabled' : 'Disabled'}\n\n${enabled ? `Messages with >${threshold}% caps will be deleted` : ''}`
  );
}

async function addWhitelist(settings, channel) {
  if (!settings.automod) settings.automod = {};
  if (!settings.automod.wh_channels) settings.automod.wh_channels = [];

  if (settings.automod.wh_channels.includes(channel.id)) {
    return ModernEmbed.simpleError(`${channel} is already whitelisted`);
  }

  settings.automod.wh_channels.push(channel.id);
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Channel Whitelisted\n\n${channel} is now exempt from automod`);
}

async function removeWhitelist(settings, channel) {
  if (!settings.automod?.wh_channels?.includes(channel.id)) {
    return ModernEmbed.simpleError(`${channel} is not whitelisted`);
  }

  settings.automod.wh_channels = settings.automod.wh_channels.filter(id => id !== channel.id);
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Channel Removed\n\n${channel} is no longer whitelisted`);
}

async function listWhitelist(guild, settings) {
  const channels = settings.automod?.wh_channels || [];
  
  if (channels.length === 0) {
    return ModernEmbed.simpleError("No channels are whitelisted");
  }

  const embed = new ModernEmbed()
    .setColor(0x5865F2)
    .setHeader("📋 Whitelisted Channels", `${channels.length} channel(s) exempt from automod`);

  const list = channels.map(id => `<#${id}>`).join("\n");
  embed.addField("Channels", list, false);

  return embed.build();
}

async function showConfig(settings) {
  const embed = new ModernEmbed()
    .setColor(0x5865F2)
    .setHeader("⚙️ Automod Configuration", "Current automatic moderation settings");

  const antiSpam = settings.automod?.anti_spam?.enabled
    ? `✅ ${settings.automod.anti_spam.threshold} msgs/${settings.automod.anti_spam.timeframe}s`
    : "❌ Disabled";
  embed.addField("Anti-Spam", antiSpam, true);

  const antiLink = settings.automod?.anti_links ? "✅ Enabled" : "❌ Disabled";
  embed.addField("Anti-Link", antiLink, true);

  const antiBadwords = settings.automod?.anti_badwords?.enabled
    ? `✅ ${settings.automod.anti_badwords.keywords?.length || 0} keywords`
    : "❌ Disabled";
  embed.addField("Bad Words", antiBadwords, true);

  const antiZalgo = settings.automod?.anti_zalgo?.enabled
    ? `✅ ${settings.automod.anti_zalgo.threshold}%`
    : "❌ Disabled";
  embed.addField("Anti-Zalgo", antiZalgo, true);

  const antiCaps = settings.automod?.anti_caps?.enabled
    ? `✅ ${settings.automod.anti_caps.threshold}%`
    : "❌ Disabled";
  embed.addField("Anti-Caps", antiCaps, true);

  const whitelisted = settings.automod?.wh_channels?.length || 0;
  embed.addField("Whitelisted", `${whitelisted} channel(s)`, true);

  embed.setFooter("Use /automod to configure rules");

  return embed.build();
}
