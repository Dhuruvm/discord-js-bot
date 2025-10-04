const { CommandCategory, BotClient } = require("@src/structures");
const { EMBED_COLORS, SUPPORT_SERVER } = require("@root/config.js");
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

/**
 * @type {import("@structures/Command")}
 */
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
      const response = await getHelpMenu(message);
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

/**
 * @param {CommandInteraction} interaction
 */
async function getHelpMenu({ client, guild }) {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setDescription(
      `**My help is here for you!**\n\n` +
      `**Developed by Blackbit Studio**`
    )
    .setTimestamp();

  const buttonRow1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("home-btn")
      .setLabel("🏠 Home")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("commands-list-btn")
      .setLabel("📋 Commands List")
      .setStyle(ButtonStyle.Primary)
  );

  const buttonRow2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("buttons-menu-btn")
      .setLabel("🎮 Buttons Menu")
      .setStyle(ButtonStyle.Secondary)
  );

  const options = [];
  for (const [k, v] of Object.entries(CommandCategory)) {
    if (v.enabled === false) continue;
    options.push({
      label: v.name,
      value: k,
      description: `View commands in ${v.name} category`,
      emoji: v.emoji,
    });
  }

  const menuRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("help-menu")
      .setPlaceholder("Choose a Category")
      .addOptions(options)
  );

  if (SUPPORT_SERVER) {
    buttonRow1.addComponents(
      new ButtonBuilder()
        .setLabel("Support")
        .setEmoji("🔗")
        .setStyle(ButtonStyle.Link)
        .setURL(SUPPORT_SERVER)
    );
  }

  if (client.getInvite) {
    buttonRow1.addComponents(
      new ButtonBuilder()
        .setLabel("Invite Cybork")
        .setEmoji("🔗")
        .setStyle(ButtonStyle.Link)
        .setURL(client.getInvite())
    );
  }

  return {
    embeds: [embed],
    components: [buttonRow1, buttonRow2, menuRow],
  };
}

/**
 * @param {Message} msg
 * @param {string} userId
 * @param {string} prefix
 */
const waiter = (msg, userId, prefix) => {
  const collector = msg.channel.createMessageComponentCollector({
    filter: (reactor) => reactor.user.id === userId && msg.id === reactor.message.id,
    idle: IDLE_TIMEOUT * 1000,
    dispose: true,
    time: 5 * 60 * 1000,
  });

  let currentView = "home";

  const options = [];
  for (const [k, v] of Object.entries(CommandCategory)) {
    if (v.enabled === false) continue;
    options.push({
      label: v.name,
      value: k,
      description: `View commands in ${v.name} category`,
      emoji: v.emoji,
    });
  }

  const menuRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("help-menu")
      .setPlaceholder("Choose a Category")
      .addOptions(options)
  );

  collector.on("collect", async (response) => {
    await response.deferUpdate();

    switch (response.customId) {
      case "home-btn": {
        currentView = "home";
        const homeResponse = await getHelpMenu({ client: msg.client, guild: msg.guild });
        msg.editable && (await msg.edit(homeResponse));
        break;
      }

      case "commands-list-btn": {
        currentView = "list";
        const listEmbed = getCategoriesListEmbed(msg.client, msg.guild);
        const listButtons = getListButtons();
        msg.editable && (await msg.edit({ embeds: [listEmbed], components: listButtons }));
        break;
      }

      case "buttons-menu-btn": {
        currentView = "buttons";
        const buttonsEmbed = getButtonsMenuEmbed(msg.client);
        const components = getCategoryButtons(msg.client);
        msg.editable && (await msg.edit({ embeds: [buttonsEmbed], components }));
        break;
      }

      case "help-menu": {
        const cat = response.values[0].toUpperCase();
        const categoryEmbed = prefix 
          ? getMsgCategoryEmbed(msg.client, cat, prefix) 
          : getSlashCategoryEmbed(msg.client, cat);

        const navigationRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("home-btn")
            .setLabel("🏠 Home")
            .setStyle(ButtonStyle.Primary)
        );

        msg.editable && (await msg.edit({ embeds: [categoryEmbed], components: [navigationRow, menuRow] }));
        break;
      }
    }

    if (response.customId.startsWith("cat-")) {
      const cat = response.customId.replace("cat-", "").toUpperCase();
      const categoryEmbed = prefix 
        ? getMsgCategoryEmbed(msg.client, cat, prefix) 
        : getSlashCategoryEmbed(msg.client, cat);

      const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("buttons-menu-btn")
          .setLabel("◀️ Back to Menu")
          .setStyle(ButtonStyle.Secondary)
      );

      msg.editable && (await msg.edit({ embeds: [categoryEmbed], components: [backRow] }));
    }
  });

  collector.on("end", () => {
    if (!msg.guild || !msg.channel) return;
    return msg.editable && msg.edit({ components: [] });
  });
};

function getCategoriesListEmbed(client, guild) {
  let description = "";

  for (const [k, v] of Object.entries(CommandCategory)) {
    if (v.enabled === false) continue;
    const cmds = client.slashCommands.filter(cmd => cmd.category === k);
    if (cmds.size > 0) {
      description += `${v.emoji} **${v.name}**\n`;
    }
  }

  description += `\n**🔗 Links:**\n`;
  description += `**[Support Server](${SUPPORT_SERVER || "#"})** | **[Invite Me](${client.getInvite ? client.getInvite() : "#"})**\n`;
  description += `**[Privacy Policy](#)** | **[Terms of Service](#)**`;

  return new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setAuthor({ 
      name: "📋 Interactive Help System",
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(description)
    .setFooter({ text: `Cybork Help Menu` })
    .setTimestamp();
}

function getListButtons() {
  const backButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("home-btn")
      .setLabel("🏠 Home")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("buttons-menu-btn")
      .setLabel("🎮 Buttons Menu")
      .setStyle(ButtonStyle.Secondary)
  );

  return [backButton];
}

function getButtonsMenuEmbed(client) {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setAuthor({ 
      name: "Choose a Category",
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription("**Click on a category button below to view its commands!**")
    .setFooter({ text: `Cybork Category Menu` })
    .setTimestamp();
}

function getCategoryButtons(client) {
  const buttons = [];
  const rows = [];

  for (const [k, v] of Object.entries(CommandCategory)) {
    if (v.enabled === false) continue;

    buttons.push(
      new ButtonBuilder()
        .setCustomId(`cat-${k.toLowerCase()}`)
        .setEmoji(v.emoji)
        .setStyle(ButtonStyle.Secondary)
    );
  }

  while (buttons.length > 0) {
    const row = new ActionRowBuilder().addComponents(buttons.splice(0, 5));
    rows.push(row);
  }

  const backRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("home-btn")
      .setLabel("🏠 Home")
      .setStyle(ButtonStyle.Primary)
  );

  rows.push(backRow);

  return rows.slice(0, 5);
}

/**
 * Returns embed for a category with commands in compact format [SLASH COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 */
function getSlashCategoryEmbed(client, category) {
  const commands = Array.from(client.slashCommands.filter((cmd) => cmd.category === category).values());

  if (commands.length === 0) {
    return new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setAuthor({ 
        name: `Cybork HelpDesk`,
        iconURL: client.user.displayAvatarURL()
      })
      .setDescription(`**${CommandCategory[category]?.emoji}: ${CommandCategory[category]?.name}**\n\n**No commands in this category**`)
      .setTimestamp();
  }

  const commandsList = commands.map(cmd => {
    const subCmds = cmd.slashCommand.options?.filter((opt) => opt.type === ApplicationCommandOptionType.Subcommand);
    if (subCmds && subCmds.length > 0) {
      return subCmds.map(sub => `${cmd.name} ${sub.name}`).join(', ');
    }
    return cmd.name;
  }).join(', ');

  const description = `**${CommandCategory[category]?.emoji}: ${CommandCategory[category]?.name}**\n\n${commandsList}`;

  return new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setAuthor({ 
      name: `Cybork HelpDesk`,
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(description)
    .setTimestamp();
}

/**
 * Returns embed for a category with commands in compact format [MESSAGE COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 * @param {string} prefix
 */
function getMsgCategoryEmbed(client, category, prefix) {
  const commands = client.commands.filter((cmd) => cmd.category === category);

  if (commands.length === 0) {
    return new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setAuthor({ 
        name: `Cybork HelpDesk`,
        iconURL: client.user.displayAvatarURL()
      })
      .setDescription(`**${CommandCategory[category]?.emoji}: ${CommandCategory[category]?.name}**\n\n**No commands in this category**`)
      .setTimestamp();
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

  const description = `**${CommandCategory[category]?.emoji}: ${CommandCategory[category]?.name}**\n\n${commandsList}`;

  return new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setAuthor({ 
      name: `Cybork HelpDesk`,
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(description)
    .setTimestamp();
}