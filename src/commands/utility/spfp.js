const { AttachmentBuilder } = require("discord.js");
const { getBuffer } = require("@helpers/HttpUtils");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "spfp",
  description: "Change the server icon",
  category: "UTILITY",
  botPermissions: ["ManageGuild"],
  userPermissions: ["ManageGuild"],
  cooldown: 30,
  command: {
    enabled: true,
    usage: "<image-url or attachment>",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "image",
        description: "URL of the new server icon",
        type: 3,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    let imageUrl = args[0];

    if (!imageUrl && message.attachments.size > 0) {
      const attachment = message.attachments.first();
      if (attachment.contentType?.startsWith("image/")) {
        imageUrl = attachment.url;
      }
    }

    if (!imageUrl) {
      return message.safeReply(
        ContainerBuilder.error(
          "No Image Provided",
          "Please provide an image URL or attach an image file.\n\nUsage: `!spfp <url>` or attach an image",
          0xFF0000
        )
      );
    }

    await changeServerIcon(message, imageUrl, false);
  },

  async interactionRun(interaction) {
    await interaction.deferReply();
    
    const imageUrl = interaction.options.getString("image");
    const attachment = interaction.options.get("attachment")?.attachment;

    let finalUrl = imageUrl;
    if (!finalUrl && attachment) {
      if (attachment.contentType?.startsWith("image/")) {
        finalUrl = attachment.url;
      }
    }

    if (!finalUrl) {
      return interaction.editReply(
        ContainerBuilder.error(
          "No Image Provided",
          "Please provide an image URL or attach an image file",
          0xFF0000
        )
      );
    }

    await changeServerIcon(interaction, finalUrl, true);
  },
};

async function changeServerIcon(source, imageUrl, isInteraction) {
  try {
    const response = await getBuffer(imageUrl);

    if (!response.success || !response.buffer) {
      return isInteraction
        ? source.editReply(
            ContainerBuilder.error(
              "Invalid Image",
              "Failed to download the image. Please provide a valid image URL",
              0xFF0000
            )
          )
        : source.safeReply(
            ContainerBuilder.error(
              "Invalid Image",
              "Failed to download the image. Please provide a valid image URL",
              0xFF0000
            )
          );
    }

    const oldIcon = source.guild.iconURL();
    await source.guild.setIcon(response.buffer);

    const successMsg = ContainerBuilder.success(
      "Server Icon Updated",
      `**Server:** ${source.guild.name}\n**Changed by:** ${isInteraction ? source.user.tag : source.author.tag}${oldIcon ? `\n**Previous Icon:** [View Old Icon](${oldIcon})` : ""}`,
      0x00FF00
    );

    return isInteraction ? source.editReply(successMsg) : source.channel.send(successMsg);
  } catch (error) {
    console.error("Server icon change error:", error);
    
    const errorMsg = error.code === 50035
      ? "Image is too large! Please use an image smaller than 10MB"
      : `Failed to change server icon: ${error.message}`;

    return isInteraction
      ? source.editReply(ContainerBuilder.error("Error", errorMsg, 0xFF0000))
      : source.safeReply(ContainerBuilder.error("Error", errorMsg, 0xFF0000));
  }
}
