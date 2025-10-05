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

    // !help
    if (!trigger) {
      const response = await getHelpMenu({ ...message }, data.prefix);
      const sentMsg = await message.channel.send(response);
      return waiter(sentMsg, message.author.id, data.prefix);
    }

    // check if command
    const cmd = message.client.getCommand(trigger);
    if (cmd) {
      const embed = getCommandUsage(cmd, data.prefix, trigger);
      return message.channel.send({ embeds: [embed] });
    }

    // check if category
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

  for (const [k, v] of Object.entries(CommandCategory)) {
    if (v.enabled === false) continue;
    if (k === 'OWNER' && !isOwner) continue;

    const categoryLine = `${v.emoji} ${v.name}`;

    if (['ADMIN', 'MODERATION', 'MUSIC', 'GIVEAWAY', 'TICKET', 'UTILITY', 'SOCIAL'].includes(k)) {
      mainCategories.push(categoryLine);
    } else {
      extraCategories.push(categoryLine);
    }
  }

  const prefixText = prefix || '!';
  
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📚 ${client?.user?.username || 'Bot'} Help Menu`)
    .setDescription("Explore all available commands and features. Use the menu below to navigate through different command categories.")
    .addFields(
      { 
        name: "📋 Getting Started", 
        value: `**Command Prefix:** \`${prefixText}\`\n**Usage:** \`${prefixText}help <command | module>\``,
        inline: false 
      },
      { 
        name: "🎯 Main Modules", 
        value: mainCategories.join(' • '),
        inline: false 
      },
      { 
        name: "✨ Extra Modules", 
        value: extraCategories.join(' • '),
        inline: false 
      }
    )
    .setFooter({ text: "Powered by Blackbit Studio" })
    .setTimestamp();

  if (guild?.iconURL()) {
    embed.setThumbnail(guild.iconURL());
  }

  // Category selector menu
  const menuRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("help-menu")
      .setPlaceholder("📚 Choose a category to view commands")
      .addOptions(
        Object.entries(CommandCategory)
          .filter(([k, v]) => v.enabled !== false && (k !== 'OWNER' || isOwner))
          .map(([k, v]) => ({
            label: v.name,
            value: k,
            description: `View commands in ${v.name} category`,
            emoji: v.emoji,
          }))
      )
  );

  // Links row
  const linksRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel(`Invite ${client?.user?.username || 'Bot'}`)
      .setStyle(ButtonStyle.Link)
      .setURL(client?.getInvite ? client.getInvite() : "https://discord.com")
      .setEmoji("🔗"),
    new ButtonBuilder()
      .setLabel("Support Server")
      .setStyle(ButtonStyle.Link)
      .setURL(SUPPORT_SERVER || "https://discord.com")
      .setEmoji("💬")
  );

  return {
    embeds: [embed],
    components: [menuRow, linksRow]
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
      case "main-module-btn": {
        const mainResponse = getModuleEmbed(msg.client, "main", prefix, response.user.id);
        const backRow = getBackButton();
        const linkRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel(`Invite ${msg.client?.user?.username || 'Bot'}`)
            .setStyle(ButtonStyle.Link)
            .setURL(msg.client?.getInvite ? msg.client.getInvite() : "https://discord.com")
            .setEmoji("🔗"),
          new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL(SUPPORT_SERVER || "https://discord.com")
            .setEmoji("💬")
        );
        currentComponents = [backRow, linkRow];
        msg.editable && (await msg.edit({ embeds: mainResponse.embeds, components: currentComponents }));
        break;
      }

      case "extra-module-btn": {
        const extraResponse = getModuleEmbed(msg.client, "extra", prefix, response.user.id);
        const backRow = getBackButton();
        const linkRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel(`Invite ${msg.client?.user?.username || 'Bot'}`)
            .setStyle(ButtonStyle.Link)
            .setURL(msg.client?.getInvite ? msg.client.getInvite() : "https://discord.com")
            .setEmoji("🔗"),
          new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL(SUPPORT_SERVER || "https://discord.com")
            .setEmoji("💬")
        );
        currentComponents = [backRow, linkRow];
        msg.editable && (await msg.edit({ embeds: extraResponse.embeds, components: currentComponents }));
        break;
      }

      case "search-command-btn": {
        const searchEmbed = new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle("🔍 Command Search")
          .setDescription("Need help with a specific command? Search for it directly using the prefix command.")
          .addFields(
            { 
              name: "🔍 How to Search", 
              value: `Use \`${prefix || '!'}help <command>\` to get detailed information about any command.`,
              inline: false 
            },
            { 
              name: "📝 Example", 
              value: `\`${prefix || '!'}help ban\`\n\nThis will show you everything you need to know about the ban command.`,
              inline: false 
            }
          )
          .setFooter({ text: "Powered by Blackbit Studio" })
          .setTimestamp();

        const backRow = getBackButton();
        currentComponents = [backRow];
        msg.editable && (await msg.edit({ embeds: [searchEmbed], components: currentComponents }));
        break;
      }

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
        const linkRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel(`Invite ${msg.client?.user?.username || 'Bot'}`)
            .setStyle(ButtonStyle.Link)
            .setURL(msg.client?.getInvite ? msg.client.getInvite() : "https://discord.com")
            .setEmoji("🔗"),
          new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL(SUPPORT_SERVER || "https://discord.com")
            .setEmoji("💬")
        );
        currentComponents = [backRow, linkRow];
        msg.editable && (await msg.edit({ embeds: categoryResponse.embeds, components: currentComponents }));
        break;
      }
    }
  });

  collector.on("end", () => {
    if (!msg.guild || !msg.channel) return;

    const disabledComponents = currentComponents.map(row => {
      const newRow = new ActionRowBuilder();
      row.components.forEach(component => {
        if (component.data.style === ButtonStyle.Link) {
          newRow.addComponents(component);
        } else if (component.type === 3) {
          newRow.addComponents(
            StringSelectMenuBuilder.from(component.data).setDisabled(true)
          );
        } else {
          newRow.addComponents(
            ButtonBuilder.from(component.data).setDisabled(true)
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
  const mainCategories = ['ADMIN', 'MODERATION', 'MUSIC', 'GIVEAWAY', 'TICKET', 'UTILITY', 'SOCIAL'];
  const categories = type === "main" ? mainCategories : 
    Object.keys(CommandCategory).filter(k => !mainCategories.includes(k) && CommandCategory[k].enabled !== false && (k !== 'OWNER' || isOwner));

  const categoryList = categories
    .filter(k => CommandCategory[k])
    .filter(k => k !== 'OWNER' || isOwner)
    .map(k => `${CommandCategory[k].emoji} **${CommandCategory[k].name}**`)
    .join('\n');

  const moduleTitle = type.charAt(0).toUpperCase() + type.slice(1);
  const moduleIcon = type === "main" ? "🎯" : "✨";

  const embed = new EmbedBuilder()
    .setColor(type === "main" ? 0x5865F2 : 0x9B59B6)
    .setTitle(`${moduleIcon} ${moduleTitle} Modules`)
    .setDescription(`Browse through our ${moduleTitle.toLowerCase()} command categories and discover powerful features for your server.`)
    .setThumbnail(client?.user?.displayAvatarURL() || "https://cdn.discordapp.com/embed/avatars/0.png")
    .addFields({ name: "📚 Available Categories", value: categoryList, inline: false })
    .setFooter({ text: "Powered by Blackbit Studio" })
    .setTimestamp();

  return { embeds: [embed] };
}

function getCategoryEmbed(client, category, prefix) {
  const commands = client.commands.filter((cmd) => cmd.category === category);
  const categoryInfo = CommandCategory[category];

  if (commands.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0xFFFFFF)
      .setTitle(`${categoryInfo?.emoji || '📦'} ${categoryInfo?.name || 'Category'}`)
      .setDescription("This category is currently empty. Check back later for new commands!")
      .setFooter({ text: "Powered by Blackbit Studio" })
      .setTimestamp();
    return { embeds: [embed] };
  }

  const commandsList = commands.map(cmd => {
    if (cmd.command.subcommands && cmd.command.subcommands.length > 0) {
      return cmd.command.subcommands.map(sub => {
        const trigger = sub.trigger.split(' ')[0];
        return `• \`${cmd.name} ${trigger}\``;
      }).join('\n');
    }
    return `• \`${cmd.name}\``;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0xFFFFFF)
    .setTitle(`${categoryInfo?.emoji || '📦'} ${categoryInfo?.name || 'Category'}`)
    .setDescription(categoryInfo?.description || 'Explore the commands in this category')
    .setThumbnail(client?.user?.displayAvatarURL() || "https://cdn.discordapp.com/embed/avatars/0.png")
    .addFields(
      { name: "📝 Available Commands", value: commandsList, inline: false },
      { name: "💡 Need Help?", value: `Use \`${prefix || '!'}help <command>\` to get detailed information about a specific command.`, inline: false }
    )
    .setFooter({ text: "Powered by Blackbit Studio" })
    .setTimestamp();

  return { embeds: [embed] };
}

function getBackButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("home-btn")
      .setLabel("◀️ Back")
      .setStyle(ButtonStyle.Secondary)
  );
}