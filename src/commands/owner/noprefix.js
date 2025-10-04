
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getSettings } = require("@schemas/Guild");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "noprefix",
  description: "Manage users who can use commands without prefix",
  category: "OWNER",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<add|remove|list> [@user]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "add",
        description: "Add a user to no-prefix whitelist",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The user to add",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "Remove a user from no-prefix whitelist",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The user to remove",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: "list",
        description: "List all users in no-prefix whitelist",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args) {
    const settings = await getSettings(message.guild);
    const sub = args[0].toLowerCase();

    if (sub === "add") {
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
      if (!target) return message.safeReply("Please provide a valid user");
      const response = await addUser(settings, target.id, target.user.tag);
      return message.safeReply(response);
    }

    if (sub === "remove") {
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
      if (!target) return message.safeReply("Please provide a valid user");
      const response = await removeUser(settings, target.id, target.user.tag);
      return message.safeReply(response);
    }

    if (sub === "list") {
      const response = await listUsers(settings, message.guild);
      return message.safeReply(response);
    }

    return message.safeReply("Invalid subcommand. Use `add`, `remove`, or `list`");
  },

  async interactionRun(interaction) {
    const settings = await getSettings(interaction.guild);
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const user = interaction.options.getUser("user");
      const response = await addUser(settings, user.id, user.tag);
      return interaction.followUp(response);
    }

    if (sub === "remove") {
      const user = interaction.options.getUser("user");
      const response = await removeUser(settings, user.id, user.tag);
      return interaction.followUp(response);
    }

    if (sub === "list") {
      const response = await listUsers(settings, interaction.guild);
      return interaction.followUp(response);
    }
  },
};

async function addUser(settings, userId, userTag) {
  if (!settings.developers) settings.developers = [];
  
  if (settings.developers.includes(userId)) {
    return `${userTag} is already in the no-prefix whitelist!`;
  }

  settings.developers.push(userId);
  await settings.save();
  return `Successfully added ${userTag} to the no-prefix whitelist!`;
}

async function removeUser(settings, userId, userTag) {
  if (!settings.developers || !settings.developers.includes(userId)) {
    return `${userTag} is not in the no-prefix whitelist!`;
  }

  settings.developers = settings.developers.filter(id => id !== userId);
  await settings.save();
  return `Successfully removed ${userTag} from the no-prefix whitelist!`;
}

async function listUsers(settings, guild) {
  if (!settings.developers || settings.developers.length === 0) {
    return "No users in the no-prefix whitelist!";
  }

  const embed = new EmbedBuilder()
    .setTitle("No-Prefix Whitelist")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(
      settings.developers
        .map((userId, index) => {
          const user = guild.members.cache.get(userId);
          return `${index + 1}. ${user ? user.user.tag : userId}`;
        })
        .join("\n")
    );

  return { embeds: [embed] };
}
