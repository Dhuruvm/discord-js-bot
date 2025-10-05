const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { SUPPORT_SERVER, DASHBOARD } = require("@root/config");
const ModernEmbed = require("@helpers/ModernEmbed");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "invite",
  description: "Get bot invitation link and support server",
  category: "BOT",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["inv", "botinvite"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [],
  },

  async messageRun(message, args) {
    const response = getInviteMessage(message.client);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = getInviteMessage(interaction.client);
    await interaction.followUp(response);
  },
};

function getInviteMessage(client) {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`${ModernEmbed.getEmoji("bot")} Invite ${client.user.username}`)
    .setDescription(`Click the button below to invite me to your server!`)
    .setThumbnail(client.user.displayAvatarURL())
    .setTimestamp();

  const components = [];
  const row = new ActionRowBuilder();

  row.addComponents(
    new ButtonBuilder()
      .setLabel("Invite Bot")
      .setEmoji(ModernEmbed.getEmoji("link"))
      .setURL(client.getInvite())
      .setStyle(ButtonStyle.Link)
  );

  if (SUPPORT_SERVER) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Support Server")
        .setEmoji(ModernEmbed.getEmoji("support"))
        .setURL(SUPPORT_SERVER)
        .setStyle(ButtonStyle.Link)
    );
  }

  if (DASHBOARD.enabled) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Dashboard")
        .setEmoji(ModernEmbed.getEmoji("website"))
        .setURL(DASHBOARD.baseURL)
        .setStyle(ButtonStyle.Link)
    );
  }

  components.push(row);

  return { embeds: [embed], components };
}
