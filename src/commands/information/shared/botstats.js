const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { SUPPORT_SERVER, DASHBOARD, DEVELOPER, OWNER_IDS } = require("@root/config");
const { timeformat } = require("@helpers/Utils");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const os = require("os");
const mongoose = require("mongoose");
const GuildModel = mongoose.model("guild");

/**
 * @param {import('@structures/BotClient')} client
 */
module.exports = async (client) => {
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

  // Get developers from database
  let developers = [];
  try {
    const settings = await GuildModel.findOne({ _id: "GLOBAL_SETTINGS" });
    developers = settings?.developers || [];
  } catch (error) {
    client.logger.error("Error fetching developers:", error);
  }

  // Format founder with blue bold text
  const founderId = OWNER_IDS[0] || "1354287041772392478";
  const founderMention = `**[${DEVELOPER}](https://discord.com/users/${founderId} "${DEVELOPER}")**`;

  // Format developers
  let devList = founderMention;
  if (developers.length > 0) {
    const devMentions = developers.map(id => `**<@${id}>**`).join(", ");
    devList = `${founderMention}, ${devMentions}`;
  }

  const titleText = ContainerBuilder.createTextDisplay(
    `## ${client.user.username} Statistics\n\n` +
    `**Bot and system information**`
  );

  const generalStats = ContainerBuilder.createTextDisplay(
    `### General Statistics\n` +
    `> **Commands:** \`${client.commands.size}\`\n` +
    `> **Servers:** \`${client.guilds.cache.size}\`\n` +
    `> **Users:** \`${client.guilds.cache.reduce((size, g) => size + g.memberCount, 0)}\`\n` +
    `> **Channels:** \`${client.channels.cache.size}\``
  );

  const systemInfo = ContainerBuilder.createTextDisplay(
    `### System Information\n` +
    `> **Platform:** \`${platform}\`\n` +
    `> **Uptime:** <t:${parseInt(client.readyTimestamp / 1000)}:R>\n` +
    `> **CPU Model:** \`${os.cpus()[0].model}\`\n` +
    `> **CPU Usage:** \`${(process.cpuUsage().system / 1024 / 1024).toFixed(2)}%\`\n` +
    `> **Memory:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\`\n` +
    `> **Node.js:** \`${process.version}\``
  );

  const ownerInfo = ContainerBuilder.createTextDisplay(
    `### Owner / Developer\n${devList}\n\n` +
    `*Powered by Blackbit Studio*`
  );

  // Add buttons inside container
  const buttons = [];

  buttons.push(
    new ButtonBuilder()
      .setLabel("Invite Bot")
      .setURL(client.getInvite())
      .setStyle(ButtonStyle.Link)
  );

  if (SUPPORT_SERVER) {
    buttons.push(
      new ButtonBuilder()
        .setLabel("Support Server")
        .setURL(SUPPORT_SERVER)
        .setStyle(ButtonStyle.Link)
    );
  }

  if (DASHBOARD.enabled) {
    buttons.push(
      new ButtonBuilder()
        .setLabel("Dashboard")
        .setURL(DASHBOARD.baseURL)
        .setStyle(ButtonStyle.Link)
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setLabel("Vote")
      .setURL("https://top.gg/")
      .setStyle(ButtonStyle.Link)
  );

  buttons.push(
    new ButtonBuilder()
      .setLabel("Website")
      .setURL("https://github.com")
      .setStyle(ButtonStyle.Link)
  );

  const buttonRow = new ActionRowBuilder().addComponents(...buttons.slice(0, 5));

  const payload = new ContainerBuilder()
    .addContainer({ 
      accentColor: 0xFFFFFF, 
      components: [titleText, generalStats, systemInfo, ownerInfo, buttonRow]
    })
    .build();

  return payload;
};