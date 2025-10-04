const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");

module.exports = (client) => {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setAuthor({ 
      name: "Invite Cybork to Your Server!",
      iconURL: client.user.displayAvatarURL()
    })
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(
      "Hey there! Thanks for considering to invite me! 🎉\n\n" +
      "**What I Can Do:**\n" +
      "• Advanced moderation tools\n" +
      "• Fun commands and games\n" +
      "• Music playback\n" +
      "• Custom automation\n" +
      "• And much more!\n\n" +
      "Use the buttons below to get started!"
    )
    .setFooter({ text: "Cybork - Your All-in-One Discord Bot" })
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
