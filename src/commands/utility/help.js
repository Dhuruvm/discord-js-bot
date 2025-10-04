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

const CMDS_PER_PAGE = 5;
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
    .setAuthor({ 
      name: `Get Started with Cybork! Here are some quick actions to help you out!`,
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(
      `Looking for commands? Here are some quick actions to help you out!\n\n` +
      `**Need Assistance?**\n` +
      `Check out \`$help\` for a full list of commands or visit our ${SUPPORT_SERVER ? `[Support Server](${SUPPORT_SERVER})` : 'Support Server'} to get help and stay updated.\n\n` +
      `**Unlock More Power**\n` +
      `Get advanced features, enhanced automation, priority updates, and exclusive all-in-one tools with Cybork. Perfect for keeping your community safe and secure!\n\n` +
      `**Developed with ❤️ by Your Team**`
    )
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: `Interactive Help System | ${guild.name}`, iconURL: guild.iconURL() })
    .setTimestamp();

  const buttonRow1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("home-btn")
      .setLabel("Home")
      .setEmoji("🏠")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("commands-list-btn")
      .setLabel("Commands List")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Primary)
  );

  const buttonRow2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("buttons-menu-btn")
      .setLabel("Buttons Menu")
      .setEmoji("🎮")
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

  let arrEmbeds = [];
  let currentPage = 0;
  let currentView = "home";
  let currentCategory = null;

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
        const listEmbed = getCategoriesListEmbed(msg.client);
        msg.editable && (await msg.edit({ embeds: [listEmbed], components: msg.components }));
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
        currentCategory = cat;
        arrEmbeds = prefix ? getMsgCategoryEmbeds(msg.client, cat, prefix) : getSlashCategoryEmbeds(msg.client, cat);
        currentPage = 0;

        const navigationRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("home-btn")
            .setLabel("Home")
            .setEmoji("🏠")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("previousBtn")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(arrEmbeds.length <= 1),
          new ButtonBuilder()
            .setCustomId("nextBtn")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(arrEmbeds.length <= 1)
        );

        msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [navigationRow, msg.components[2]] }));
        break;
      }

      case "previousBtn":
        if (currentPage !== 0) {
          --currentPage;
          msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]] }));
        }
        break;

      case "nextBtn":
        if (currentPage < arrEmbeds.length - 1) {
          currentPage++;
          msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]] }));
        }
        break;
    }

    if (response.customId.startsWith("cat-")) {
      const cat = response.customId.replace("cat-", "").toUpperCase();
      currentCategory = cat;
      arrEmbeds = prefix ? getMsgCategoryEmbeds(msg.client, cat, prefix) : getSlashCategoryEmbeds(msg.client, cat);
      currentPage = 0;

      const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("buttons-menu-btn")
          .setLabel("Back to Menu")
          .setEmoji("◀️")
          .setStyle(ButtonStyle.Secondary)
      );

      msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [backRow] }));
    }
  });

  collector.on("end", () => {
    if (!msg.guild || !msg.channel) return;
    return msg.editable && msg.edit({ components: [] });
  });
};

function getCategoriesListEmbed(client) {
  let description = "";
  
  for (const [k, v] of Object.entries(CommandCategory)) {
    if (v.enabled === false) continue;
    const cmds = client.slashCommands.filter(cmd => cmd.category === k);
    if (cmds.size > 0) {
      description += `${v.emoji} **${v.name}**\n`;
    }
  }

  description += `\n**Links:**\n`;
  description += `[Support Server](${SUPPORT_SERVER || "#"}) | [Invite Me](${client.getInvite ? client.getInvite() : "#"})\n`;
  description += `[Privacy Policy](#) | [Terms of Service](#)`;

  return new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setAuthor({ 
      name: "Interactive Help System",
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(description)
    .setFooter({ text: `Cybork Help Menu` })
    .setTimestamp();
}

function getButtonsMenuEmbed(client) {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setAuthor({ 
      name: "Choose a Category",
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription("Click on a category button below to view its commands!")
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
      .setLabel("Home")
      .setEmoji("🏠")
      .setStyle(ButtonStyle.Primary)
  );

  rows.push(backRow);

  return rows.slice(0, 5);
}

/**
 * Returns an array of message embeds for a particular command category [SLASH COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 */
function getSlashCategoryEmbeds(client, category) {
  let collector = "";

  if (category === "IMAGE") {
    client.slashCommands
      .filter((cmd) => cmd.category === category)
      .forEach((cmd) => (collector += `\`/${cmd.name}\`\n ❯ ${cmd.description}\n\n`));

    const availableFilters = client.slashCommands
      .get("filter")
      ?.slashCommand.options[0]?.choices?.map((ch) => ch.name)
      .join(", ");

    const availableGens = client.slashCommands
      .get("generator")
      ?.slashCommand.options[0]?.choices?.map((ch) => ch.name)
      .join(", ");

    if (availableFilters) {
      collector += "**Available Filters:**\n" + `${availableFilters}\n\n`;
    }
    if (availableGens) {
      collector += "**Available Generators:**\n" + `${availableGens}`;
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ 
        name: `${CommandCategory[category]?.emoji} ${CommandCategory[category]?.name} Commands`,
        iconURL: CommandCategory[category]?.image
      })
      .setDescription(collector);

    return [embed];
  }

  const commands = Array.from(client.slashCommands.filter((cmd) => cmd.category === category).values());

  if (commands.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ 
        name: `${CommandCategory[category]?.emoji} ${CommandCategory[category]?.name} Commands`,
        iconURL: CommandCategory[category]?.image
      })
      .setDescription("No commands in this category");

    return [embed];
  }

  const arrSplitted = [];
  const arrEmbeds = [];

  while (commands.length) {
    let toAdd = commands.splice(0, commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length);

    toAdd = toAdd.map((cmd) => {
      const subCmds = cmd.slashCommand.options?.filter((opt) => opt.type === ApplicationCommandOptionType.Subcommand);
      const subCmdsString = subCmds?.map((s) => s.name).join(", ");

      return `\`/${cmd.name}\`\n ❯ ${cmd.description}\n ${
        !subCmds?.length ? "" : `❯ **SubCommands [${subCmds?.length}]**: ${subCmdsString}\n`
      } `;
    });

    arrSplitted.push(toAdd);
  }

  arrSplitted.forEach((item, index) => {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ 
        name: `${CommandCategory[category]?.emoji} ${CommandCategory[category]?.name} Commands`,
        iconURL: CommandCategory[category]?.image
      })
      .setDescription(item.join("\n"))
      .setFooter({ text: `Page ${index + 1} of ${arrSplitted.length}` });
    arrEmbeds.push(embed);
  });

  return arrEmbeds;
}

/**
 * Returns an array of message embeds for a particular command category [MESSAGE COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 * @param {string} prefix
 */
function getMsgCategoryEmbeds(client, category, prefix) {
  let collector = "";

  if (category === "IMAGE") {
    client.commands
      .filter((cmd) => cmd.category === category)
      .forEach((cmd) =>
        cmd.command.aliases.forEach((alias) => {
          collector += `\`${alias}\`, `;
        })
      );

    collector +=
      "\n\nYou can use these image commands in following formats\n" +
      `**${prefix}cmd:** Picks message authors avatar as image\n` +
      `**${prefix}cmd <@member>:** Picks mentioned members avatar as image\n` +
      `**${prefix}cmd <url>:** Picks image from provided URL\n` +
      `**${prefix}cmd [attachment]:** Picks attachment image`;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ 
        name: `${CommandCategory[category]?.emoji} ${CommandCategory[category]?.name} Commands`,
        iconURL: CommandCategory[category]?.image
      })
      .setDescription(collector);

    return [embed];
  }

  const commands = client.commands.filter((cmd) => cmd.category === category);

  if (commands.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ 
        name: `${CommandCategory[category]?.emoji} ${CommandCategory[category]?.name} Commands`,
        iconURL: CommandCategory[category]?.image
      })
      .setDescription("No commands in this category");

    return [embed];
  }

  const arrSplitted = [];
  const arrEmbeds = [];

  while (commands.length) {
    let toAdd = commands.splice(0, commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length);
    toAdd = toAdd.map((cmd) => `\`${prefix}${cmd.name}\`\n ❯ ${cmd.description}\n`);
    arrSplitted.push(toAdd);
  }

  arrSplitted.forEach((item, index) => {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ 
        name: `${CommandCategory[category]?.emoji} ${CommandCategory[category]?.name} Commands`,
        iconURL: CommandCategory[category]?.image
      })
      .setDescription(item.join("\n"))
      .setFooter({
        text: `Page ${index + 1} of ${arrSplitted.length} | Type ${prefix}help <command> for more command information`,
      });
    arrEmbeds.push(embed);
  });

  return arrEmbeds;
}
