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
      // Create a simple embed response instead of Components V2
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({ 
          name: `${client.user.username} Quick Start Guide`,
          iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
          `Welcome to **${client.user.username}**! Your all-in-one Discord companion for moderation, entertainment, and server management.`
        )
        .addFields(
          {
            name: '👋 Get Started',
            value: `Use \`${settings.prefix}help\` to explore all available commands and features. Our intuitive command system makes server management effortless.`,
            inline: false
          },
          {
            name: '💡 Quick Actions',
            value: `**Join Our Community**\nGet support, share feedback, and connect with other users in our Support Server.\n\n**Invite to Your Server**\nAdd ${client.user.username} to enhance your Discord servers with powerful features.`,
            inline: false
          },
          {
            name: '⭐ Premium Features',
            value: `Unlock **advanced auto-moderation**, priority support, 24/7 protection, exclusive commands, and enhanced customization options with ${client.user.username} Premium.`,
            inline: false
          }
        )
        .setFooter({ text: `Powered by Blackbit Studio` })
        .setTimestamp();

      // Link buttons row
      const linkRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel("Invite Bot")
            .setStyle(ButtonStyle.Link)
            .setURL(client.getInvite())
            .setEmoji("🔗"),
          new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL(SUPPORT_SERVER)
            .setEmoji("💬"),
          new ButtonBuilder()
            .setLabel("Help Command")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("bot-help-menu")
            .setEmoji("📚")
        );

      return message.reply({ 
        embeds: [embed],
        components: [linkRow]
      });
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