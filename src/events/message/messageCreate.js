const { commandHandler, automodHandler, statsHandler } = require("@src/handlers");
const { PREFIX_COMMANDS, OWNER_IDS, SUPPORT_SERVER } = require("@root/config");
const { getSettings } = require("@schemas/Guild");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

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
      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setAuthor({ 
          name: `Get Started with ${client.user.username}! Here are some quick actions to help you out!`,
          iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
          `Looking for commands? Here are some quick actions to help you out!\n\n` +
          `**Need Assistance?**\n` +
          `Check out \`${settings.prefix}help\` for a full list of commands or visit our Support Server to get help and stay updated.\n\n` +
          `**Unlock More Power**\n` +
          `Get advanced features, enhanced automod, priority security updates, 24/7 protection, and exclusive all-in-one tools with ${client.user.username} Premium. Perfect for keeping your community safe and secure!\n\n` +
          `Developed with ❤️ by *Blackbit Studio*`
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Support")
          .setStyle(ButtonStyle.Link)
          .setURL(SUPPORT_SERVER || "https://discord.gg/mvusstXJS")
          .setEmoji("🔗"),
        new ButtonBuilder()
          .setLabel(`Invite ${client.user.username}`)
          .setStyle(ButtonStyle.Link)
          .setURL(client.getInvite ? client.getInvite() : `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
          .setEmoji("🔗")
      );

      message.channel.safeSend({ embeds: [embed], components: [row] });
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
