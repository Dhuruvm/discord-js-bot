const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "sname",
  description: "Set the server nickname for the bot in this server",
  category: "PFP",
  userPermissions: ["ManageGuild"],
  botPermissions: ["ChangeNickname"],
  command: {
    enabled: true,
    usage: "<new_name>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "name",
        description: "New server nickname for the bot",
        type: 3,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const newName = args.join(" ");

    if (newName.length > 32) {
      return message.safeReply(
        ContainerBuilder.error(
          "Name Too Long",
          "Server nicknames must be 32 characters or less!",
          0xFF0000
        )
      );
    }

    try {
      const oldName = message.guild.members.me.displayName;
      await message.guild.members.me.setNickname(newName);

      return message.safeReply(
        ContainerBuilder.success(
          "Server Name Updated!",
          `Bot's nickname has been changed from **${oldName}** to **${newName}** in ${message.guild.name}!`,
          0x00FF00
        )
      );
    } catch (error) {
      console.error("Error setting server nickname:", error);
      return message.safeReply(
        ContainerBuilder.error(
          "Failed to Update Nickname",
          `Error: ${error.message}`,
          0xFF0000
        )
      );
    }
  },

  async interactionRun(interaction) {
    const newName = interaction.options.getString("name");

    if (newName.length > 32) {
      return interaction.followUp(
        ContainerBuilder.error(
          "Name Too Long",
          "Server nicknames must be 32 characters or less!",
          0xFF0000
        )
      );
    }

    try {
      const oldName = interaction.guild.members.me.displayName;
      await interaction.guild.members.me.setNickname(newName);

      return interaction.followUp(
        ContainerBuilder.success(
          "Server Name Updated!",
          `Bot's nickname has been changed from **${oldName}** to **${newName}** in ${interaction.guild.name}!`,
          0x00FF00
        )
      );
    } catch (error) {
      console.error("Error setting server nickname:", error);
      return interaction.followUp(
        ContainerBuilder.error(
          "Failed to Update Nickname",
          `Error: ${error.message}`,
          0xFF0000
        )
      );
    }
  },
};
