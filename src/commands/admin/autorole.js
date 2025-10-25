const { ApplicationCommandOptionType, ComponentType, ButtonStyle, TextInputStyle } = require("discord.js");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const InteractionUtils = require("@helpers/InteractionUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "autorole",
  description: "Manage automatic role assignment for new members with interactive panel",
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
  },

  async messageRun(message, args, data) {
    await showAutorolePanel(message, false, data.settings);
  },

  async interactionRun(interaction, data) {
    await interaction.deferReply({ ephemeral: true });
    await showAutorolePanel(interaction, true, data.settings);
  },
};

/**
 * Show autorole panel
 */
async function showAutorolePanel(source, isInteraction, settings) {
  const autorole = settings.autorole || {};
  
  const components = [];
  
  components.push(ContainerBuilder.createTextDisplay("# 🎭 Auto-Role System"));
  components.push(ContainerBuilder.createSeparator());
  
  components.push(ContainerBuilder.createTextDisplay(
    "## Role Assignment\n" +
    "Automatically assign roles to members when they join your server."
  ));
  
  components.push(ContainerBuilder.createSeparator());
  
  // Human roles
  const humanRoles = autorole.humans || [];
  let humanRoleText = "None configured";
  if (humanRoles.length > 0) {
    const roles = humanRoles
      .map(id => source.guild.roles.cache.get(id))
      .filter(r => r)
      .map(r => r.toString());
    humanRoleText = roles.length > 0 ? roles.join(", ") : "None (roles may have been deleted)";
  }
  components.push(ContainerBuilder.createTextDisplay(`**👥 Human Roles (${humanRoles.length}):**\n${humanRoleText}`));
  
  components.push(ContainerBuilder.createSeparator());
  
  // Bot roles
  const botRoles = autorole.bots || [];
  let botRoleText = "None configured";
  if (botRoles.length > 0) {
    const roles = botRoles
      .map(id => source.guild.roles.cache.get(id))
      .filter(r => r)
      .map(r => r.toString());
    botRoleText = roles.length > 0 ? roles.join(", ") : "None (roles may have been deleted)";
  }
  components.push(ContainerBuilder.createTextDisplay(`**🤖 Bot Roles (${botRoles.length}):**\n${botRoleText}`));
  
  const buttonRow1 = InteractionUtils.createButtonRow([
    {
      customId: "autorole_humans",
      label: "Human Roles",
      emoji: "👥",
      style: ButtonStyle.Primary,
    },
    {
      customId: "autorole_bots",
      label: "Bot Roles",
      emoji: "🤖",
      style: ButtonStyle.Primary,
    },
  ]);
  
  const buttonRow2 = InteractionUtils.createButtonRow([
    {
      customId: "autorole_reset",
      label: "Reset All",
      emoji: "🔄",
      style: ButtonStyle.Danger,
      disabled: humanRoles.length === 0 && botRoles.length === 0,
    },
  ]);
  
  const payload = new ContainerBuilder()
    .addContainer({
      accentColor: 0x5865F2,
      components: components
    })
    .build();
  
  payload.components.push(buttonRow1, buttonRow2);
  
  const msg = isInteraction
    ? await source.editReply(payload)
    : await source.safeReply(payload);
  
  setupCollector(msg, source, isInteraction, settings);
}

/**
 * Setup collector
 */
function setupCollector(message, source, isInteraction, settings) {
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === (isInteraction ? source.user.id : source.author.id),
    time: 300000,
  });
  
  collector.on("collect", async (interaction) => {
    try {
      switch (interaction.customId) {
        case "autorole_humans":
          await handleHumanRoles(interaction, source, isInteraction, settings);
          break;
        case "autorole_bots":
          await handleBotRoles(interaction, source, isInteraction, settings);
          break;
        case "autorole_reset":
          await handleReset(interaction, settings);
          await showAutorolePanel(source, isInteraction, settings);
          break;
      }
    } catch (error) {
      console.error("Autorole panel error:", error);
      await interaction.reply({
        content: `❌ An error occurred: ${error.message}`,
        ephemeral: true,
      }).catch(() => {});
    }
  });
  
  collector.on("end", () => {
    if (message && message.components) {
      message.edit({
        components: InteractionUtils.disableComponents(message.components)
      }).catch(() => {});
    }
  });
}

/**
 * Handle human roles management
 */
async function handleHumanRoles(interaction, source, isInteraction, settings) {
  const humanRoles = settings.autorole?.humans || [];
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("## 👥 Human Auto-Roles"));
  components.push(ContainerBuilder.createSeparator());
  
  if (humanRoles.length === 0) {
    components.push(ContainerBuilder.createTextDisplay("**No human roles configured**\n\nAdd roles to assign to new members."));
  } else {
    const roles = humanRoles
      .map(id => interaction.guild.roles.cache.get(id))
      .filter(r => r);
    const roleList = roles.length > 0 
      ? roles.map(r => r.toString()).join("\n")
      : "None (roles may have been deleted)";
    components.push(ContainerBuilder.createTextDisplay(`**Configured Roles (${roles.length}):**\n${roleList}`));
  }
  
  const buttonRow = InteractionUtils.createButtonRow([
    {
      customId: "human_role_add",
      label: "Add Role",
      emoji: "➕",
      style: ButtonStyle.Success,
    },
    {
      customId: "human_role_remove",
      label: "Remove Role",
      emoji: "➖",
      style: ButtonStyle.Danger,
      disabled: humanRoles.length === 0,
    },
  ]);
  
  const payload = new ContainerBuilder()
    .addContainer({ accentColor: 0x5865F2, components: components })
    .build();
  
  payload.components.push(buttonRow);
  
  await interaction.reply({ ...payload, ephemeral: true });
  
  const response = await InteractionUtils.awaitComponent(
    await interaction.fetchReply(),
    interaction.user.id,
    { componentType: ComponentType.Button },
    60000
  );
  
  if (!response) {
    return interaction.editReply({ content: "⏱️ Selection timed out", components: [] });
  }
  
  if (response.customId === "human_role_add") {
    const modal = InteractionUtils.createModal("human_role_add", "Add Human Auto-Role", [
      {
        customId: "role_id",
        label: "Role ID",
        style: TextInputStyle.Short,
        placeholder: "Enter role ID",
        required: true,
      },
    ]);
    
    await response.showModal(modal);
    
    const modalSubmit = await InteractionUtils.awaitModalSubmit(response, "human_role_add", 120000);
    if (!modalSubmit) return;
    
    const roleId = modalSubmit.fields.getTextInputValue("role_id");
    const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
    
    if (!role) {
      return modalSubmit.reply({
        embeds: [InteractionUtils.createErrorEmbed("Invalid role ID!")],
        ephemeral: true
      });
    }
    
    // Validate role
    const validation = validateRole(interaction.guild, role);
    if (validation.error) {
      return modalSubmit.reply({
        embeds: [InteractionUtils.createErrorEmbed(validation.error)],
        ephemeral: true
      });
    }
    
    if (!settings.autorole) settings.autorole = { humans: [], bots: [] };
    if (!settings.autorole.humans) settings.autorole.humans = [];
    
    if (settings.autorole.humans.includes(role.id)) {
      return modalSubmit.reply({
        embeds: [InteractionUtils.createErrorEmbed(`${role} is already configured as a human autorole`)],
        ephemeral: true
      });
    }
    
    settings.autorole.humans.push(role.id);
    await settings.save();
    
    await modalSubmit.reply({
      embeds: [InteractionUtils.createSuccessEmbed(
        `✅ Human Role Added\n\n${role} will now be assigned to new members`
      )],
      ephemeral: true
    });
    
    await showAutorolePanel(source, isInteraction, settings);
  } else if (response.customId === "human_role_remove") {
    const modal = InteractionUtils.createModal("human_role_remove", "Remove Human Auto-Role", [
      {
        customId: "role_id",
        label: "Role ID",
        style: TextInputStyle.Short,
        placeholder: "Enter role ID to remove",
        required: true,
      },
    ]);
    
    await response.showModal(modal);
    
    const modalSubmit = await InteractionUtils.awaitModalSubmit(response, "human_role_remove", 120000);
    if (!modalSubmit) return;
    
    const roleId = modalSubmit.fields.getTextInputValue("role_id");
    
    if (!settings.autorole?.humans?.includes(roleId)) {
      return modalSubmit.reply({
        embeds: [InteractionUtils.createErrorEmbed("Role is not configured as a human autorole")],
        ephemeral: true
      });
    }
    
    settings.autorole.humans = settings.autorole.humans.filter(id => id !== roleId);
    await settings.save();
    
    await modalSubmit.reply({
      embeds: [InteractionUtils.createSuccessEmbed(
        `✅ Role Removed\n\n<@&${roleId}> will no longer be assigned to new members`
      )],
      ephemeral: true
    });
    
    await showAutorolePanel(source, isInteraction, settings);
  }
}

/**
 * Handle bot roles management
 */
async function handleBotRoles(interaction, source, isInteraction, settings) {
  const botRoles = settings.autorole?.bots || [];
  
  const components = [];
  components.push(ContainerBuilder.createTextDisplay("## 🤖 Bot Auto-Roles"));
  components.push(ContainerBuilder.createSeparator());
  
  if (botRoles.length === 0) {
    components.push(ContainerBuilder.createTextDisplay("**No bot roles configured**\n\nAdd roles to assign to new bots."));
  } else {
    const roles = botRoles
      .map(id => interaction.guild.roles.cache.get(id))
      .filter(r => r);
    const roleList = roles.length > 0 
      ? roles.map(r => r.toString()).join("\n")
      : "None (roles may have been deleted)";
    components.push(ContainerBuilder.createTextDisplay(`**Configured Roles (${roles.length}):**\n${roleList}`));
  }
  
  const buttonRow = InteractionUtils.createButtonRow([
    {
      customId: "bot_role_add",
      label: "Add Role",
      emoji: "➕",
      style: ButtonStyle.Success,
    },
    {
      customId: "bot_role_remove",
      label: "Remove Role",
      emoji: "➖",
      style: ButtonStyle.Danger,
      disabled: botRoles.length === 0,
    },
  ]);
  
  const payload = new ContainerBuilder()
    .addContainer({ accentColor: 0x5865F2, components: components })
    .build();
  
  payload.components.push(buttonRow);
  
  await interaction.reply({ ...payload, ephemeral: true });
  
  const response = await InteractionUtils.awaitComponent(
    await interaction.fetchReply(),
    interaction.user.id,
    { componentType: ComponentType.Button },
    60000
  );
  
  if (!response) {
    return interaction.editReply({ content: "⏱️ Selection timed out", components: [] });
  }
  
  if (response.customId === "bot_role_add") {
    const modal = InteractionUtils.createModal("bot_role_add", "Add Bot Auto-Role", [
      {
        customId: "role_id",
        label: "Role ID",
        style: TextInputStyle.Short,
        placeholder: "Enter role ID",
        required: true,
      },
    ]);
    
    await response.showModal(modal);
    
    const modalSubmit = await InteractionUtils.awaitModalSubmit(response, "bot_role_add", 120000);
    if (!modalSubmit) return;
    
    const roleId = modalSubmit.fields.getTextInputValue("role_id");
    const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
    
    if (!role) {
      return modalSubmit.reply({
        embeds: [InteractionUtils.createErrorEmbed("Invalid role ID!")],
        ephemeral: true
      });
    }
    
    // Validate role
    const validation = validateRole(interaction.guild, role);
    if (validation.error) {
      return modalSubmit.reply({
        embeds: [InteractionUtils.createErrorEmbed(validation.error)],
        ephemeral: true
      });
    }
    
    if (!settings.autorole) settings.autorole = { humans: [], bots: [] };
    if (!settings.autorole.bots) settings.autorole.bots = [];
    
    if (settings.autorole.bots.includes(role.id)) {
      return modalSubmit.reply({
        embeds: [InteractionUtils.createErrorEmbed(`${role} is already configured as a bot autorole`)],
        ephemeral: true
      });
    }
    
    settings.autorole.bots.push(role.id);
    await settings.save();
    
    await modalSubmit.reply({
      embeds: [InteractionUtils.createSuccessEmbed(
        `✅ Bot Role Added\n\n${role} will now be assigned to new bots`
      )],
      ephemeral: true
    });
    
    await showAutorolePanel(source, isInteraction, settings);
  } else if (response.customId === "bot_role_remove") {
    const modal = InteractionUtils.createModal("bot_role_remove", "Remove Bot Auto-Role", [
      {
        customId: "role_id",
        label: "Role ID",
        style: TextInputStyle.Short,
        placeholder: "Enter role ID to remove",
        required: true,
      },
    ]);
    
    await response.showModal(modal);
    
    const modalSubmit = await InteractionUtils.awaitModalSubmit(response, "bot_role_remove", 120000);
    if (!modalSubmit) return;
    
    const roleId = modalSubmit.fields.getTextInputValue("role_id");
    
    if (!settings.autorole?.bots?.includes(roleId)) {
      return modalSubmit.reply({
        embeds: [InteractionUtils.createErrorEmbed("Role is not configured as a bot autorole")],
        ephemeral: true
      });
    }
    
    settings.autorole.bots = settings.autorole.bots.filter(id => id !== roleId);
    await settings.save();
    
    await modalSubmit.reply({
      embeds: [InteractionUtils.createSuccessEmbed(
        `✅ Role Removed\n\n<@&${roleId}> will no longer be assigned to new bots`
      )],
      ephemeral: true
    });
    
    await showAutorolePanel(source, isInteraction, settings);
  }
}

/**
 * Handle reset
 */
async function handleReset(interaction, settings) {
  const totalRoles = (settings.autorole?.humans?.length || 0) + (settings.autorole?.bots?.length || 0);
  
  if (totalRoles === 0) {
    return interaction.reply({
      embeds: [InteractionUtils.createErrorEmbed("There are no autoroles configured to reset")],
      ephemeral: true
    });
  }
  
  settings.autorole = { humans: [], bots: [] };
  await settings.save();
  
  await interaction.reply({
    embeds: [InteractionUtils.createSuccessEmbed(
      `✅ Autoroles Reset\n\nAll ${totalRoles} autorole(s) have been removed`
    )],
    ephemeral: true
  });
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
