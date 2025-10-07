
const { ApplicationCommandOptionType } = require("discord.js");

// Map to store jailed bot instances per guild
const jailedBots = new Map();

/**
 * @param {import('@structures/BotClient')} client
 * @param {import('discord.js').Guild} guild
 */
async function listJailedBots(client) {
  if (jailedBots.size === 0) {
    return "No bot is currently jailed in any voice channel.";
  }

  let response = "**Jailed Bot Instances:**\n";
  for (const [guildId, jailInfo] of jailedBots.entries()) {
    const guild = client.guilds.cache.get(guildId);
    const channel = guild?.channels.cache.get(jailInfo.channelId);
    response += `\n• Guild: ${guild?.name || "Unknown"} - Channel: ${channel?.name || "Unknown"}`;
  }

  return response;
}

/**
 * @param {import('discord.js').Guild} guild
 */
async function jailBot(guild) {
  const botMember = guild.members.cache.get(guild.client.user.id);
  
  if (!botMember.voice.channel) {
    return "❌ Bot is not in any voice channel!";
  }

  const channelId = botMember.voice.channelId;
  
  jailedBots.set(guild.id, {
    guildId: guild.id,
    channelId: channelId,
    channelName: botMember.voice.channel.name,
  });

  return `✅ Bot has been jailed in voice channel: **${botMember.voice.channel.name}**\nThe bot will not be able to leave or be moved from this channel.`;
}

/**
 * @param {import('discord.js').Guild} guild
 */
async function unjailBot(guild) {
  if (!jailedBots.has(guild.id)) {
    return "❌ Bot is not jailed in this server!";
  }

  const jailInfo = jailedBots.get(guild.id);
  jailedBots.delete(guild.id);

  return `✅ Bot has been released from jail in **${jailInfo.channelName}**`;
}

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "jail",
  description: "Lock bot in its current voice channel (owner only)",
  category: "OWNER",
  botPermissions: ["Connect", "Speak"],
  command: {
    enabled: true,
    usage: "<add|remove|list>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "add",
        description: "Lock the bot in its current voice channel",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "remove",
        description: "Remove bot jail from this server",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "list",
        description: "List all jailed bot instances",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args) {
    const subCommand = args[0].toLowerCase();

    if (subCommand === "list") {
      const response = await listJailedBots(message.client);
      return message.safeReply(response);
    }

    if (subCommand === "add") {
      const response = await jailBot(message.guild);
      return message.safeReply(response);
    }

    if (subCommand === "remove") {
      const response = await unjailBot(message.guild);
      return message.safeReply(response);
    }

    return message.safeReply("Invalid subcommand. Use: `add`, `remove`, or `list`");
  },

  async interactionRun(interaction) {
    const subCommand = interaction.options.getSubcommand();

    if (subCommand === "list") {
      const response = await listJailedBots(interaction.client);
      return interaction.followUp(response);
    }

    if (subCommand === "add") {
      const response = await jailBot(interaction.guild);
      return interaction.followUp(response);
    }

    if (subCommand === "remove") {
      const response = await unjailBot(interaction.guild);
      return interaction.followUp(response);
    }
  },
};

module.exports.jailedBots = jailedBots;
