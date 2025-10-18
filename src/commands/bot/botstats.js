
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { SUPPORT_SERVER, DASHBOARD, DEVELOPER, OWNER_IDS } = require("@root/config");
const os = require("os");
const mongoose = require("mongoose");
const GuildModel = mongoose.model("guild");

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
  const platform = process.platform.replace(/win32/g, "Windows").replace(/linux/g, "Linux").replace(/darwin/g, "macOS");
  const latency = `${client.ws.ping}ms`;

  // Get developers from database
  let developers = [];
  try {
    const settings = await GuildModel.findOne({ _id: "GLOBAL_SETTINGS" });
    developers = settings?.developers || [];
  } catch (error) {
    client.logger.error("Error fetching developers:", error);
  }

  // Format founder
  const founderId = OWNER_IDS[0] || "1354287041772392478";
  let creatorText = DEVELOPER || "saw";

  // Add additional developers if any
  if (developers.length > 0) {
    const devNames = [];
    for (const devId of developers) {
      try {
        const user = await client.users.fetch(devId);
        devNames.push(user.username);
      } catch (err) {
        // Skip if user can't be fetched
      }
    }
    if (devNames.length > 0) {
      creatorText = `${DEVELOPER || "saw"}, ${devNames.join(", ")}`;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setTitle(`About ${client.user.username}`)
    .setDescription(`Managed and Created by **${creatorText}**`)
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: "Statistics",
        value: [
          `> **Users:** \`${client.guilds.cache.reduce((size, g) => size + g.memberCount, 0).toLocaleString()}\``,
          `> **Servers:** \`${client.guilds.cache.size}\``,
          `> **Commands:** \`${client.commands.size}\``
        ].join("\n"),
        inline: false
      },
      {
        name: "System",
        value: [
          `> **Latency:** \`${latency}\``,
          `> **Language:** \`discord.js\``,
          `> **System:** \`${platform}\``
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: "Powered by Blackbit Studio" });

  const buttons = [];

  buttons.push(
    new ButtonBuilder()
      .setLabel("Invite")
      .setEmoji("🔗")
      .setURL(client.getInvite())
      .setStyle(ButtonStyle.Link)
  );

  if (SUPPORT_SERVER) {
    buttons.push(
      new ButtonBuilder()
        .setLabel("Support")
        .setEmoji("💬")
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

  const buttonRow = new ActionRowBuilder().addComponents(buttons.slice(0, 5));

  return { embeds: [embed], components: [buttonRow] };
}
