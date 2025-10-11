const { parseEmoji } = require("discord.js");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const { EMBED_COLORS } = require("@root/config");

module.exports = (emoji) => {
  let custom = parseEmoji(emoji);
  if (!custom.id) return "This is not a valid guild emoji";

  let url = `https://cdn.discordapp.com/emojis/${custom.id}.${custom.animated ? "gif?v=1" : "png"}`;

  const components = [
    ContainerBuilder.createTextDisplay(`## ${custom.animated ? "🎬" : "😀"} Emoji Info`),
    ContainerBuilder.createSeparator(),
    ContainerBuilder.createTextDisplay(
      `**ID:** \`${custom.id}\`\n` +
      `**Name:** ${custom.name}\n` +
      `**Animated:** ${custom.animated ? "Yes" : "No"}\n\n` +
      `**Preview:**`
    ),
    ContainerBuilder.createMediaGallery([{ url }]),
    ContainerBuilder.createSeparator(),
    ContainerBuilder.createActionRow([
      ContainerBuilder.createButton({
        label: "Download Emoji",
        url: url,
        style: "Link"
      })
    ])
  ];

  return new ContainerBuilder()
    .addContainer({ 
      accentColor: parseInt(EMBED_COLORS.BOT_EMBED.replace('#', ''), 16),
      components 
    })
    .build();
};
