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
    aliases: ["inv", "botinvite", "invitebot", "add"],
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
  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`🔗 Invite ${client.user.username}`, "Click the buttons below to invite me to your server or join our community!")
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter("Powered by Blackbit Studio")
    .setTimestamp();

  embed.addButton({ label: "Invite Bot", emoji: "🔗", url: client.getInvite(), style: "Link" });

  if (SUPPORT_SERVER) {
    embed.addButton({ label: "Support Server", emoji: "💬", url: SUPPORT_SERVER, style: "Link" });
  }

  if (DASHBOARD.enabled) {
    embed.addButton({ label: "Dashboard", emoji: "🌐", url: DASHBOARD.baseURL, style: "Link" });
  }

  return embed.toMessage();
}
