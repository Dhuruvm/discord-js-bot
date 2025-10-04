const { CommandCategory, BotClient } = require("@src/structures");
const { SUPPORT_SERVER } = require("@root/config.js");
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

const IDLE_TIMEOUT = 30;

module.exports = {
  name: "help",
  description: "Interactive help menu with all commands",
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
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
      const sentMsg = await message.safeReply(response);
      return waiter(sentMsg, message.author.id, data.prefix);
    }

    const cmd = message.client.getCommand(trigger);
    if (cmd) {
      const embed = getCommandUsage(cmd, data.prefix, trigger);
      return message.safeReply({ embeds: [embed] });
    }

    await message.safeReply("No matching command found");
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

    await interaction.followUp("No matching command found");
  },
};

async function getHelpMenu({ client, guild }, prefix) {
  const mainCategories = [];
  const extraCategories = [];

  for (const [k, v] of Object.entries(CommandCategory)) {
    if (v.enabled === false) continue;
    
    const categoryLine = `${v.emoji} : ${v.name}`;
    
    if (['ADMIN', 'MODERATION', 'MUSIC', 'GIVEAWAY', 'TICKET', 'UTILITY', 'SOCIAL'].includes(k)) {
      mainCategories.push(categoryLine);
    } else {
      extraCategories.push(categoryLine);
    }
  }

  const mainSection = mainCategories.length > 0 ? `**Main**\n${mainCategories.join('\n')}` : '';
  const extraSection = extraCategories.length > 0 ? `\n\n**Extra**\n${extraCategories.join('\n')}` : '';

  const prefixText = prefix || '!';
  const description = `• Prefix is ${prefixText}\n• ${prefixText}help <command | module> for more information.\n\n${mainSection}${extraSection}`;

  const embed = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(description)
    .setFooter({ text: "Powered by BlaZe HQ" });

  const buttonRow1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("main-module-btn")
      .setLabel("Main Module")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("extra-module-btn")
      .setLabel("Extra Module")
      .setStyle(ButtonStyle.Primary)
  );

  const buttonRow2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("search-command-btn")
      .setLabel("Search Command")
      .setStyle(ButtonStyle.Secondary)
  );

  const menuRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("help-menu")
      .setPlaceholder("Choose a menu for commands.")
      .addOptions(
        Object.entries(CommandCategory)
          .filter(([k, v]) => v.enabled !== false)
          .map(([k, v]) => ({
            label: v.name,
            value: k,
            description: `View commands in ${v.name} category`,
            emoji: v.emoji,
          }))
      )
  );

  const buttonRow3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Invite BlaZe")
      .setStyle(ButtonStyle.Link)
      .setURL(client.getInvite ? client.getInvite() : "https://discord.com"),
    new ButtonBuilder()
      .setLabel("Support Server")
      .setStyle(ButtonStyle.Link)
      .setURL(SUPPORT_SERVER || "https://discord.com")
  );

  return {
    embeds: [embed],
    components: [buttonRow1, buttonRow2, menuRow, buttonRow3],
  };
}

const waiter = (msg, userId, prefix) => {
  const collector = msg.channel.createMessageComponentCollector({
    filter: (reactor) => reactor.user.id === userId && msg.id === reactor.message.id,
    idle: IDLE_TIMEOUT * 1000,
    dispose: true,
    time: 5 * 60 * 1000,
  });

  collector.on("collect", async (response) => {
    await response.deferUpdate();

    switch (response.customId) {
      case "main-module-btn": {
        const mainEmbed = getModuleEmbed(msg.client, "main", prefix);
        const backRow = getBackButton();
        msg.editable && (await msg.edit({ embeds: [mainEmbed], components: [backRow] }));
        break;
      }

      case "extra-module-btn": {
        const extraEmbed = getModuleEmbed(msg.client, "extra", prefix);
        const backRow = getBackButton();
        msg.editable && (await msg.edit({ embeds: [extraEmbed], components: [backRow] }));
        break;
      }

      case "search-command-btn": {
        const searchEmbed = new EmbedBuilder()
          .setColor("#FFFFFF")
          .setAuthor({
            name: msg.client.user.username,
            iconURL: msg.client.user.displayAvatarURL()
          })
          .setDescription(`Use \`${prefix || '!'}help <command>\` to search for a specific command.\n\nExample: \`${prefix || '!'}help ban\``)
          .setFooter({ text: "Powered by BlaZe HQ" });
        
        const backRow = getBackButton();
        msg.editable && (await msg.edit({ embeds: [searchEmbed], components: [backRow] }));
        break;
      }

      case "home-btn": {
        const homeResponse = await getHelpMenu({ client: msg.client, guild: msg.guild }, prefix);
        msg.editable && (await msg.edit(homeResponse));
        break;
      }

      case "help-menu": {
        const cat = response.values[0].toUpperCase();
        const categoryEmbed = getCategoryEmbed(msg.client, cat, prefix);
        const backRow = getBackButton();
        msg.editable && (await msg.edit({ embeds: [categoryEmbed], components: [backRow] }));
        break;
      }
    }
  });

  collector.on("end", () => {
    if (!msg.guild || !msg.channel) return;
    return msg.editable && msg.edit({ components: [] });
  });
};

function getModuleEmbed(client, type, prefix) {
  const mainCategories = ['ADMIN', 'MODERATION', 'MUSIC', 'GIVEAWAY', 'TICKET', 'UTILITY', 'SOCIAL'];
  const categories = type === "main" ? mainCategories : 
    Object.keys(CommandCategory).filter(k => !mainCategories.includes(k) && CommandCategory[k].enabled !== false);

  const categoryList = categories
    .filter(k => CommandCategory[k])
    .map(k => `${CommandCategory[k].emoji} : ${CommandCategory[k].name}`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(`**${type.charAt(0).toUpperCase() + type.slice(1)} Module**\n\n${categoryList}`)
    .setFooter({ text: "Powered by BlaZe HQ" });

  return embed;
}

function getCategoryEmbed(client, category, prefix) {
  const commands = client.commands.filter((cmd) => cmd.category === category);

  if (commands.length === 0) {
    return new EmbedBuilder()
      .setColor("#FFFFFF")
      .setAuthor({ 
        name: client.user.username,
        iconURL: client.user.displayAvatarURL()
      })
      .setDescription(`**${CommandCategory[category]?.name}**\n\nNo commands in this category`)
      .setFooter({ text: "Powered by BlaZe HQ" });
  }

  const commandsList = commands.map(cmd => {
    if (cmd.command.subcommands && cmd.command.subcommands.length > 0) {
      return cmd.command.subcommands.map(sub => {
        const trigger = sub.trigger.split(' ')[0];
        return `${cmd.name} ${trigger}`;
      }).join(', ');
    }
    return cmd.name;
  }).join(', ');

  const embed = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setAuthor({ 
      name: client.user.username,
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(`**${CommandCategory[category]?.name}**\n\n${commandsList}`)
    .setFooter({ text: "Powered by BlaZe HQ" });

  return embed;
}

function getBackButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("home-btn")
      .setLabel("◀️ Back")
      .setStyle(ButtonStyle.Secondary)
  );
}
