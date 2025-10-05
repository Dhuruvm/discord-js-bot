const { commandHandler, automodHandler, statsHandler } = require("@src/handlers");
const { PREFIX_COMMANDS, OWNER_IDS, SUPPORT_SERVER } = require("@root/config");
const { getSettings } = require("@schemas/Guild");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType
} = require("discord.js");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;
  const settings = await getSettings(message.guild);

  // AFK check
  try {
    const afkCommand = require("@src/commands/utility/afk");
    if (afkCommand.checkAFK) afkCommand.checkAFK(message);
  } catch (err) {
    // AFK command not loaded
  }

  // command handler
  let isCommand = false;
  if (PREFIX_COMMANDS.ENABLED) {
    // check for bot mentions
    if (message.content.includes(`${client.user.id}`)) {
      const { EmbedBuilder } = require("discord.js");
      const { SUPPORT_SERVER } = require("@root/config");

      const introEmbed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setAuthor({
          name: `${client.user.username} - Your Server Assistant`,
          iconURL: client.user.displayAvatarURL()
        })
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .setDescription(
          `👋 **Hello! I'm ${client.user.username}**\n\n` +
          `I'm a powerful multipurpose Discord bot designed to help manage and enhance your server with a wide range of features!\n\n` +
          `**🎯 Key Features:**\n` +
          `• **Moderation** - Keep your server safe and organized\n` +
          `• **Music** - High-quality music playback\n` +
          `• **Economy** - Fun currency and ranking system\n` +
          `• **Leveling** - Track user activity and engagement\n` +
          `• **Giveaways** - Host exciting giveaways\n` +
          `• **Tickets** - Professional support system\n` +
          `• **And much more!**`
        )
        .addFields(
          {
            name: "📝 Getting Started",
            value: `My prefix is: \`${settings.prefix}\`\nUse \`${settings.prefix}help\` to see all commands`,
            inline: true
          },
          {
            name: "🔗 Quick Links",
            value: `[Invite Me](${client.getInvite()})${SUPPORT_SERVER ? ` • [Support Server](${SUPPORT_SERVER})` : ''}`,
            inline: true
          }
        )
        .setFooter({ text: "Powered by Blackbit Studio" })
        .setTimestamp();

      return message.channel.send({ embeds: [introEmbed] });
    }

    // Check for no-prefix commands (for owners and whitelisted users only)
    const isOwner = OWNER_IDS.includes(message.author.id);
    const isWhitelisted = settings.developers && settings.developers.includes(message.author.id);

    if ((isOwner || isWhitelisted) && message.content && !message.content.startsWith(settings.prefix)) {
      const invoke = message.content.split(/\s+/)[0];
      const cmd = client.getCommand(invoke);
      if (cmd) {
        isCommand = true;
        commandHandler.handlePrefixCommand(message, cmd, settings);
      }
    }

    // Check for regular prefix commands
    if (!isCommand && message.content && message.content.startsWith(settings.prefix)) {
      const invoke = message.content.replace(`${settings.prefix}`, "").split(/\s+/)[0];
      const cmd = client.getCommand(invoke);
      if (cmd) {
        isCommand = true;
        commandHandler.handlePrefixCommand(message, cmd, settings);
      }
    }
  }

  // stats handler
  if (settings.stats.enabled) await statsHandler.trackMessageStats(message, isCommand, settings);

  // if not a command
  if (!isCommand) await automodHandler.performAutomod(message, settings);
};