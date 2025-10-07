const { SUPPORT_SERVER, DASHBOARD } = require("@root/config");
const { timeformat } = require("@helpers/Utils");
const ModernEmbed = require("@helpers/ModernEmbed");
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
  const channels = client.channels.cache.size;
  const users = client.guilds.cache.reduce((size, g) => size + g.memberCount, 0);

  const platform = process.platform.replace(/win32/g, "Windows");
  const architecture = os.arch();
  const cores = os.cpus().length;
  const cpuUsage = `${(process.cpuUsage().user / 1024 / 1024).toFixed(2)} MB`;

  const botUsed = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;
  const botAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const botUsage = `${((process.memoryUsage().heapUsed / os.totalmem()) * 100).toFixed(1)}%`;

  const overallUsed = `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const overallAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const overallUsage = `${Math.floor(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`;

  let developers = [];
  try {
    const settings = await client.database.schemas.Guild.findOne({ _id: "GLOBAL_SETTINGS" });
    developers = settings?.developers || [];
  } catch (error) {
    client.logger.error("Error fetching developers:", error);
  }
  
  const founderId = "1354287041772392478";
  const founderMention = `<@${founderId}>`;
  
  let devList = founderMention;
  if (developers.length > 0) {
    const devMentions = developers.map(id => `<@${id}>`).join(", ");
    devList = `${founderMention}, ${devMentions}`;
  }

  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`📊 ${client.user.username} Statistics`)
    .setThumbnail(client.user.displayAvatarURL())
    .addField("Total Guilds", `\`${guilds}\``, true)
    .addField("Total Users", `\`${users.toLocaleString()}\``, true)
    .addField("Total Channels", `\`${channels}\``, true)
    .addField("Websocket Ping", `\`${client.ws.ping}ms\``, true)
    .addField("Founder & Developers", devList, false)
    .addField("Operating System", `${platform} [${architecture}]`, true)
    .addField("CPU Cores", `${cores}`, true)
    .addField("CPU Usage", `${cpuUsage}`, true)
    .addField("Node.js Version", `${process.versions.node}`, true)
    .addField("Bot Uptime", `${timeformat(process.uptime())}`, true)
    .addField("Bot Memory", `${botUsed} / ${botAvailable} (${botUsage})`, true)
    .addField("System Memory", `${overallUsed} / ${overallAvailable} (${overallUsage})`, true)
    .setFooter("Powered by Blackbit Studio")
    .setTimestamp();

  // Add interactive buttons
  embed.addButton({ label: "Invite Bot", emoji: "🔗", url: client.getInvite(), style: "Link" });

  if (SUPPORT_SERVER) {
    embed.addButton({ label: "Support Server", emoji: "💬", url: SUPPORT_SERVER, style: "Link" });
  }

  if (DASHBOARD.enabled) {
    embed.addButton({ label: "Dashboard", emoji: "🌐", url: DASHBOARD.baseURL, style: "Link" });
  }

  embed.addButton({ label: "Vote", emoji: "⭐", url: "https://top.gg/", style: "Link" });
  embed.addButton({ label: "Docs", emoji: "📚", url: "https://github.com", style: "Link" });

  return embed.toMessage();
}
