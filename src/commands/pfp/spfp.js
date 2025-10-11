const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "spfp",
  description: "Set the bot's global profile picture (affects all servers)",
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
    else if (args[0] && args[0].startsWith("http")) {
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
      // Note: Discord bots can only have ONE global avatar, not per-server avatars
      // This changes the bot's avatar globally
      await message.client.user.setAvatar(imageUrl);

      return message.safeReply(
        ContainerBuilder.success(
          "Global Bot Avatar Updated!",
          `Bot's profile picture has been updated globally!\n\n⚠️ **Note:** Discord bots cannot have per-server avatars. This change affects the bot everywhere.`,
          0x00FF00,
          [
            {
              label: "View Avatar",
              url: message.client.user.displayAvatarURL({ size: 1024 }),
              style: "Link"
            }
          ]
        )
      );
    } catch (error) {
      console.error("Error setting bot avatar:", error);
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
      // Note: Discord bots can only have ONE global avatar, not per-server avatars
      // This changes the bot's avatar globally
      await interaction.client.user.setAvatar(imageUrl);

      return interaction.followUp(
        ContainerBuilder.success(
          "Global Bot Avatar Updated!",
          `Bot's profile picture has been updated globally!\n\n⚠️ **Note:** Discord bots cannot have per-server avatars. This change affects the bot everywhere.`,
          0x00FF00,
          [
            {
              label: "View Avatar",
              url: interaction.client.user.displayAvatarURL({ size: 1024 }),
              style: "Link"
            }
          ]
        )
      );
    } catch (error) {
      console.error("Error setting bot avatar:", error);
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
