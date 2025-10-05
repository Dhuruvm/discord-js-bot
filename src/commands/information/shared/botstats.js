
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require("discord.js");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");
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

  // Modern Container with Components V2
  const container = {
    type: ComponentType.Container,
    accent_color: 0x5865F2,
    components: [
      // Header Section
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `# 📊 ${client.user.username} Statistics\n\nComprehensive statistics and system information about your bot.`
          }
        ],
        accessory: {
          type: ComponentType.Thumbnail,
          media: { url: client.user.displayAvatarURL() },
          description: `${client.user.username} Avatar`
        }
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },
      
      // Bot Overview Section
      {
        type: ComponentType.TextDisplay,
        content: `### 🌐 Bot Overview\n\n` +
          `**Total Guilds:** \`${guilds}\`\n` +
          `**Total Users:** \`${users.toLocaleString()}\`\n` +
          `**Total Channels:** \`${channels}\`\n` +
          `**Websocket Ping:** \`${client.ws.ping}ms\``
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },
      
      // Team Section
      {
        type: ComponentType.TextDisplay,
        content: `### 👑 Founder & Developers\n\n${devList}`
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },
      
      // System Information Section
      {
        type: ComponentType.TextDisplay,
        content: `### 💻 System Information\n\n` +
          stripIndent`
          **Operating System:** ${platform} [${architecture}]
          **CPU Cores:** ${cores}
          **CPU Usage:** ${cpuUsage}
          **Node.js Version:** ${process.versions.node}
          **Bot Uptime:** ${timeformat(process.uptime())}
          `
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },
      
      // Memory Information Section
      {
        type: ComponentType.TextDisplay,
        content: `### 🔧 Memory Usage\n\n` +
          stripIndent`
          **Bot Memory Used:** ${botUsed}
          **Bot Memory Available:** ${botAvailable}
          **Bot Memory Usage:** ${botUsage}
          
          **System Memory Used:** ${overallUsed}
          **System Memory Available:** ${overallAvailable}
          **System Memory Usage:** ${overallUsage}
          `
      },
      
      // Separator
      {
        type: ComponentType.Separator,
        divider: false,
        spacing: 1
      },
      
      // Footer
      {
        type: ComponentType.TextDisplay,
        content: `*${client.user.username} • Powered by Discord.js* • <t:${Math.floor(Date.now() / 1000)}:R>`
      }
    ]
  };

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

  let components = [container];
  
  if (row1Components.length > 0) {
    components.push(new ActionRowBuilder().addComponents(row1Components));
  }
  if (row2Components.length > 0) {
    components.push(new ActionRowBuilder().addComponents(row2Components));
  }

  return { components, flags: MessageFlags.IsComponentsV2 };
};
