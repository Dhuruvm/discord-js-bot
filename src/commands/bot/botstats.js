const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { SUPPORT_SERVER, DASHBOARD } = require("@root/config");
const { timeformat } = require("@helpers/Utils");
const ModernEmbed = require("@helpers/ModernEmbed");
const os = require("os");
const { stripIndent } = require("common-tags");

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

  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setAuthor({ 
      name: `${client.user.username} Statistics`,
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(
      `### Bot Information\n` +
      `> **Total Guilds:** \`${guilds}\`\n` +
      `> **Total Users:** \`${users.toLocaleString()}\`\n` +
      `> **Total Channels:** \`${channels}\`\n` +
      `> **Websocket Ping:** \`${client.ws.ping}ms\``
    )
    .addFields(
      { 
        name: "### Founder & Developers", 
        value: `> ${devList}`,
        inline: false 
      },
      { 
        name: "### System Information", 
        value: 
          `> **Operating System:** ${platform} [${architecture}]\n` +
          `> **CPU Cores:** ${cores}\n` +
          `> **CPU Usage:** ${cpuUsage}\n` +
          `> **Node.js Version:** ${process.versions.node}\n` +
          `> **Bot Uptime:** ${timeformat(process.uptime())}`,
        inline: false 
      },
      { 
        name: "### Memory Usage", 
        value: 
          `> **Bot:** ${botUsed} / ${botAvailable} (${botUsage})\n` +
          `> **System:** ${overallUsed} / ${overallAvailable} (${overallUsage})`,
        inline: false 
      }
    )
    .setFooter({ text: "Powered by Blackbit Studio" })
    .setThumbnail(client.user.displayAvatarURL());

  let row1Components = [];
  let row2Components = [];
  
  row1Components.push(
    new ButtonBuilder()
      .setLabel("Invite Bot")
      .setEmoji(ModernEmbed.getEmoji("link"))
      .setURL(client.getInvite())
      .setStyle(ButtonStyle.Link)
  );

  if (SUPPORT_SERVER) {
    row1Components.push(
      new ButtonBuilder()
        .setLabel("Support Server")
        .setEmoji(ModernEmbed.getEmoji("support"))
        .setURL(SUPPORT_SERVER)
        .setStyle(ButtonStyle.Link)
    );
  }

  if (DASHBOARD.enabled) {
    row1Components.push(
      new ButtonBuilder()
        .setLabel("Dashboard")
        .setEmoji(ModernEmbed.getEmoji("website"))
        .setURL(DASHBOARD.baseURL)
        .setStyle(ButtonStyle.Link)
    );
  }

  row2Components.push(
    new ButtonBuilder()
      .setLabel("Vote for Bot")
      .setEmoji(ModernEmbed.getEmoji("premium"))
      .setURL("https://top.gg/")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel("Documentation")
      .setEmoji(ModernEmbed.getEmoji("docs"))
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
}
