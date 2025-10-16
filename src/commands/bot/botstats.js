const { SUPPORT_SERVER, DASHBOARD } = require("@root/config");
const { timeformat } = require("@helpers/Utils");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const os = require("os");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "botinfo",
  description: "Shows bot information and statistics",
  category: "BOT",
  botPermissions: ["EmbedLinks"],
  cooldown: 5,
  command: {
    enabled: true,
    aliases: ["botstats", "bi", "info"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [],
  },

  async messageRun(message, args) {
    const response = await getBotStats(message.client);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = await getBotStats(interaction.client);
    await interaction.followUp(response);
  },
};

async function getBotStats(client) {
  const guilds = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((size, g) => size + g.memberCount, 0);
  const commands = client.commands.size + client.slashCommands.size;

  const platform = process.platform.replace(/win32/g, "Windows").replace(/linux/g, "Linux").replace(/darwin/g, "macOS");
  const latency = `${client.ws.ping}ms`;

  // Get developer info
  const { DEVELOPER } = require("@root/config.js");
  const founderId = "1354287041772392478";
  
  // Create title and subtitle
  const title = `About ${client.user.username}`;
  const subtitle = `Managed and Created by **[${DEVELOPER}](https://discord.com/users/${founderId})**`;

  // Statistics section - matching screenshot format
  const statisticsFields = [
    { label: "Users", value: users.toLocaleString() },
    { label: "Servers", value: guilds.toString() },
    { label: "Commands", value: commands.toString() }
  ];

  // System section - matching screenshot format
  const systemFields = [
    { label: "Latency", value: latency },
    { label: "Language", value: "discord.js" },
    { label: "System", value: platform }
  ];

  // Buttons with emojis
  const buttons = [];
  
  buttons.push({
    label: "Invite",
    url: client.getInvite(),
    emoji: "🔗"
  });

  if (SUPPORT_SERVER) {
    buttons.push({
      label: "Support",
      url: SUPPORT_SERVER,
      emoji: "💬"
    });
  }

  if (DASHBOARD.enabled) {
    buttons.push({
      label: "Dashboard",
      url: DASHBOARD.baseURL,
      emoji: "🌐"
    });
  }

  // Build the professional bot info card
  const payload = ContainerBuilder.botInfoCard({
    title,
    subtitle,
    thumbnail: client.user.displayAvatarURL({ size: 256 }),
    statisticsFields,
    systemFields,
    buttons
  });

  return payload;
}
