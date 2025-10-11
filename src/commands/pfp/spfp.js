const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "spfp",
  description: "Set the server profile picture for the bot in this server",
  category: "PFP",
  userPermissions: ["ManageGuild"],
  botPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<@user or image_url>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "source",
        description: "User mention or image URL",
        type: 3,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    let imageUrl;

    // Check if it's a user mention
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser) {
      imageUrl = mentionedUser.displayAvatarURL({ extension: "png", size: 1024 });
    } 
    // Check if it's a URL
    else if (args[0].startsWith("http")) {
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
          "Please provide a user mention, image URL, or attach an image!",
          0xFF0000
        )
      );
    }

    try {
      await message.guild.members.me.setAvatar(imageUrl);

      return message.safeReply(
        ContainerBuilder.success(
          "Server Profile Updated!",
          `Bot's profile picture has been updated in ${message.guild.name}!`,
          0x00FF00,
          [
            {
              label: "View Avatar",
              url: message.guild.members.me.displayAvatarURL({ size: 1024 }),
              style: "Link"
            }
          ]
        )
      );
    } catch (error) {
      console.error("Error setting server avatar:", error);
      return message.safeReply(
        ContainerBuilder.error(
          "Failed to Update Avatar",
          `Error: ${error.message}`,
          0xFF0000
        )
      );
    }
  },

  async interactionRun(interaction) {
    const source = interaction.options.getString("source");
    let imageUrl;

    // Check if it's a user mention
    const userIdMatch = source.match(/<@!?(\d+)>/);
    if (userIdMatch) {
      const user = await interaction.client.users.fetch(userIdMatch[1]);
      imageUrl = user.displayAvatarURL({ extension: "png", size: 1024 });
    }
    // Assume it's a URL
    else {
      imageUrl = source;
    }

    try {
      await interaction.guild.members.me.setAvatar(imageUrl);

      return interaction.followUp(
        ContainerBuilder.success(
          "Server Profile Updated!",
          `Bot's profile picture has been updated in ${interaction.guild.name}!`,
          0x00FF00,
          [
            {
              label: "View Avatar",
              url: interaction.guild.members.me.displayAvatarURL({ size: 1024 }),
              style: "Link"
            }
          ]
        )
      );
    } catch (error) {
      console.error("Error setting server avatar:", error);
      return interaction.followUp(
        ContainerBuilder.error(
          "Failed to Update Avatar",
          `Error: ${error.message}`,
          0xFF0000
        )
      );
    }
  },
};
