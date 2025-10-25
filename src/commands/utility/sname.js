const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "sname",
  description: "Change the server name",
  category: "UTILITY",
  botPermissions: ["ManageGuild"],
  userPermissions: ["ManageGuild"],
  cooldown: 30,
  command: {
    enabled: true,
    usage: "<new name>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "name",
        description: "The new server name",
        type: 3,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const newName = args.join(" ");

    if (!newName || newName.trim().length === 0) {
      return message.safeReply(
        ContainerBuilder.error(
          "Invalid Name",
          "Please provide a valid server name.\n\nUsage: `!sname <new name>`",
          0xFF0000
        )
      );
    }

    if (newName.length > 100) {
      return message.safeReply(
        ContainerBuilder.error(
          "Name Too Long",
          "Server name must be 100 characters or less",
          0xFF0000
        )
      );
    }

    await changeServerName(message, newName, false);
  },

  async interactionRun(interaction) {
    await interaction.deferReply();
    const newName = interaction.options.getString("name");

    if (!newName || newName.trim().length === 0) {
      return interaction.editReply(
        ContainerBuilder.error(
          "Invalid Name",
          "Please provide a valid server name",
          0xFF0000
        )
      );
    }

    if (newName.length > 100) {
      return interaction.editReply(
        ContainerBuilder.error(
          "Name Too Long",
          "Server name must be 100 characters or less",
          0xFF0000
        )
      );
    }

    await changeServerName(interaction, newName, true);
  },
};

async function changeServerName(source, newName, isInteraction) {
  try {
    const oldName = source.guild.name;
    await source.guild.setName(newName.trim());

    const successMsg = ContainerBuilder.success(
      "Server Name Updated",
      `**Old Name:** ${oldName}\n**New Name:** ${newName.trim()}\n**Changed by:** ${isInteraction ? source.user.tag : source.author.tag}`,
      0x00FF00
    );

    return isInteraction ? source.editReply(successMsg) : source.channel.send(successMsg);
  } catch (error) {
    console.error("Server name change error:", error);
    
    const errorMsg = error.code === 50035
      ? "Invalid server name format!"
      : `Failed to change server name: ${error.message}`;

    return isInteraction
      ? source.editReply(ContainerBuilder.error("Error", errorMsg, 0xFF0000))
      : source.safeReply(ContainerBuilder.error("Error", errorMsg, 0xFF0000));
  }
}
