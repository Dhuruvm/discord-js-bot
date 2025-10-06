const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { SUPPORT_SERVER, DASHBOARD } = require("@root/config");
const { timeformat } = require("@helpers/Utils");
const os = require("os");
const { stripIndent } = require("common-tags");

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
    const settings = await client.database.schemas.Guild.findOne({ _id: "GLOBAL_SETTINGS" });
    developers = settings?.developers || [];
  } catch (error) {
    client.logger.error("Error fetching developers:", error);
  }

  // Format founder
  const founderId = "1354287041772392478";
  const founderMention = `<@${founderId}>`;

  // Format developers
  let devList = founderMention;
  if (developers.length > 0) {
    const devMentions = developers.map(id => `<@${id}>`).join(", ");
    devList = `${founderMention}, ${devMentions}`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setAuthor({ 
      name: `${client.user.username} Statistics`,
      iconURL: client.user.displayAvatarURL()
    })
    .setThumbnail(client.user.displayAvatarURL())
    .addFields(
      {
        name: "### General Statistics",
        value: stripIndent`
            > **Commands:** \`${client.commands.size}\`
            > **Servers:** \`${client.guilds.cache.size}\`
            > **Users:** \`${client.guilds.cache.reduce((size, g) => size + g.memberCount, 0)}\`
            > **Channels:** \`${client.channels.cache.size}\`
          `,
        inline: false,
      },
      {
        name: "### System Information",
        value: stripIndent`
            > **Platform:** \`${platform}\`
            > **Uptime:** <t:${parseInt(client.readyTimestamp / 1000)}:R>
            > **CPU Model:** \`${os.cpus()[0].model}\`
            > **CPU Usage:** \`${(process.cpuUsage().system / 1024 / 1024).toFixed(2)}%\`
            > **Memory:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\`
            > **Node.js:** \`${process.version}\`
          `,
        inline: false,
      }
    )
    .setFooter({ text: "Powered by Blackbit Studio" })
    .setTimestamp();

  let row1Components = [];
  let row2Components = [];

  row1Components.push(
    new ButtonBuilder()
      .setLabel("Invite Bot")
      .setEmoji("🔗")
      .setURL(client.getInvite())
      .setStyle(ButtonStyle.Link)
  );

  if (SUPPORT_SERVER) {
    row1Components.push(
      new ButtonBuilder()
        .setLabel("Support Server")
        .setEmoji("💬")
        .setURL(SUPPORT_SERVER)
        .setStyle(ButtonStyle.Link)
    );
  }

  if (DASHBOARD.enabled) {
    row1Components.push(
      new ButtonBuilder()
        .setLabel("Dashboard")
        .setEmoji("🌐")
        .setURL(DASHBOARD.baseURL)
        .setStyle(ButtonStyle.Link)
    );
  }

  // Add vote/review buttons
  row2Components.push(
    new ButtonBuilder()
      .setLabel("Vote for Bot")
      .setEmoji("⭐")
      .setURL("https://top.gg/")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel("Documentation")
      .setEmoji("📚")
      .setURL("https://github.com")
      .setStyle(ButtonStyle.Link)
  );

  let components = [];

  if (row1Components.length > 0) {
    components.push(new ActionRowBuilder().addComponents(row1Components));
  }
  if (row2Components.length > 0) {
    components.push(new ActionRowBuilder().addComponents(row2Components));
  }

  return { embeds: [embed], components };
};