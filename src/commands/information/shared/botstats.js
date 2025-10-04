const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");
const { timeformat } = require("@helpers/Utils");
const os = require("os");
const { stripIndent } = require("common-tags");

/**
 * @param {import('@structures/BotClient')} client
 */
module.exports = (client) => {
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

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setAuthor({ 
      name: "📊 Cybork Statistics",
      iconURL: client.user.displayAvatarURL()
    })
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(
      `**📊 Bot Overview**\n` +
      `❯ **Total Guilds:** \`${guilds}\`\n` +
      `❯ **Total Users:** \`${users.toLocaleString()}\`\n` +
      `❯ **Total Channels:** \`${channels}\`\n` +
      `❯ **Websocket Ping:** \`${client.ws.ping}ms\`\n`
    )
    .addFields(
      {
        name: "💻 CPU Information",
        value: stripIndent`
        ❯ **OS:** \`${platform}\` **[${architecture}]**
        ❯ **Cores:** \`${cores}\`
        ❯ **Usage:** \`${cpuUsage}\`
        `,
        inline: true,
      },
      {
        name: "🔧 Bot's RAM",
        value: stripIndent`
        ❯ **Used:** \`${botUsed}\`
        ❯ **Available:** \`${botAvailable}\`
        ❯ **Usage:** \`${botUsage}\`
        `,
        inline: true,
      },
      {
        name: "💾 Overall RAM",
        value: stripIndent`
        ❯ **Used:** \`${overallUsed}\`
        ❯ **Available:** \`${overallAvailable}\`
        ❯ **Usage:** \`${overallUsage}\`
        `,
        inline: true,
      },
      {
        name: "⚙️ Node.js Version",
        value: `\`${process.versions.node}\``,
        inline: true,
      },
      {
        name: "⏱️ Uptime",
        value: `\`${timeformat(process.uptime())}\``,
        inline: true,
      }
    )
    .setFooter({ text: "Cybork - Powered by Discord.js" })
    .setTimestamp();

  let components = [];
  components.push(
    new ButtonBuilder()
      .setLabel("Invite Cybork")
      .setEmoji("🔗")
      .setURL(client.getInvite())
      .setStyle(ButtonStyle.Link)
  );

  if (SUPPORT_SERVER) {
    components.push(
      new ButtonBuilder()
        .setLabel("Support Server")
        .setEmoji("💬")
        .setURL(SUPPORT_SERVER)
        .setStyle(ButtonStyle.Link)
    );
  }

  if (DASHBOARD.enabled) {
    components.push(
      new ButtonBuilder()
        .setLabel("Dashboard")
        .setEmoji("🌐")
        .setURL(DASHBOARD.baseURL)
        .setStyle(ButtonStyle.Link)
    );
  }

  let buttonsRow = new ActionRowBuilder().addComponents(components);

  return { embeds: [embed], components: [buttonsRow] };
};