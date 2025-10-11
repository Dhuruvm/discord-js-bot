const ContainerBuilder = require("@helpers/ContainerBuilder");
const { EMBED_COLORS } = require("@root/config");

/**
 * @param {import('discord.js').User} user
 */
module.exports = (user) => {
  const x64 = user.displayAvatarURL({ extension: "png", size: 64 });
  const x128 = user.displayAvatarURL({ extension: "png", size: 128 });
  const x256 = user.displayAvatarURL({ extension: "png", size: 256 });
  const x512 = user.displayAvatarURL({ extension: "png", size: 512 });
  const x1024 = user.displayAvatarURL({ extension: "png", size: 1024 });
  const x2048 = user.displayAvatarURL({ extension: "png", size: 2048 });

  const components = [
    ContainerBuilder.createThumbnail(x256),
    ContainerBuilder.createTextDisplay(`## 🖼️ Avatar of ${user.username}`),
    ContainerBuilder.createSeparator(),
    ContainerBuilder.createTextDisplay(
      `**Download Links:**\n` +
      `[x64](${x64}) • [x128](${x128}) • [x256](${x256}) • [x512](${x512}) • [x1024](${x1024}) • [x2048](${x2048})`
    ),
    ContainerBuilder.createSeparator(),
    ContainerBuilder.createActionRow([
      ContainerBuilder.createButton({
        label: "View Full Size",
        url: x2048,
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
