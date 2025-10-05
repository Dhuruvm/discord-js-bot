
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "emoji",
  description: "manage custom bot emojis",
  category: "OWNER",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["emojis", "emojictl"],
    usage: "<add|remove|list|reload> [key] [emoji]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "add",
        description: "add a custom emoji",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "key",
            description: "emoji key name",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "emoji",
            description: "emoji to use",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "remove a custom emoji",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "key",
            description: "emoji key name to remove",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "list",
        description: "list all custom emojis",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "reload",
        description: "reload emojis from file",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0].toLowerCase();
    let response;

    if (sub === "add") {
      if (args.length < 3) return message.safeReply("Usage: `emoji add <key> <emoji>`");
      const key = args[1].toLowerCase();
      const emoji = args[2];
      response = addEmoji(message.client, key, emoji);
    } else if (sub === "remove") {
      if (args.length < 2) return message.safeReply("Usage: `emoji remove <key>`");
      const key = args[1].toLowerCase();
      response = removeEmoji(message.client, key);
    } else if (sub === "list") {
      response = listEmojis(message.client);
    } else if (sub === "reload") {
      response = reloadEmojis(message.client);
    } else {
      response = "Invalid subcommand. Use `add`, `remove`, `list`, or `reload`.";
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    if (sub === "add") {
      const key = interaction.options.getString("key").toLowerCase();
      const emoji = interaction.options.getString("emoji");
      response = addEmoji(interaction.client, key, emoji);
    } else if (sub === "remove") {
      const key = interaction.options.getString("key").toLowerCase();
      response = removeEmoji(interaction.client, key);
    } else if (sub === "list") {
      response = listEmojis(interaction.client);
    } else if (sub === "reload") {
      response = reloadEmojis(interaction.client);
    }

    await interaction.followUp(response);
  },
};

function addEmoji(client, key, emoji) {
  const success = client.emoji.set(key, emoji);
  
  const embed = new EmbedBuilder()
    .setColor(success ? EMBED_COLORS.SUCCESS : EMBED_COLORS.ERROR)
    .setDescription(
      success
        ? `${client.emoji.get("success")} Successfully added emoji **${key}**: ${emoji}`
        : `${client.emoji.get("error")} Failed to add emoji`
    );

  return { embeds: [embed] };
}

function removeEmoji(client, key) {
  const success = client.emoji.remove(key);

  const embed = new EmbedBuilder()
    .setColor(success ? EMBED_COLORS.SUCCESS : EMBED_COLORS.ERROR)
    .setDescription(
      success
        ? `${client.emoji.get("success")} Successfully removed emoji **${key}**`
        : `${client.emoji.get("error")} Emoji **${key}** not found`
    );

  return { embeds: [embed] };
}

function listEmojis(client) {
  const emojis = client.emoji.list();
  const entries = Object.entries(emojis);

  if (entries.length === 0) {
    return "No custom emojis configured.";
  }

  const description = entries
    .map(([key, emoji]) => `**${key}**: ${emoji}`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Custom Emojis" })
    .setDescription(description)
    .setColor(EMBED_COLORS.BOT_EMBED);

  return { embeds: [embed] };
}

function reloadEmojis(client) {
  client.emoji.reload();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(`${client.emoji.get("success")} Successfully reloaded emojis`);

  return { embeds: [embed] };
}
