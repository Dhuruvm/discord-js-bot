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
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
      const { SUPPORT_SERVER } = require("@root/config");
      const ContainerBuilder = require("@helpers/ContainerBuilder");

      const mainText = ContainerBuilder.createTextDisplay(
        `## 👋 Hello! I'm ${client.user.username}\n\n` +
        `I'm a powerful multipurpose Discord bot designed to help manage and enhance your server with a wide range of features!\n\n` +
        `### 🎯 Key Features:\n` +
        `> • **Moderation** - Keep your server safe and organized\n` +
        `> • **Music** - High-quality music playback\n` +
        `> • **Economy** - Fun currency and ranking system\n` +
        `> • **Leveling** - Track user activity and engagement\n` +
        `> • **Giveaways** - Host exciting giveaways\n` +
        `> • **Tickets** - Professional support system\n` +
        `> • **And much more!**\n\n` +
        `### 📝 Getting Started\n` +
        `> **Prefix:** \`${settings.prefix}\`\n` +
        `> **Help:** \`${settings.prefix}help\``
      );

      const buttons = [];
      buttons.push(
        new ButtonBuilder()
          .setLabel("Invite Me")
          .setEmoji("🔗")
          .setURL(client.getInvite())
          .setStyle(ButtonStyle.Link)
      );

      if (SUPPORT_SERVER) {
        buttons.push(
          new ButtonBuilder()
            .setLabel("Support Server")
            .setEmoji("💬")
            .setURL(SUPPORT_SERVER)
            .setStyle(ButtonStyle.Link)
        );
      }

      const buttonRow = new ActionRowBuilder().addComponents(buttons);

      const payload = new ContainerBuilder()
        .addContainer({ 
          accentColor: 0xFFFFFF, 
          components: [mainText, buttonRow]
        })
        .build();

      return message.channel.send(payload);
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