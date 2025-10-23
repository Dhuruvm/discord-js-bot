const {
  ApplicationCommandOptionType,
  ComponentType,
  ButtonStyle,
  TextInputStyle,
} = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const InteractionUtils = require("@helpers/InteractionUtils");

const RESERVED_KEYWORDS = ["help", "ping", "info", "support", "invite", "stats"];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "customalias",
  description: "Manage custom command aliases for this server",
  category: "UTILITY",
  userPermissions: ["ManageGuild"],
  botPermissions: ["SendMessages", "EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["calias", "setalias"],
    usage: "",
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "add",
        description: "Add a custom alias for a command",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "alias",
            description: "The custom alias to create",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "command",
            description: "The original command name",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "Remove a custom alias",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "alias",
            description: "The custom alias to remove",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "list",
        description: "List all custom aliases in this server",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args) {
    await showMainMenu(message, false);
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const alias = interaction.options.getString("alias").toLowerCase();
      const command = interaction.options.getString("command").toLowerCase();
      const response = await addCustomAlias(interaction.guild, alias, command, interaction.user.id, interaction.client);
      return interaction.followUp(response);
    }

    if (sub === "remove") {
      const alias = interaction.options.getString("alias").toLowerCase();
      const response = await removeCustomAlias(interaction.guild, alias);
      return interaction.followUp(response);
    }

    if (sub === "list") {
      const response = await listCustomAliases(interaction.guild);
      return interaction.followUp(response);
    }
  },
};

/**
 * Show main interactive menu
 */
async function showMainMenu(source, isInteraction) {
  const settings = await getSettings(source.guild);
  const aliasCount = settings.custom_aliases ? settings.custom_aliases.length : 0;

  const embed = InteractionUtils.createThemedEmbed({
    title: "🔧 Custom Command Aliases",
    description:
      "Create custom aliases for any command in this server!\n\n" +
      "**What are Custom Aliases?**\n" +
      "Custom aliases let you create shortcuts for commands. " +
      "For example, you can make `m` work as an alias for `music`.\n\n" +
      `**Current Aliases:** ${aliasCount}`,
    fields: [
      {
        name: "📝 Add Alias",
        value: "Create a new custom alias for any command",
        inline: true,
      },
      {
        name: "🗑️ Remove Alias",
        value: "Delete an existing custom alias",
        inline: true,
      },
      {
        name: "📋 List Aliases",
        value: "View all custom aliases in this server",
        inline: true,
      },
    ],
    footer: "Select an action below",
  });

  const buttons = InteractionUtils.createButtonRow([
    {
      customId: "alias_add",
      label: "Add Alias",
      emoji: "📝",
      style: ButtonStyle.Success,
    },
    {
      customId: "alias_remove",
      label: "Remove Alias",
      emoji: "🗑️",
      style: ButtonStyle.Danger,
      disabled: aliasCount === 0,
    },
    {
      customId: "alias_list",
      label: "List Aliases",
      emoji: "📋",
      style: ButtonStyle.Primary,
      disabled: aliasCount === 0,
    },
  ]);

  const msg = isInteraction
    ? await source.editReply({ embeds: [embed], components: [buttons] })
    : await source.channel.send({ embeds: [embed], components: [buttons] });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === (isInteraction ? source.user.id : source.author.id),
    time: 120000,
  });

  collector.on("collect", async (interaction) => {
    try {
      if (interaction.customId === "alias_add") {
        await showAddAliasModal(interaction);
      } else if (interaction.customId === "alias_remove") {
        await showRemoveAliasModal(interaction);
      } else if (interaction.customId === "alias_list") {
        await interaction.deferUpdate();
        const response = await listCustomAliases(interaction.guild);
        await interaction.followUp({ ...response, ephemeral: true });
      }
    } catch (error) {
      console.error("Custom alias menu error:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `❌ An error occurred: ${error.message}`,
          ephemeral: true,
        }).catch(() => {});
      }
    }
  });

  collector.on("end", () => {
    msg.edit({ components: InteractionUtils.disableComponents([buttons]) }).catch(() => {});
  });
}

/**
 * Show add alias modal
 */
async function showAddAliasModal(interaction) {
  const modal = InteractionUtils.createModal("alias_add_modal", "Add Custom Alias", [
    {
      customId: "alias",
      label: "Custom Alias",
      style: TextInputStyle.Short,
      placeholder: "e.g., m, ban, pb",
      required: true,
      minLength: 1,
      maxLength: 32,
    },
    {
      customId: "command",
      label: "Command Name",
      style: TextInputStyle.Short,
      placeholder: "e.g., music, moderation, purgebots",
      required: true,
      minLength: 1,
      maxLength: 32,
    },
  ]);

  await interaction.showModal(modal);

  const modalSubmit = await InteractionUtils.awaitModalSubmit(interaction, "alias_add_modal", 120000);

  if (modalSubmit) {
    const alias = modalSubmit.fields.getTextInputValue("alias").toLowerCase().trim();
    const command = modalSubmit.fields.getTextInputValue("command").toLowerCase().trim();

    await modalSubmit.deferReply({ ephemeral: true });
    const response = await addCustomAlias(interaction.guild, alias, command, interaction.user.id, interaction.client);
    await modalSubmit.followUp(response);
  }
}

/**
 * Show remove alias modal
 */
async function showRemoveAliasModal(interaction) {
  const settings = await getSettings(interaction.guild);

  if (!settings.custom_aliases || settings.custom_aliases.length === 0) {
    return interaction.reply({
      content: "❌ No custom aliases to remove!",
      ephemeral: true,
    });
  }

  const options = settings.custom_aliases.map((ca) => ({
    label: ca.alias,
    value: ca.alias,
    description: `Alias for: ${ca.command}`,
  }));

  const selectMenu = InteractionUtils.createSelectMenu(
    "alias_remove_select",
    "Select an alias to remove",
    options
  );

  await interaction.reply({
    content: "Select the alias you want to remove:",
    components: [selectMenu],
    ephemeral: true,
  });

  const response = await interaction.channel.awaitMessageComponent({
    filter: (i) => i.user.id === interaction.user.id && i.customId === "alias_remove_select",
    time: 60000,
  }).catch(() => null);

  if (response) {
    await response.deferUpdate();
    const alias = response.values[0];
    const result = await removeCustomAlias(interaction.guild, alias);
    await response.followUp({ ...result, ephemeral: true });
  }
}

/**
 * Add a custom alias
 */
async function addCustomAlias(guild, alias, commandName, userId, client) {
  const settings = await getSettings(guild);

  if (!settings.custom_aliases) settings.custom_aliases = [];

  alias = alias.toLowerCase().trim();
  commandName = commandName.toLowerCase().trim();

  if (!alias || !commandName) {
    return {
      embeds: [InteractionUtils.createErrorEmbed("Alias and command name cannot be empty!")],
    };
  }

  if (alias.includes(" ") || commandName.includes(" ")) {
    return {
      embeds: [InteractionUtils.createErrorEmbed("Alias and command name cannot contain spaces!")],
    };
  }

  if (RESERVED_KEYWORDS.includes(alias)) {
    return {
      embeds: [InteractionUtils.createErrorEmbed(`Cannot use reserved keyword: \`${alias}\``)],
    };
  }

  const cmd = client.getCommand(commandName);
  if (!cmd) {
    return {
      embeds: [InteractionUtils.createErrorEmbed(`Command \`${commandName}\` not found!`)],
    };
  }

  if (client.getCommand(alias)) {
    return {
      embeds: [InteractionUtils.createErrorEmbed(`Alias \`${alias}\` conflicts with an existing command!`)],
    };
  }

  const existing = settings.custom_aliases.find((ca) => ca.alias === alias);
  if (existing) {
    return {
      embeds: [InteractionUtils.createErrorEmbed(`Alias \`${alias}\` already exists for command \`${existing.command}\`!`)],
    };
  }

  if (settings.custom_aliases.length >= 50) {
    return {
      embeds: [InteractionUtils.createErrorEmbed("Maximum of 50 custom aliases per server reached!")],
    };
  }

  settings.custom_aliases.push({
    alias: alias,
    command: commandName,
    created_by: userId,
    created_at: new Date(),
  });

  await settings.save();

  const embed = InteractionUtils.createThemedEmbed({
    description: `✅ Successfully created alias \`${alias}\` → \`${commandName}\``,
    color: 0x00FF00,
  });

  return { embeds: [embed] };
}

/**
 * Remove a custom alias
 */
async function removeCustomAlias(guild, alias) {
  const settings = await getSettings(guild);

  if (!settings.custom_aliases || settings.custom_aliases.length === 0) {
    return {
      embeds: [InteractionUtils.createErrorEmbed("No custom aliases exist in this server!")],
    };
  }

  const existing = settings.custom_aliases.find((ca) => ca.alias === alias.toLowerCase());
  if (!existing) {
    return {
      embeds: [InteractionUtils.createErrorEmbed(`Alias \`${alias}\` not found!`)],
    };
  }

  settings.custom_aliases = settings.custom_aliases.filter((ca) => ca.alias !== alias.toLowerCase());
  await settings.save();

  const embed = InteractionUtils.createThemedEmbed({
    description: `✅ Successfully removed alias \`${alias}\``,
    color: 0x00FF00,
  });

  return { embeds: [embed] };
}

/**
 * List all custom aliases
 */
async function listCustomAliases(guild) {
  const settings = await getSettings(guild);

  if (!settings.custom_aliases || settings.custom_aliases.length === 0) {
    return {
      embeds: [InteractionUtils.createWarningEmbed("No custom aliases have been created yet!")],
    };
  }

  const description = settings.custom_aliases
    .map((ca, index) => {
      const creator = guild.members.cache.get(ca.created_by);
      const creatorTag = creator ? creator.user.tag : "Unknown";
      return `${index + 1}. \`${ca.alias}\` → \`${ca.command}\` (by ${creatorTag})`;
    })
    .join("\n");

  const embed = InteractionUtils.createThemedEmbed({
    title: "📋 Custom Command Aliases",
    description: description,
    footer: `Total: ${settings.custom_aliases.length}/50`,
  });

  return { embeds: [embed] };
}
