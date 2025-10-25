const ModernEmbed = require("@helpers/ModernEmbed");
const EmojiManager = require("@helpers/EmojiManager");
const { ActionRowBuilder, StringSelectMenuBuilder, RoleSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = async function handleAutoroleInteraction(interaction) {
  if (!interaction.customId.startsWith("autorole")) return;

  const parts = interaction.customId.split(":");
  const action = parts[1];
  const data = parts[2];

  try {
    if (interaction.isButton()) {
      if (action === "reset") {
        await handleReset(interaction, data);
      } else if (action === "manage") {
        await showRoleManager(interaction, data);
      } else if (action === "back") {
        await showAutorolePanel(interaction);
      } else if (action === "toggle") {
        await handleToggle(interaction, data);
      }
    } else if (interaction.isStringSelectMenu() || interaction.isRoleSelectMenu()) {
      if (action === "add") {
        await handleAddRoles(interaction, data);
      } else if (action === "remove") {
        await handleRemoveRoles(interaction, data);
      }
    }
  } catch (error) {
    console.error("[Autorole Handler] Error:", error);
    const reply = {
      embeds: [ModernEmbed.simpleError(`${EmojiManager.getError()} Failed: ${error.message}`).embeds[0]],
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
};

async function handleToggle(interaction, type) {
  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  
  if (!settings.autorole) settings.autorole = { humans: [], bots: [] };
  
  const targetArray = type === "humans" ? "humans" : "bots";
  const isEnabled = settings.autorole[targetArray]?.length > 0;
  
  if (!isEnabled) {
    return interaction.reply({
      embeds: [ModernEmbed.simpleError(
        `${EmojiManager.getError()} No autoroles configured for ${type}. Add roles first!`
      ).embeds[0]],
      ephemeral: true
    });
  }
  
  await interaction.reply({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} Autorole for ${type} is active with ${settings.autorole[targetArray].length} role(s)!`
    ).embeds[0]],
    ephemeral: true
  });
}

async function showAutorolePanel(interaction) {
  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  const autorole = settings.autorole || { humans: [], bots: [] };
  
  const humanRoles = autorole.humans || [];
  const botRoles = autorole.bots || [];
  
  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`${EmojiManager.get("settings", "⚙️")} Autorole System`, 
      "Automatically assign roles to new members when they join your server.\n\n" +
      `**Human Autoroles (${humanRoles.length}):**\n` +
      (humanRoles.length > 0 ? humanRoles.map(id => `<@&${id}>`).join(", ") : "None configured") +
      `\n\n**Bot Autoroles (${botRoles.length}):**\n` +
      (botRoles.length > 0 ? botRoles.map(id => `<@&${id}>`).join(", ") : "None configured")
    );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("autorole:select")
    .setPlaceholder(`${EmojiManager.get("settings", "⚙️")} Manage Autoroles`)
    .addOptions([
      {
        label: "Human Roles",
        value: "humans",
        description: `${humanRoles.length} role(s) configured`,
        emoji: EmojiManager.get("user", "👤")
      },
      {
        label: "Bot Roles",
        value: "bots",
        description: `${botRoles.length} role(s) configured`,
        emoji: EmojiManager.get("bot", "🤖")
      }
    ]);

  const resetButton = new ButtonBuilder()
    .setCustomId("autorole:reset:confirm")
    .setLabel("Reset All")
    .setEmoji(EmojiManager.get("delete", "🗑️"))
    .setStyle(ButtonStyle.Danger)
    .setDisabled(humanRoles.length === 0 && botRoles.length === 0);

  const method = interaction.deferred || interaction.replied ? "editReply" : "update";
  await interaction[method]({
    ...embed.toMessage(),
    components: [
      new ActionRowBuilder().addComponents(selectMenu),
      new ActionRowBuilder().addComponents(resetButton)
    ]
  });
}

async function showRoleManager(interaction, type) {
  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  const autorole = settings.autorole || { humans: [], bots: [] };
  const currentRoles = autorole[type] || [];
  
  const title = type === "humans" ? "Human Autoroles" : "Bot Autoroles";
  const emoji = type === "humans" ? EmojiManager.get("user", "👤") : EmojiManager.get("bot", "🤖");
  
  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`${emoji} ${title}`, 
      `**Current Roles (${currentRoles.length}):**\n` +
      (currentRoles.length > 0 ? currentRoles.map(id => `<@&${id}>`).join(", ") : "None") +
      `\n\n${EmojiManager.get("info", "ℹ️")} Use the menus below to add or remove roles.`
    );

  const availableRoles = interaction.guild.roles.cache
    .filter(r => !r.managed && r.id !== interaction.guild.id && !currentRoles.includes(r.id))
    .sort((a, b) => b.position - a.position)
    .first(25);

  const addMenu = new RoleSelectMenuBuilder()
    .setCustomId(`autorole:add:${type}`)
    .setPlaceholder(`${EmojiManager.get("yes", "✅")} Add roles`)
    .setMinValues(0)
    .setMaxValues(Math.min(10, 25));

  const rows = [new ActionRowBuilder().addComponents(addMenu)];

  if (currentRoles.length > 0) {
    const removeOptions = currentRoles.slice(0, 25).map(roleId => {
      const role = interaction.guild.roles.cache.get(roleId);
      return {
        label: role ? role.name : "Unknown Role",
        value: roleId,
        description: role ? `Position: ${role.position}` : "Role not found",
        emoji: EmojiManager.get("cross", "✕")
      };
    });

    const removeMenu = new StringSelectMenuBuilder()
      .setCustomId(`autorole:remove:${type}`)
      .setPlaceholder(`${EmojiManager.get("no", "❌")} Remove roles`)
      .setMinValues(0)
      .setMaxValues(Math.min(removeOptions.length, 25))
      .addOptions(removeOptions);

    rows.push(new ActionRowBuilder().addComponents(removeMenu));
  }

  const backButton = new ButtonBuilder()
    .setCustomId("autorole:back")
    .setLabel("Back")
    .setEmoji(EmojiManager.get("arrow_left", "◀️"))
    .setStyle(ButtonStyle.Secondary);

  rows.push(new ActionRowBuilder().addComponents(backButton));

  await interaction.update({
    ...embed.toMessage(),
    components: rows
  });
}

async function handleAddRoles(interaction, type) {
  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  
  if (!settings.autorole) settings.autorole = { humans: [], bots: [] };
  
  const selectedRoles = interaction.values;
  const currentRoles = settings.autorole[type] || [];
  
  const newRoles = selectedRoles.filter(id => !currentRoles.includes(id));
  settings.autorole[type] = [...currentRoles, ...newRoles];
  
  await settings.save();

  await interaction.update({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} Added ${newRoles.length} role(s) to ${type} autoroles!\n\n` +
      `**Total Autoroles:** ${settings.autorole[type].length}`
    ).embeds[0]],
    components: []
  });

  setTimeout(async () => {
    await showRoleManager(interaction, type).catch(() => {});
  }, 1500);
}

async function handleRemoveRoles(interaction, type) {
  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  
  if (!settings.autorole) settings.autorole = { humans: [], bots: [] };
  
  const rolesToRemove = interaction.values;
  settings.autorole[type] = (settings.autorole[type] || []).filter(id => !rolesToRemove.includes(id));
  
  await settings.save();

  await interaction.update({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} Removed ${rolesToRemove.length} role(s) from ${type} autoroles!\n\n` +
      `**Remaining Autoroles:** ${settings.autorole[type].length}`
    ).embeds[0]],
    components: []
  });

  setTimeout(async () => {
    await showRoleManager(interaction, type).catch(() => {});
  }, 1500);
}

async function handleReset(interaction, confirmation) {
  if (confirmation !== "confirm") {
    const embed = new ModernEmbed()
      .setColor(0xFFFFFF)
      .setHeader(`${EmojiManager.getWarning()} Confirm Reset`, 
        "Are you sure you want to reset **all** autoroles?\n\nThis will remove both human and bot autoroles."
      );

    const confirmButton = new ButtonBuilder()
      .setCustomId("autorole:reset:confirm")
      .setLabel("Yes, Reset All")
      .setEmoji(EmojiManager.get("yes", "✅"))
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("autorole:back")
      .setLabel("Cancel")
      .setEmoji(EmojiManager.get("no", "❌"))
      .setStyle(ButtonStyle.Secondary);

    await interaction.update({
      ...embed.toMessage(),
      components: [new ActionRowBuilder().addComponents(confirmButton, cancelButton)]
    });
    return;
  }

  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  
  settings.autorole = { humans: [], bots: [] };
  await settings.save();

  await interaction.update({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} All autoroles have been reset!`
    ).embeds[0]],
    components: []
  });
}
