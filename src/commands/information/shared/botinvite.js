const ContainerBuilder = require("@helpers/ContainerBuilder");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");

module.exports = (client) => {
  const buttons = [];
  
  buttons.push({
    label: "Invite Cybork",
    emoji: "🔗",
    url: client.getInvite(),
    style: "Link"
  });

  if (SUPPORT_SERVER) {
    buttons.push({
      label: "Support Server",
      emoji: "💬",
      url: SUPPORT_SERVER,
      style: "Link"
    });
  }

  if (DASHBOARD.enabled) {
    buttons.push({
      label: "Dashboard",
      emoji: "🌐",
      url: DASHBOARD.baseURL,
      style: "Link"
    });
  }

  return ContainerBuilder.serverInfo({
    title: `🎉 Invite ${client.user.username} to Your Server!`,
    description: `**Hey there! Thanks for considering to invite me!**\n\n` +
      `**What I Can Do:**\n` +
      `• Advanced moderation tools\n` +
      `• Fun commands and games\n` +
      `• Music playback\n` +
      `• Custom automation\n` +
      `• And much more!\n\n` +
      `**Use the buttons below to get started!**`,
    thumbnail: client.user.displayAvatarURL(),
    fields: [],
    accentColor: parseInt(EMBED_COLORS.PRIMARY.replace('#', ''), 16),
    buttons
  });
};
