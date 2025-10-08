const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS, OWNER_IDS } = require("@root/config");
const { getSettings } = require("@schemas/Guild");
const EMOJIS = require("@helpers/EmojiConstants");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "access",
  description: "Manage bot access users (owner only)",
  category: "OWNER",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["bot"],
    usage: "<@user|list> [remove]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
    options: [
      {
        name: "add",
        description: "Grant bot access to a user",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The user to grant bot access",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "Remove bot access from a user",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "The user to remove bot access from",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: "list",
        description: "List all users with bot access",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args) {
    // Handle list command
    if (args[0].toLowerCase() === "list") {
      return await listAccessUsers(message);
    }

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!target) {
      return message.safeReply("Please provide a valid user or use `list` to see all access users.");
    }

    // Check if remove action
    const isRemove = args[1] && args[1].toLowerCase() === "remove";

    if (isRemove) {
      return await removeAccess(message, target);
    } else {
      return await grantAccess(message, target);
    }
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "list") {
      return await listAccessUsers(interaction);
    } else if (sub === "add") {
      const target = interaction.options.getMember("user");
      return await grantAccess(interaction, target);
    } else if (sub === "remove") {
      const target = interaction.options.getMember("user");
      return await removeAccess(interaction, target);
    }
  },
};

async function grantAccess(context, target) {
  if (!target) {
    const content = "User not found in this server.";
    return context.deferred ? context.followUp({ content, ephemeral: true }) : context.safeReply(content);
  }

  if (OWNER_IDS.includes(target.id)) {
    const content = `${EMOJIS.WARN} | ${target.user.tag} is already a bot owner!`;
    return context.deferred ? context.followUp({ content, ephemeral: true }) : context.safeReply(content);
  }

  const settings = await getSettings(context.guild);
  
  if (!settings.developers) settings.developers = [];
  
  if (settings.developers.includes(target.id)) {
    const content = `${EMOJIS.WARN} | ${target.user.tag} already has bot access!`;
    return context.deferred ? context.followUp({ content, ephemeral: true }) : context.safeReply(content);
  }

  settings.developers.push(target.id);
  await settings.save();

  const issuer = context.user || context.author;
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(
      `${EMOJIS.SUCCESS} | **Bot Access Granted**\n\n` +
      `**User:** ${target.user.tag}\n` +
      `**Permissions:**\n` +
      `• Can use commands without prefix\n` +
      `• Full command access (except owner commands)\n` +
      `• All bot features enabled`
    )
    .setTimestamp()
    .setFooter({ text: `Granted by ${issuer.tag}` });

  return context.deferred ? context.followUp({ embeds: [embed] }) : context.safeReply({ embeds: [embed] });
}

async function removeAccess(context, target) {
  if (!target) {
    const content = "User not found in this server.";
    return context.deferred ? context.followUp({ content, ephemeral: true }) : context.safeReply(content);
  }

  const settings = await getSettings(context.guild);
  
  if (!settings.developers || !settings.developers.includes(target.id)) {
    const content = `${EMOJIS.WARN} | ${target.user.tag} doesn't have bot access!`;
    return context.deferred ? context.followUp({ content, ephemeral: true }) : context.safeReply(content);
  }

  settings.developers = settings.developers.filter(id => id !== target.id);
  await settings.save();

  const issuer = context.user || context.author;
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.WARNING)
    .setDescription(
      `${EMOJIS.SUCCESS} | **Bot Access Removed**\n\n` +
      `**User:** ${target.user.tag}\n` +
      `**Removed by:** ${issuer.tag}`
    )
    .setTimestamp();

  return context.deferred ? context.followUp({ embeds: [embed] }) : context.safeReply({ embeds: [embed] });
}

async function listAccessUsers(context) {
  const settings = await getSettings(context.guild);
  const accessUsers = settings.developers || [];

  let description = `**Bot Access Users**\n\n`;
  
  if (accessUsers.length === 0) {
    description += `${EMOJIS.WARN} No users have bot access yet.\n\n`;
  } else {
    description += `Total: ${accessUsers.length}\n\n`;
    for (let i = 0; i < accessUsers.length; i++) {
      const userId = accessUsers[i];
      description += `${i + 1}. <@${userId}> (\`${userId}\`)\n`;
    }
    description += `\n`;
  }

  description += `\n**Bot Owners:**\n`;
  OWNER_IDS.forEach((ownerId, index) => {
    description += `${index + 1}. <@${ownerId}> (\`${ownerId}\`) 👑\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(description)
    .setTimestamp();

  return context.deferred ? context.followUp({ embeds: [embed] }) : context.safeReply({ embeds: [embed] });
}
