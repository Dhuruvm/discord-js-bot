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
      const response = await getHelpMenu(message, data.prefix);
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
      const response = await getHelpMenu(interaction);
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

async function getHelpMenu(context, prefix) {
  const { client, guild, author, user } = context;
  const displayUser = author || user;
  const isOwner = OWNER_IDS.includes(displayUser?.id);

  // Define category order: Owner first (if owner), then specific order
  const categoryOrder = [
    'OWNER',
    'ANTINUKE',
    'AUTOMOD',
    'MUSIC',
    'MODERATION',
    'INFORMATION',
    'GIVEAWAY',
    'TICKET',
    'UTILITY',
    'GATEWAY',
    'PROFILE',
    'LEADERBOARD',
    'SUGGESTION',
    'BOT'
  ];

  const categoryMapping = {
    'OWNER': { name: 'Owner' },
    'ANTINUKE': { name: 'Antinuke' },
    'AUTOMOD': { name: 'Auto Moderation' },
    'MUSIC': { name: 'Music' },
    'MODERATION': { name: 'Moderation' },
    'INFORMATION': { name: 'Information' },
    'GIVEAWAY': { name: 'Giveaway' },
    'TICKET': { name: 'Ticket' },
    'UTILITY': { name: 'Utility' },
    'GATEWAY': { name: 'Gateway' },
    'PROFILE': { name: 'Profile' },
    'LEADERBOARD': { name: 'Leaderboard' },
    'SUGGESTION': { name: 'Suggestions' },
    'BOT': { name: 'Bot' },
  };

  const prefixText = prefix || '!';
  const ContainerBuilder = require("@helpers/ContainerBuilder");
  
  const mainText = ContainerBuilder.createTextDisplay(
    `## ${client?.user?.username || 'Bot'} Command Menu\n\n` +
    `### Command Information\n` +
    `**Select a category from the menu below to view available commands**\n\n` +
    `*View ${client?.user?.username || 'bot'} commands using the menu below.*\n\n` +
    `*Or view the commands on our* [**Website**](${SUPPORT_SERVER})\n\n` +
    `### Need Extra Help?\n` +
    `> Visit our [**Support Server**](${SUPPORT_SERVER}) to get started\n` +
    `> Developer: [**Falooda**](https://discord.com/users/${OWNER_IDS[0]})`
  );

  // Build menu options in specific order, filtering based on ownership
  const menuOptions = categoryOrder
    .filter(key => {
      const category = CommandCategory[key];
      if (!category) return false;
      if (category.enabled === false) return false;
      if (key === 'OWNER' && !isOwner) return false;
      return true;
    })
    .map(key => {
      const category = CommandCategory[key];
      const mapping = categoryMapping[key] || { name: category.name };
      return {
        label: mapping.name,
        value: key,
        description: `View commands in ${mapping.name} category`,
      };
    });

  const menuRow = ActionRowBuilder.from({
    type: 1,
    components: [{
      type: 3,
      custom_id: "help-menu",
      placeholder: `${client?.user?.username || 'Bot'} Command Modules`,
      options: menuOptions
    }]
  });

  const linkButtons = ActionRowBuilder.from({
    type: 1,
    components: [
      {
        type: 2,
        style: ButtonStyle.Link,
        label: "Invite Bot",
        url: client?.getInvite ? client.getInvite() : `https://discord.com/oauth2/authorize?client_id=${client?.user?.id}&permissions=8&scope=bot%20applications.commands`
      },
      SUPPORT_SERVER ? {
        type: 2,
        style: ButtonStyle.Link,
        label: "Support Server",
        url: SUPPORT_SERVER
      } : null
    ].filter(Boolean)
  });

  const payload = new ContainerBuilder()
    .addContainer({ 
      accentColor: 0xFFFFFF, 
      components: [mainText, menuRow, linkButtons]
    })
    .build();

  return payload;
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
        
        // Add back button to the container's components
        if (categoryResponse.components && categoryResponse.components.length > 0) {
          const container = categoryResponse.components[0];
          if (container.components) {
            container.components.push(backRow.toJSON());
          }
        }
        
        currentComponents = categoryResponse.components || [];
        msg.editable && (await msg.edit(categoryResponse));
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
  const ContainerBuilder = require("@helpers/ContainerBuilder");
  const commands = client.commands.filter((cmd) => cmd.category === category);
  
  const categoryMapping = {
    'OWNER': { name: 'Owner' },
    'ANTINUKE': { name: 'Antinuke' },
    'AUTOMOD': { name: 'Auto Moderation' },
    'MUSIC': { name: 'Music' },
    'MODERATION': { name: 'Moderation' },
    'INFORMATION': { name: 'Information' },
    'GIVEAWAY': { name: 'Giveaway' },
    'TICKET': { name: 'Ticket' },
    'UTILITY': { name: 'Utility' },
    'GATEWAY': { name: 'Gateway' },
    'PROFILE': { name: 'Profile' },
    'LEADERBOARD': { name: 'Leaderboard' },
    'SUGGESTION': { name: 'Suggestions' },
    'BOT': { name: 'Bot' },
  };

  const categoryInfo = CommandCategory[category];
  const mapping = categoryMapping[category] || { name: categoryInfo?.name };

  if (commands.length === 0) {
    const emptyText = ContainerBuilder.createTextDisplay(
      `## ${mapping.name}\n\nThis category is currently empty. Check back later for new commands!\n\n` +
      `*Powered by Blackbit Studio*`
    );

    const payload = new ContainerBuilder()
      .addContainer({ 
        accentColor: 0x2B2D31, 
        components: [emptyText]
      })
      .build();

    return payload;
  }

  const commandsList = commands.map(cmd => {
    if (cmd.command.subcommands && cmd.command.subcommands.length > 0) {
      return cmd.command.subcommands.map(sub => {
        const trigger = sub.trigger.split(' ')[0];
        return `- \`${cmd.name} ${trigger}\` *`;
      }).join('\n');
    }
    return `- \`${cmd.name}\``;
  }).join('\n');

  const categoryText = ContainerBuilder.createTextDisplay(
    `## ${mapping.name}\n\n${commandsList}\n\n` +
    `*Use ${prefix || '!'}help <command> for more info • Powered by Blackbit Studio*`
  );

  const payload = new ContainerBuilder()
    .addContainer({ 
      accentColor: 0xFFFFFF, 
      components: [categoryText]
    })
    .build();

  return payload;
}

function getBackButton() {
  return ActionRowBuilder.from({
    type: 1,
    components: [{
      type: 2,
      custom_id: "home-btn",
      label: "Back",
      style: ButtonStyle.Secondary
    }]
  });
}
