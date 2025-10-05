const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "developer",
  description: "Manage bot developers",
  category: "OWNER",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["dev", "devmode"],
    usage: "<add|remove|list> [user]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "add",
        description: "Add a developer",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The user to add as developer",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "Remove a developer",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The user to remove from developers",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: "list",
        description: "List all developers",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args) {
    const action = args[0].toLowerCase();

    if (action === "list") {
      return await listDevelopers(message);
    }

    if (action === "add") {
      const target = await message.guild.resolveMember(args[1]);
      if (!target) return message.safeReply("Please provide a valid user.");
      return await addDeveloper(message, target.id);
    }

    if (action === "remove") {
      const target = await message.guild.resolveMember(args[1]);
      if (!target) return message.safeReply("Please provide a valid user.");
      return await removeDeveloper(message, target.id);
    }

    await message.safeReply("Invalid action. Use `add`, `remove`, or `list`.");
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "list") {
      return await listDevelopers(interaction);
    }

    if (sub === "add") {
      const user = interaction.options.getUser("user");
      return await addDeveloper(interaction, user.id);
    }

    if (sub === "remove") {
      const user = interaction.options.getUser("user");
      return await removeDeveloper(interaction, user.id);
    }
  },
};

async function addDeveloper({ client, guild }, userId) {
  try {
    let settings = await client.database.schemas.Guild.findOne({ _id: "GLOBAL_SETTINGS" });

    if (!settings) {
      settings = new client.database.schemas.Guild({
        _id: "GLOBAL_SETTINGS",
        developers: [],
      });
    }

    if (!settings.developers) {
      settings.developers = [];
    }

    if (settings.developers.includes(userId)) {
      return { content: "This user is already a developer!" };
    }

    settings.developers.push(userId);
    await settings.save();

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`✅ Successfully added <@${userId}> as a developer!`)
      .setTimestamp();

    return { embeds: [embed] };
  } catch (error) {
    client.logger.error("Error adding developer:", error);
    return { content: "An error occurred while adding the developer." };
  }
}

async function removeDeveloper({ client }, userId) {
  try {
    const settings = await client.database.schemas.Guild.findOne({ _id: "GLOBAL_SETTINGS" });

    if (!settings || !settings.developers || settings.developers.length === 0) {
      return { content: "There are no developers to remove!" };
    }

    if (!settings.developers.includes(userId)) {
      return { content: "This user is not a developer!" };
    }

    settings.developers = settings.developers.filter(id => id !== userId);
    await settings.save();

    const embed = new EmbedBuilder()
      .setColor("Orange")
      .setDescription(`✅ Successfully removed <@${userId}> from developers!`)
      .setTimestamp();

    return { embeds: [embed] };
  } catch (error) {
    client.logger.error("Error removing developer:", error);
    return { content: "An error occurred while removing the developer." };
  }
}

async function listDevelopers({ client, interaction }) {
  try {
    const settings = await client.database.schemas.Guild.findOne({ _id: "GLOBAL_SETTINGS" });
    const developers = settings?.developers || [];

    const founderId = "1354287041772392478";
    let devList = `👑 **Founder:** <@${founderId}>\n`;

    if (developers.length > 0) {
      devList += `\n💻 **Developers:**\n`;
      developers.forEach((id, index) => {
        devList += `${index + 1}. <@${id}>\n`;
      });
    } else {
      devList += `\n💻 **Developers:** None`;
    }

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Bot Developers")
      .setDescription(devList)
      .setTimestamp();

    return { embeds: [embed] };
  } catch (error) {
    client.logger.error("Error fetching developers:", error);
    return { content: "An error occurred while fetching developers." };
  }
}