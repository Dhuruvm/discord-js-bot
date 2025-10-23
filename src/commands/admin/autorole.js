const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");
const InteractionHelpers = require("@helpers/InteractionHelpers");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "autorole",
  description: "Manage automatic role assignment for new members",
  category: "GATEWAY",
  userPermissions: ["ManageGuild"],
  botPermissions: ["ManageRoles"],
  command: {
    enabled: true,
    aliases: ["autoassign", "joinrole"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "bots",
        description: "Manage autoroles for bots",
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: "add",
            description: "Add a role to be assigned to new bots",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "role",
                description: "The role to assign",
                type: ApplicationCommandOptionType.Role,
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remove a bot autorole",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "role",
                description: "The role to remove",
                type: ApplicationCommandOptionType.Role,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: "humans",
        description: "Manage autoroles for humans",
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: "add",
            description: "Add a role to be assigned to new humans",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "role",
                description: "The role to assign",
                type: ApplicationCommandOptionType.Role,
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remove a human autorole",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: "role",
                description: "The role to remove",
                type: ApplicationCommandOptionType.Role,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: "config",
        description: "View current autorole configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "reset",
        description: "Remove all autoroles",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    return message.safeReply("Please use slash commands for autorole configuration: `/autorole`");
  },

  async interactionRun(interaction, data) {
    await interaction.deferReply({ ephemeral: true });
    
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;

    // Bots group
    if (group === "bots") {
      if (sub === "add") {
        const role = interaction.options.getRole("role");
        response = await addBotRole(interaction, role, settings);
      } else if (sub === "remove") {
        const role = interaction.options.getRole("role");
        response = await removeBotRole(interaction, role, settings);
      }
    }
    // Humans group
    else if (group === "humans") {
      if (sub === "add") {
        const role = interaction.options.getRole("role");
        response = await addHumanRole(interaction, role, settings);
      } else if (sub === "remove") {
        const role = interaction.options.getRole("role");
        response = await removeHumanRole(interaction, role, settings);
      }
    }
    // Direct subcommands (no group)
    else {
      if (sub === "config") {
        response = await showConfig(interaction, settings);
      } else if (sub === "reset") {
        // Use confirmation dialog for destructive action
        const totalRoles = (settings.autorole?.humans?.length || 0) + (settings.autorole?.bots?.length || 0);
        if (totalRoles === 0) {
          response = ModernEmbed.simpleError("There are no autoroles configured to reset");
        } else {
          response = InteractionHelpers.createConfirmation(
            "Confirm Reset",
            `Are you sure you want to remove all ${totalRoles} autorole(s)?\nThis action cannot be undone.`,
            "autorole:reset"
          );
        }
      }
    }

    await interaction.followUp(response);
  },
};

/**
 * Add a bot autorole
 */
async function addBotRole({ guild }, role, settings) {
  const validation = validateRole(guild, role);
  if (validation.error) return ModernEmbed.simpleError(validation.error);

  if (!settings.autorole) settings.autorole = { humans: [], bots: [] };
  if (!settings.autorole.bots) settings.autorole.bots = [];

  if (settings.autorole.bots.includes(role.id)) {
    return ModernEmbed.simpleError(`${role} is already configured as a bot autorole`);
  }

  settings.autorole.bots.push(role.id);
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Bot Autorole Added\n\n${role} will now be assigned to new bots automatically`);
}

/**
 * Remove a bot autorole
 */
async function removeBotRole({ guild }, role, settings) {
  if (!settings.autorole || !settings.autorole.bots || !settings.autorole.bots.includes(role.id)) {
    return ModernEmbed.simpleError(`${role} is not configured as a bot autorole`);
  }

  settings.autorole.bots = settings.autorole.bots.filter(id => id !== role.id);
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Bot Autorole Removed\n\n${role} will no longer be assigned to new bots`);
}

/**
 * Add a human autorole
 */
async function addHumanRole({ guild }, role, settings) {
  const validation = validateRole(guild, role);
  if (validation.error) return ModernEmbed.simpleError(validation.error);

  if (!settings.autorole) settings.autorole = { humans: [], bots: [] };
  if (!settings.autorole.humans) settings.autorole.humans = [];

  if (settings.autorole.humans.includes(role.id)) {
    return ModernEmbed.simpleError(`${role} is already configured as a human autorole`);
  }

  settings.autorole.humans.push(role.id);
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Human Autorole Added\n\n${role} will now be assigned to new members automatically`);
}

/**
 * Remove a human autorole
 */
async function removeHumanRole({ guild }, role, settings) {
  if (!settings.autorole || !settings.autorole.humans || !settings.autorole.humans.includes(role.id)) {
    return ModernEmbed.simpleError(`${role} is not configured as a human autorole`);
  }

  settings.autorole.humans = settings.autorole.humans.filter(id => id !== role.id);
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Human Autorole Removed\n\n${role} will no longer be assigned to new members`);
}

/**
 * Show current configuration
 */
async function showConfig({ guild }, settings) {
  const embed = new ModernEmbed()
    .setColor(0x5865F2)
    .setHeader("⚙️ Autorole Configuration", "Current automatic role assignment settings");

  // Human roles
  let humanRoles = "None configured";
  if (settings.autorole && settings.autorole.humans && settings.autorole.humans.length > 0) {
    const roles = settings.autorole.humans
      .map(id => guild.roles.cache.get(id))
      .filter(r => r)
      .map(r => r.toString());
    humanRoles = roles.length > 0 ? roles.join(", ") : "None (some roles may have been deleted)";
  }

  // Bot roles
  let botRoles = "None configured";
  if (settings.autorole && settings.autorole.bots && settings.autorole.bots.length > 0) {
    const roles = settings.autorole.bots
      .map(id => guild.roles.cache.get(id))
      .filter(r => r)
      .map(r => r.toString());
    botRoles = roles.length > 0 ? roles.join(", ") : "None (some roles may have been deleted)";
  }

  embed.addField("👥 Human Roles", humanRoles, false);
  embed.addField("🤖 Bot Roles", botRoles, false);
  embed.setFooter("Use /autorole humans add or /autorole bots add to configure");

  return embed.build();
}

/**
 * Reset all autoroles
 */
async function resetAutoroles(interaction, settings) {
  const totalRoles = (settings.autorole?.humans?.length || 0) + (settings.autorole?.bots?.length || 0);
  
  if (totalRoles === 0) {
    return ModernEmbed.simpleError("There are no autoroles configured to reset");
  }

  settings.autorole = { humans: [], bots: [] };
  await settings.save();

  return ModernEmbed.simpleSuccess(`✅ Autoroles Reset\n\nAll ${totalRoles} autorole(s) have been removed`);
}

/**
 * Validate a role can be assigned
 */
function validateRole(guild, role) {
  if (role.id === guild.roles.everyone.id) {
    return { error: "You cannot set @everyone as an autorole" };
  }

  if (!guild.members.me.permissions.has("ManageRoles")) {
    return { error: "I don't have the ManageRoles permission" };
  }

  if (guild.members.me.roles.highest.position <= role.position) {
    return { error: `I cannot assign ${role} because it's higher than or equal to my highest role` };
  }

  if (role.managed) {
    return { error: `${role} is managed by an integration and cannot be assigned` };
  }

  return { error: null };
}
