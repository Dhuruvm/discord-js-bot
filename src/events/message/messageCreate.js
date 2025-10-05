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
        .setColor("#FFFFFF")
        .setAuthor({ 
          name: `🐛 ${client.user.username} Quick Start Guide`,
          iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
          `**Welcome to ${client.user.username}**\n\n` +
          `👋 **Get Started**\n` +
          `Use \`${settings.prefix}help\` to explore all available commands and features.\n\n` +
          `💡 **Quick Actions**\n` +
          `• View Commands: \`${settings.prefix}help\`\n` +
          `• Get Support: Join our Support Server\n` +
          `• Invite Bot: Add ${client.user.username} to your servers\n\n` +
          `⭐ **Premium Features**\n` +
          `Unlock advanced automod, priority updates, 24/7 protection, and exclusive tools with ${client.user.username} Premium.`
        )
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ 
          text: "Powered by Blackbit Studio",
          iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Help Menu")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("bot-help-menu")
          .setEmoji("📋"),
        new ButtonBuilder()
          .setLabel("Support Server")
          .setStyle(ButtonStyle.Link)
          .setURL(SUPPORT_SERVER || "https://discord.gg/mvusstXJS")
          .setEmoji("💬")
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(`Invite ${client.user.username}`)
          .setStyle(ButtonStyle.Link)
          .setURL(client.getInvite ? client.getInvite() : `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
          .setEmoji("🔗"),
        new ButtonBuilder()
          .setLabel("Premium")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("bot-premium-info")
          .setEmoji("⭐")
      );

      message.channel.safeSend({ embeds: [embed], components: [row1, row2] });
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
