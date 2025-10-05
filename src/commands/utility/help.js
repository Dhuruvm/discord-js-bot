const { CommandCategory, BotClient } = require("@src/structures");
const { SUPPORT_SERVER, OWNER_IDS } = require("@root/config.js");
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

    await message.channel.send("No command or category found matching your input");
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

    await interaction.followUp("No matching command found");
  },
};

async function getHelpMenu({ client, guild, author, user }, prefix) {
  const mainCategories = [];
  const extraCategories = [];
  const displayUser = author || user;
  const isOwner = OWNER_IDS.includes(displayUser?.id);

  const categoryMapping = {
    'ADMIN': { emoji: '🔒', name: 'AntiNuke' },
    'AUTOMOD': { emoji: '⚡', name: 'Auto Moderation' },
    'MUSIC': { emoji: '🎵', name: 'Music' },
    'MODERATION': { emoji: '🔨', name: 'Moderation' },
    'GIVEAWAY': { emoji: '🎁', name: 'Giveaway' },
    'TICKET': { emoji: '🎟️', name: 'Ticket' },
    'UTILITY': { emoji: '⚙️', name: 'Utility' },
    'SOCIAL': { emoji: '🎊', name: 'Welcomer' },
    'STATS': { emoji: '✨', name: 'Auto Responder' },
    'ECONOMY': { emoji: '💡', name: 'Custom Roles' },
    'SUGGESTION': { emoji: '📝', name: 'Logging' },
    'IMAGE': { emoji: '📸', name: 'Media' },
    'INVITE': { emoji: '🎤', name: 'VCRoles' },
    'FUN': { emoji: '✨', name: 'Fun' },
    'BOT': { emoji: '🤖', name: 'Bot' },
    'INFORMATION': { emoji: '🤖', name: 'Bot' },
  };

  const mainKeys = ['ADMIN', 'AUTOMOD', 'MUSIC', 'MODERATION', 'GIVEAWAY', 'TICKET', 'UTILITY', 'SOCIAL', 'BOT'];

  // Categories are now only displayed in the dropdown menu

  const prefixText = prefix || '?';
  
  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setAuthor({ 
      name: `${client?.user?.username || 'Bot'} Command Menu`,
      iconURL: client?.user?.displayAvatarURL()
    })
    .setDescription(
      `• **an asterisk(*) means the command has subcommands**\n` +
      `• *View ${client?.user?.username || 'bot'} commands using the menu below.*\n` +
      `• *Or view the commands on our [**\` Docs \`**](https://github.com/encrypment)*`
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
            const mapping = categoryMapping[k] || { emoji: v.emoji, name: v.name };
            return {
              label: mapping.name,
              value: k,
              description: `View commands in ${mapping.name} category`,
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

function getModuleEmbed(client, type, prefix, userId) {
  const isOwner = OWNER_IDS.includes(userId);
  const mainKeys = ['ADMIN', 'AUTOMOD', 'MUSIC', 'MODERATION', 'GIVEAWAY', 'TICKET', 'UTILITY', 'SOCIAL'];
  const categories = type === "main" ? mainKeys : 
    Object.keys(CommandCategory).filter(k => !mainKeys.includes(k) && CommandCategory[k].enabled !== false && (k !== 'OWNER' || isOwner));

  const categoryMapping = {
    'ADMIN': { name: 'AntiNuke' },
    'AUTOMOD': { name: 'Auto Moderation' },
    'MUSIC': { name: 'Music' },
    'MODERATION': { name: 'Moderation' },
    'GIVEAWAY': { name: 'Giveaway' },
    'TICKET': { name: 'Ticket' },
    'UTILITY': { name: 'Utility' },
    'SOCIAL': { name: 'Welcomer' },
    'STATS': { name: 'Auto Responder' },
    'ECONOMY': { name: 'Custom Roles' },
    'SUGGESTION': { name: 'Logging' },
    'IMAGE': { name: 'Media' },
    'INVITE': { name: 'VCRoles' },
    'FUN': { name: 'Fun' },
    'INFORMATION': { name: 'Bot' },
  };

  const categoryList = categories
    .filter(k => CommandCategory[k])
    .filter(k => k !== 'OWNER' || isOwner)
    .map(k => {
      const mapping = categoryMapping[k] || { name: CommandCategory[k].name };
      return `• ${mapping.name}`;
    })
    .join('\n');

  const moduleTitle = type.charAt(0).toUpperCase() + type.slice(1);

  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setTitle(`${moduleTitle} Modules`)
    .setDescription(categoryList)
    .setFooter({ text: "Powered by Blackbit Studio" });

  return { embeds: [embed] };
}

function getCategoryEmbed(client, category, prefix) {
  const commands = client.commands.filter((cmd) => cmd.category === category);
  
  const categoryMapping = {
    'ADMIN': { name: 'AntiNuke' },
    'AUTOMOD': { name: 'Auto Moderation' },
    'MUSIC': { name: 'Music' },
    'MODERATION': { name: 'Moderation' },
    'GIVEAWAY': { name: 'Giveaway' },
    'TICKET': { name: 'Ticket' },
    'UTILITY': { name: 'Utility' },
    'SOCIAL': { name: 'Welcomer' },
    'STATS': { name: 'Auto Responder' },
    'ECONOMY': { name: 'Custom Roles' },
    'SUGGESTION': { name: 'Logging' },
    'IMAGE': { name: 'Media' },
    'INVITE': { name: 'VCRoles' },
    'FUN': { name: 'Fun' },
    'INFORMATION': { name: 'Bot' },
  };

  const categoryInfo = CommandCategory[category];
  const mapping = categoryMapping[category] || { name: categoryInfo?.name };

  if (commands.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setTitle(mapping.name)
      .setDescription("This category is currently empty. Check back later for new commands!")
      .setFooter({ text: "Powered by Blackbit Studio" });
    return { embeds: [embed] };
  }

  const commandsList = commands.map(cmd => {
    if (cmd.command.subcommands && cmd.command.subcommands.length > 0) {
      return cmd.command.subcommands.map(sub => {
        const trigger = sub.trigger.split(' ')[0];
        return `• \`${cmd.name} ${trigger}\` *`;
      }).join('\n');
    }
    return `• \`${cmd.name}\``;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setTitle(mapping.name)
    .setDescription(commandsList)
    .setFooter({ text: `Use ${prefix || '?'}help <command> for more info • Powered by Blackbit Studio` });

  return { embeds: [embed] };
}

function getBackButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("home-btn")
      .setLabel("Back")
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Secondary)
  );
}
