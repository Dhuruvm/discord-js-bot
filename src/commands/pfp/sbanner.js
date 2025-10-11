const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "sbanner",
  description: "Set the server banner for the bot in this server",
  category: "PFP",
  userPermissions: ["ManageGuild"],
  botPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<image_url>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "image_url",
        description: "Image URL or attach an image",
        type: 3,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    let imageUrl;

    // Check if it's a URL
    if (args[0].startsWith("http")) {
      imageUrl = args[0];
    }
    // Check for attachments
    else if (message.attachments.size > 0) {
      imageUrl = message.attachments.first().url;
    } 
    else {
      return message.safeReply(
        ContainerBuilder.error(
          "Invalid Input",
          "Please provide an image URL or attach an image!",
          0xFF0000
        )
      );
    }

    try {
      await message.guild.members.me.setBanner(imageUrl);

      return message.safeReply(
        ContainerBuilder.success(
          "Server Banner Updated!",
          `Bot's banner has been updated in ${message.guild.name}!`,
          0x00FF00,
          [
            {
              label: "View Profile",
              url: `https://discord.com/users/${message.client.user.id}`,
              style: "Link"
            }
          ]
        )
      );
    } catch (error) {
      console.error("Error setting server banner:", error);
      return message.safeReply(
        ContainerBuilder.error(
          "Failed to Update Banner",
          `Error: ${error.message}\n\nNote: Your bot may need Nitro to set a banner.`,
          0xFF0000
        )
      );
    }
  },

  async interactionRun(interaction) {
    const imageUrl = interaction.options.getString("image_url");

    try {
      await interaction.guild.members.me.setBanner(imageUrl);

      return interaction.followUp(
        ContainerBuilder.success(
          "Server Banner Updated!",
          `Bot's banner has been updated in ${interaction.guild.name}!`,
          0x00FF00,
          [
            {
              label: "View Profile",
              url: `https://discord.com/users/${interaction.client.user.id}`,
              style: "Link"
            }
          ]
        )
      );
    } catch (error) {
      console.error("Error setting server banner:", error);
      return interaction.followUp(
        ContainerBuilder.error(
          "Failed to Update Banner",
          `Error: ${error.message}\n\nNote: Your bot may need Nitro to set a banner.`,
          0xFF0000
        )
      );
    }
  },
};
