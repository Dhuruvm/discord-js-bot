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
    'ADMIN': { name: 'Admin' },
    'AUTOMOD': { name: 'Auto Moderation' },
    'MUSIC': { name: 'Music' },
    'MODERATION': { name: 'Moderation' },
    'GIVEAWAY': { name: 'Giveaway' },
    'TICKET': { name: 'Ticket' },
    'UTILITY': { name: 'Utility' },
    'SOCIAL': { name: 'Social' },
    'STATS': { name: 'Statistics' },
    'ECONOMY': { name: 'Economy' },
    'SUGGESTION': { name: 'Suggestion' },
    'IMAGE': { name: 'Image' },
    'INVITE': { name: 'Invite' },
    'FUN': { name: 'Fun' },
    'GRAPHICS': { name: 'Graphics' },
    'ANIME': { name: 'Anime' },
    'BOT': { name: 'Bot' },
    'INFORMATION': { name: 'Information' },
  };

  const prefixText = prefix || '!';
  const ContainerBuilder = require("@helpers/ContainerBuilder");
  
  const mainText = ContainerBuilder.createTextDisplay(
    `## ${client?.user?.username || 'Bot'} Command Menu\n\n` +
    `### Command Information\n` +
    `**an asterisk(*) means the command has subcommands**\n\n` +
    `*View ${client?.user?.username || 'bot'} commands using the menu below.*\n\n` +
    `*Or view the commands on our* [**Docs**](${SUPPORT_SERVER})\n\n` +
    `### Need Extra Help?\n` +
    `> Visit our [**Support Server**](${SUPPORT_SERVER}) to get started\n` +
    `> Developer: [**Falooda**](https://discord.com/users/${OWNER_IDS[0]})`
  );

  const menuRow = ActionRowBuilder.from({
    type: 1,
    components: [{
      type: 3,
      custom_id: "help-menu",
      placeholder: `${client?.user?.username || 'Bot'} Command Modules`,
      options: Object.entries(CommandCategory)
        .filter(([k, v]) => v.enabled !== false && (k !== 'OWNER' || isOwner))
        .map(([k, v]) => {
          const mapping = categoryMapping[k] || { name: v.name };
          return {
            label: mapping.name,
            value: k,
            description: `View commands in ${mapping.name} category`,
          };
        })
    }]
  });

  const payload = new ContainerBuilder()
    .addContainer({ 
      accentColor: 0xFFFFFF, 
      components: [mainText, menuRow]
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
    'ADMIN': { name: 'Admin' },
    'AUTOMOD': { name: 'Auto Moderation' },
    'MUSIC': { name: 'Music' },
    'MODERATION': { name: 'Moderation' },
    'GIVEAWAY': { name: 'Giveaway' },
    'TICKET': { name: 'Ticket' },
    'UTILITY': { name: 'Utility' },
    'SOCIAL': { name: 'Social' },
    'STATS': { name: 'Statistics' },
    'ECONOMY': { name: 'Economy' },
    'SUGGESTION': { name: 'Suggestion' },
    'IMAGE': { name: 'Image' },
    'INVITE': { name: 'Invite' },
    'FUN': { name: 'Fun' },
    'GRAPHICS': { name: 'Graphics' },
    'ANIME': { name: 'Anime' },
    'BOT': { name: 'Bot' },
    'INFORMATION': { name: 'Information' },
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
