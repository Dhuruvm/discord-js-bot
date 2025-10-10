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
    if (client.database && client.database.schemas && client.database.schemas.Guild) {
      const settings = await client.database.schemas.Guild.findOne({ _id: "GLOBAL_SETTINGS" });
      developers = settings?.developers || [];
    }
  } catch (error) {
    client.logger.error("Error fetching developers:", error);
  }
  
  const { DEVELOPER } = require("@root/config.js");
  const founderId = "1354287041772392478";
  const founderMention = `**[${DEVELOPER}](https://discord.com/users/${founderId} "${DEVELOPER}")**`;
  
  let devList = founderMention;
  if (developers.length > 0) {
    const devMentions = developers.map(id => `**<@${id}>**`).join(", ");
    devList = `${founderMention}, ${devMentions}`;
  }

  const fields = [
    { name: "Total Guilds", value: `\`${guilds}\``, inline: true },
    { name: "Total Users", value: `\`${users.toLocaleString()}\``, inline: true },
    { name: "Total Channels", value: `\`${channels}\``, inline: true },
    { name: "Websocket Ping", value: `\`${client.ws.ping}ms\``, inline: true },
    { name: "Owner / Developer", value: devList, inline: false },
    { name: "Operating System", value: `${platform} [${architecture}]`, inline: true },
    { name: "CPU Cores", value: `${cores}`, inline: true },
    { name: "CPU Usage", value: `${cpuUsage}`, inline: true },
    { name: "Node.js Version", value: `${process.versions.node}`, inline: true },
    { name: "Bot Uptime", value: `${timeformat(process.uptime())}`, inline: true },
    { name: "Bot Memory", value: `${botUsed} / ${botAvailable} (${botUsage})`, inline: true },
    { name: "System Memory", value: `${overallUsed} / ${overallAvailable} (${overallUsage})`, inline: true }
  ];

  const titleText = ContainerBuilder.createTextDisplay(
    `## ${client.user.username} Statistics\n\n` +
    `**Complete system and bot statistics**`
  );

  const statsText = fields.map(field => {
    if (field.inline && fields.filter(f => f.inline).indexOf(field) % 3 === 0) {
      const row = fields.filter(f => f.inline).slice(
        fields.filter(f => f.inline).indexOf(field),
        fields.filter(f => f.inline).indexOf(field) + 3
      );
      return row.map(f => `**${f.name}:** ${f.value}`).join(' • ');
    } else if (!field.inline) {
      return `**${field.name}**\n${field.value}`;
    }
    return null;
  }).filter(Boolean).join('\n\n');

  const contentText = ContainerBuilder.createTextDisplay(statsText);

  // Add interactive buttons inside container
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

  const buttonRow = new ActionRowBuilder().addComponents(...buttons.slice(0, 5));

  const payload = new ContainerBuilder()
    .addContainer({ 
      accentColor: 0xFFFFFF, 
      components: [titleText, contentText, buttonRow]
    })
    .build();

  return payload;
}
