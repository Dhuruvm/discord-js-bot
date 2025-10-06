const { CommandCategory, BotClient } = require("@src/structures");
const { SUPPORT_SERVER, OWNER_IDS, DEVELOPER } = require("@root/config.js");
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Message,
  ButtonBuilder,
  CommandInteraction,
  ApplicationCommandOptionType,
  ButtonStyle,
} = require("discord.js");
const { getCommandUsage, getSlashUsage } = require("@handlers/command");
const emojis = require("@root/emojis.json");

const IDLE_TIMEOUT = 120;

module.exports = {
  name: "help",
  description: "Interactive help menu with all commands",
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["h", "commands"],
    usage: "[command]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "command",
        description: "name of the command",
        required: false,
        type: ApplicationCommandOptionType.String,
      },
    ],
  },

  async messageRun(message, args, data) {
    let trigger = args[0];

    if (!trigger) {
      const response = await getHelpMenu({ ...message }, data.prefix);
      const sentMsg = await message.channel.send(response);
      return waiter(sentMsg, message.author.id, data.prefix);
    }

    const cmd = message.client.getCommand(trigger);
    if (cmd) {
      const embed = getCommandUsage(cmd, data.prefix, trigger);
      return message.channel.send({ embeds: [embed] });
    }

    const direction = trigger?.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(CommandCategory, direction)) {
      const categoryResponse = getCategoryEmbed(message.client, direction, data.prefix);
      const backRow = getBackButton();

      return message.channel.send({
        ...categoryResponse,
        components: [...categoryResponse.components, backRow],
      });
    }

    await message.channel.send(`${emojis.error} No command or category found matching your input`);
  },

  async interactionRun(interaction) {
    let cmdName = interaction.options.getString("command");

    if (!cmdName) {
      const response = await getHelpMenu({ ...interaction });
      const sentMsg = await interaction.followUp(response);
      return waiter(sentMsg, interaction.user.id);
    }

    const cmd = interaction.client.slashCommands.get(cmdName);
    if (cmd) {
      const embed = getSlashUsage(cmd);
      return interaction.followUp({ embeds: [embed] });
    }

    await interaction.followUp(`${emojis.error} No matching command found`);
  },
};

async function getHelpMenu({ client, guild, author, user }, prefix) {
  const displayUser = author || user;
  const isOwner = OWNER_IDS.includes(displayUser?.id);

  const categoryMapping = {
    'ADMIN': { emoji: emojis.admin || '⚙️', name: 'Admin' },
    'AUTOMOD': { emoji: emojis.moderation || '🛡️', name: 'Auto Moderation' },
    'MUSIC': { emoji: emojis.music || '🎵', name: 'Music' },
    'MODERATION': { emoji: emojis.moderation || '🔨', name: 'Moderation' },
    'GIVEAWAY': { emoji: emojis.giveaway || '🎁', name: 'Giveaway' },
    'TICKET': { emoji: emojis.ticket || '🎟️', name: 'Ticket' },
    'UTILITY': { emoji: emojis.utility || '🛠️', name: 'Utility' },
    'SOCIAL': { emoji: '🫂', name: 'Social' },
    'STATS': { emoji: emojis.stats || '📊', name: 'Statistics' },
    'ECONOMY': { emoji: emojis.economy || '💰', name: 'Economy' },
    'SUGGESTION': { emoji: '📝', name: 'Suggestion' },
    'IMAGE': { emoji: '🖼️', name: 'Image' },
    'INVITE': { emoji: emojis.invite || '📨', name: 'Invite' },
    'FUN': { emoji: emojis.fun || '✨', name: 'Fun' },
    'GRAPHICS': { emoji: '🎨', name: 'Graphics' },
    'ANIME': { emoji: '🎨', name: 'Anime' },
    'BOT': { emoji: emojis.bot || '🤖', name: 'Bot' },
    'INFORMATION': { emoji: emojis.info || 'ℹ️', name: 'Information' },
  };

  const prefixText = prefix || '!';
  
  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setAuthor({ 
      name: `${client?.user?.username || 'Bot'} Command Menu`,
      iconURL: client?.user?.displayAvatarURL()
    })
    .setDescription(
      `${emojis.info} **an asterisk(*) means the command has subcommands**\n\n` +
      `${emojis.arrow_right} *View ${client?.user?.username || 'bot'} commands using the menu below.*\n\n` +
      `${emojis.docs} *Or view the commands on our* [**Docs**](${SUPPORT_SERVER})`
    )
    .addFields(
      { 
        name: `${emojis.support} Need Extra Help?`, 
        value: `${emojis.arrow_right} Visit our [**Support Server**](${SUPPORT_SERVER}) on how to get started\n${emojis.arrow_right} Developer: **${DEVELOPER}**`, 
        inline: false 
      }
    )
    .setFooter({ text: "Powered by Blackbit Studio" });

  if (client?.user?.displayAvatarURL()) {
    embed.setThumbnail(client.user.displayAvatarURL());
  }

  const menuRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("help-menu")
      .setPlaceholder(`${client?.user?.username || 'Bot'} Command Modules`)
      .addOptions(
        Object.entries(CommandCategory)
          .filter(([k, v]) => v.enabled !== false && (k !== 'OWNER' || isOwner))
          .map(([k, v]) => {
            const mapping = categoryMapping[k] || { name: v.name, emoji: '📁' };
            return {
              label: mapping.name,
              value: k,
              description: `View commands in ${mapping.name} category`,
              emoji: mapping.emoji,
            };
          })
      )
  );

  return {
    embeds: [embed],
    components: [menuRow]
  };
}

const waiter = (msg, userId, prefix) => {
  const collector = msg.channel.createMessageComponentCollector({
    filter: (reactor) => reactor.user.id === userId && msg.id === reactor.message.id,
    idle: IDLE_TIMEOUT * 1000,
    dispose: true,
    time: 10 * 60 * 1000,
  });

  let currentComponents = msg.components;

  collector.on("collect", async (response) => {
    await response.deferUpdate();

    switch (response.customId) {
      case "home-btn": {
        const homeResponse = await getHelpMenu({ client: msg.client, guild: msg.guild, user: response.user }, prefix);
        currentComponents = homeResponse.components;
        msg.editable && (await msg.edit(homeResponse));
        break;
      }

      case "help-menu": {
        const cat = response.values[0].toUpperCase();
        const categoryResponse = getCategoryEmbed(msg.client, cat, prefix);
        const backRow = getBackButton();
        currentComponents = [backRow];
        msg.editable && (await msg.edit({ embeds: categoryResponse.embeds, components: currentComponents }));
        break;
      }
    }
  });

  collector.on("end", () => {
    if (!msg.guild || !msg.channel) return;

    const disabledComponents = currentComponents.map(row => {
      const newRow = new ActionRowBuilder();
      const rowJson = row.toJSON();
      rowJson.components.forEach(componentData => {
        if (componentData.type === 2 && componentData.style === 5) {
          newRow.addComponents(ButtonBuilder.from(componentData));
        } else if (componentData.type === 3) {
          newRow.addComponents(
            StringSelectMenuBuilder.from(componentData).setDisabled(true)
          );
        } else if (componentData.type === 2) {
          newRow.addComponents(
            ButtonBuilder.from(componentData).setDisabled(true)
          );
        }
      });
      return newRow;
    });

    return msg.editable && msg.edit({ components: disabledComponents });
  });
};

function getCategoryEmbed(client, category, prefix) {
  const commands = client.commands.filter((cmd) => cmd.category === category);
  
  const categoryMapping = {
    'ADMIN': { name: 'Admin', emoji: emojis.admin || '⚙️' },
    'AUTOMOD': { name: 'Auto Moderation', emoji: emojis.moderation || '🛡️' },
    'MUSIC': { name: 'Music', emoji: emojis.music || '🎵' },
    'MODERATION': { name: 'Moderation', emoji: emojis.moderation || '🔨' },
    'GIVEAWAY': { name: 'Giveaway', emoji: emojis.giveaway || '🎁' },
    'TICKET': { name: 'Ticket', emoji: emojis.ticket || '🎟️' },
    'UTILITY': { name: 'Utility', emoji: emojis.utility || '🛠️' },
    'SOCIAL': { name: 'Social', emoji: '🫂' },
    'STATS': { name: 'Statistics', emoji: emojis.stats || '📊' },
    'ECONOMY': { name: 'Economy', emoji: emojis.economy || '💰' },
    'SUGGESTION': { name: 'Suggestion', emoji: '📝' },
    'IMAGE': { name: 'Image', emoji: '🖼️' },
    'INVITE': { name: 'Invite', emoji: emojis.invite || '📨' },
    'FUN': { name: 'Fun', emoji: emojis.fun || '✨' },
    'GRAPHICS': { name: 'Graphics', emoji: '🎨' },
    'ANIME': { name: 'Anime', emoji: '🎨' },
    'BOT': { name: 'Bot', emoji: emojis.bot || '🤖' },
    'INFORMATION': { name: 'Information', emoji: emojis.info || 'ℹ️' },
  };

  const categoryInfo = CommandCategory[category];
  const mapping = categoryMapping[category] || { name: categoryInfo?.name, emoji: '📁' };

  if (commands.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setTitle(`${mapping.emoji} ${mapping.name}`)
      .setDescription(`${emojis.info} This category is currently empty. Check back later for new commands!`)
      .setFooter({ text: "Powered by Blackbit Studio" });
    return { embeds: [embed] };
  }

  const commandsList = commands.map(cmd => {
    if (cmd.command.subcommands && cmd.command.subcommands.length > 0) {
      return cmd.command.subcommands.map(sub => {
        const trigger = sub.trigger.split(' ')[0];
        return `${emojis.arrow_right} \`${cmd.name} ${trigger}\` *`;
      }).join('\n');
    }
    return `${emojis.arrow_right} \`${cmd.name}\``;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setTitle(`${mapping.emoji} ${mapping.name}`)
    .setDescription(commandsList)
    .setFooter({ text: `Use ${prefix || '!'}help <command> for more info • Powered by Blackbit Studio` });

  return { embeds: [embed] };
}

function getBackButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("home-btn")
      .setLabel("Back")
      .setEmoji(emojis.arrow_left || "◀️")
      .setStyle(ButtonStyle.Secondary)
  );
}
