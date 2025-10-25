const ModernEmbed = require("@helpers/ModernEmbed");
const EmojiManager = require("@helpers/EmojiManager");
const { getSettings } = require("@schemas/Guild");
const { ActionRowBuilder, UserSelectMenuBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require("discord.js");

module.exports = async function handleAntinukeInteraction(interaction) {
  if (!interaction.customId?.startsWith("antinuke")) return;

  const parts = interaction.customId.split("_");
  const action = parts[1];
  const subAction = parts[2];

  try {
    if (interaction.isButton()) {
      if (action === "toggle") {
        await handleToggle(interaction);
      } else if (action === "configure") {
        await showModuleConfig(interaction);
      } else if (action === "punishment") {
        await showPunishmentSettings(interaction);
      } else if (action === "whitelist" && subAction === "add") {
        await showWhitelistAdd(interaction);
      } else if (action === "whitelist" && subAction === "view") {
        await showWhitelistView(interaction);
      } else if (action === "log" && subAction === "channel") {
        await showLogChannelSelect(interaction);
      } else if (action === "preset") {
        await applyPreset(interaction, subAction);
      } else if (action === "refresh") {
        await refreshPanel(interaction);
      }
    } else if (interaction.isStringSelectMenu()) {
      if (action === "module" && subAction === "select") {
        await handleModuleSelection(interaction);
      } else if (action === "punishment" && subAction === "select") {
        await handlePunishmentSelect(interaction);
      }
    } else if (interaction.isUserSelectMenu()) {
      if (action === "whitelist" && subAction === "add") {
        await handleWhitelistAdd(interaction);
      }
    } else if (interaction.isChannelSelectMenu()) {
      if (action === "log" && subAction === "select") {
        await handleLogChannelSelect(interaction);
      }
    }
  } catch (error) {
    console.error("[Antinuke Handler] Error:", error);
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

async function handleToggle(interaction) {
  const settings = await getSettings(interaction.guild);
  
  if (!settings.antinuke) settings.antinuke = {};
  settings.antinuke.enabled = !settings.antinuke.enabled;
  
  if (settings.antinuke.enabled && !settings.antinuke.punishment) {
    settings.antinuke.punishment = "BAN";
  }
  
  await settings.save();

  await interaction.update({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} Antinuke protection ${settings.antinuke.enabled ? "enabled" : "disabled"}!`
    ).embeds[0]],
    components: []
  });

  setTimeout(async () => {
    await refreshPanel(interaction).catch(() => {});
  }, 1500);
}

async function showModuleConfig(interaction) {
  const settings = await getSettings(interaction.guild);
  const antinuke = settings.antinuke || {};
  
  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`${EmojiManager.get("settings", "⚙️")} Module Configuration`, 
      "Configure individual protection modules.\nSelect modules from the menu below."
    );

  const moduleSelect = new StringSelectMenuBuilder()
    .setCustomId("antinuke_module_toggle")
    .setPlaceholder(`${EmojiManager.get("shield", "🛡️")} Select modules to toggle`)
    .setMinValues(0)
    .setMaxValues(5)
    .addOptions([
      {
        label: "Anti-Ban",
        value: "anti_ban",
        description: antinuke.anti_ban?.enabled ? "Enabled" : "Disabled",
        emoji: antinuke.anti_ban?.enabled ? EmojiManager.get("on", "🟢") : EmojiManager.get("off", "🔴")
      },
      {
        label: "Anti-Kick",
        value: "anti_kick",
        description: antinuke.anti_kick?.enabled ? "Enabled" : "Disabled",
        emoji: antinuke.anti_kick?.enabled ? EmojiManager.get("on", "🟢") : EmojiManager.get("off", "🔴")
      },
      {
        label: "Anti-Role",
        value: "anti_role",
        description: antinuke.anti_role?.enabled ? "Enabled" : "Disabled",
        emoji: antinuke.anti_role?.enabled ? EmojiManager.get("on", "🟢") : EmojiManager.get("off", "🔴")
      },
      {
        label: "Anti-Channel",
        value: "anti_channel",
        description: antinuke.anti_channel?.enabled ? "Enabled" : "Disabled",
        emoji: antinuke.anti_channel?.enabled ? EmojiManager.get("on", "🟢") : EmojiManager.get("off", "🔴")
      },
      {
        label: "Anti-Webhook",
        value: "anti_webhook",
        description: antinuke.anti_webhook?.enabled ? "Enabled" : "Disabled",
        emoji: antinuke.anti_webhook?.enabled ? EmojiManager.get("on", "🟢") : EmojiManager.get("off", "🔴")
      }
    ]);

  await interaction.update({
    ...embed.toMessage(),
    components: [new ActionRowBuilder().addComponents(moduleSelect)]
  });
}

async function handleModuleSelection(interaction) {
  const settings = await getSettings(interaction.guild);
  if (!settings.antinuke) settings.antinuke = {};
  
  const selectedModules = interaction.values;
  
  for (const module of selectedModules) {
    if (!settings.antinuke[module]) settings.antinuke[module] = { enabled: false };
    settings.antinuke[module].enabled = !settings.antinuke[module].enabled;
  }
  
  await settings.save();

  await interaction.update({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} Toggled ${selectedModules.length} module(s)!`
    ).embeds[0]],
    components: []
  });

  setTimeout(async () => {
    await refreshPanel(interaction).catch(() => {});
  }, 1500);
}

async function showPunishmentSettings(interaction) {
  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`${EmojiManager.get("hammer", "🔨")} Punishment Settings`, 
      "Choose what happens when someone violates antinuke rules."
    );

  const punishmentSelect = new StringSelectMenuBuilder()
    .setCustomId("antinuke_punishment_select")
    .setPlaceholder("Select punishment type")
    .addOptions([
      {
        label: "Ban",
        value: "BAN",
        description: "Permanently ban violators",
        emoji: EmojiManager.get("ban", "🔨")
      },
      {
        label: "Kick",
        value: "KICK",
        description: "Kick violators from server",
        emoji: EmojiManager.get("kick", "👢")
      },
      {
        label: "Strip Roles",
        value: "STRIP_ROLES",
        description: "Remove all roles from violators",
        emoji: EmojiManager.get("settings", "⚙️")
      }
    ]);

  await interaction.update({
    ...embed.toMessage(),
    components: [new ActionRowBuilder().addComponents(punishmentSelect)]
  });
}

async function handlePunishmentSelect(interaction) {
  const settings = await getSettings(interaction.guild);
  if (!settings.antinuke) settings.antinuke = {};
  
  const punishment = interaction.values[0];
  settings.antinuke.punishment = punishment;
  
  await settings.save();

  await interaction.update({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} Punishment set to **${punishment}**!`
    ).embeds[0]],
    components: []
  });

  setTimeout(async () => {
    await refreshPanel(interaction).catch(() => {});
  }, 1500);
}

async function showWhitelistAdd(interaction) {
  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`${EmojiManager.get("users", "👥")} Add to Whitelist`, 
      "Select users to add to the whitelist. Whitelisted users are immune to antinuke actions."
    );

  const userSelect = new UserSelectMenuBuilder()
    .setCustomId("antinuke_whitelist_add_select")
    .setPlaceholder("Select users to whitelist")
    .setMinValues(1)
    .setMaxValues(10);

  await interaction.update({
    ...embed.toMessage(),
    components: [new ActionRowBuilder().addComponents(userSelect)]
  });
}

async function handleWhitelistAdd(interaction) {
  const settings = await getSettings(interaction.guild);
  if (!settings.antinuke) settings.antinuke = {};
  if (!settings.antinuke.whitelist) settings.antinuke.whitelist = [];
  
  const users = interaction.values;
  const newUsers = users.filter(id => !settings.antinuke.whitelist.includes(id));
  
  settings.antinuke.whitelist.push(...newUsers);
  await settings.save();

  await interaction.update({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} Added ${newUsers.length} user(s) to whitelist!`
    ).embeds[0]],
    components: []
  });
}

async function showWhitelistView(interaction) {
  const settings = await getSettings(interaction.guild);
  const whitelist = settings.antinuke?.whitelist || [];
  
  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`${EmojiManager.get("users", "👥")} Whitelisted Users (${whitelist.length})`, 
      whitelist.length > 0 
        ? whitelist.map(id => `<@${id}>`).join(", ")
        : "No users whitelisted yet."
    );

  await interaction.update(embed.toMessage());
}

async function showLogChannelSelect(interaction) {
  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`${EmojiManager.get("settings", "⚙️")} Set Log Channel`, 
      "Select a channel for antinuke logs."
    );

  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId("antinuke_log_select")
    .setPlaceholder("Select log channel")
    .setChannelTypes([ChannelType.GuildText]);

  await interaction.update({
    ...embed.toMessage(),
    components: [new ActionRowBuilder().addComponents(channelSelect)]
  });
}

async function handleLogChannelSelect(interaction) {
  const settings = await getSettings(interaction.guild);
  if (!settings.antinuke) settings.antinuke = {};
  
  const channelId = interaction.values[0];
  settings.antinuke.log_channel = channelId;
  
  await settings.save();

  await interaction.update({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} Log channel set to <#${channelId}>!`
    ).embeds[0]],
    components: []
  });
}

async function applyPreset(interaction, preset) {
  const settings = await getSettings(interaction.guild);
  if (!settings.antinuke) settings.antinuke = {};
  
  settings.antinuke.enabled = true;
  
  if (preset === "high") {
    settings.antinuke.punishment = "BAN";
    settings.antinuke.anti_ban = { enabled: true };
    settings.antinuke.anti_kick = { enabled: true };
    settings.antinuke.anti_role = { enabled: true };
    settings.antinuke.anti_channel = { enabled: true };
    settings.antinuke.anti_webhook = { enabled: true };
  } else if (preset === "medium") {
    settings.antinuke.punishment = "STRIP_ROLES";
    settings.antinuke.anti_ban = { enabled: true };
    settings.antinuke.anti_kick = { enabled: true };
    settings.antinuke.anti_webhook = { enabled: true };
  }
  
  await settings.save();

  await interaction.update({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} Applied **${preset.toUpperCase()}** security preset!`
    ).embeds[0]],
    components: []
  });

  setTimeout(async () => {
    await refreshPanel(interaction).catch(() => {});
  }, 1500);
}

async function refreshPanel(interaction) {
  const { createSetupPanel } = require("./setup-panel");
  const response = await createSetupPanel(interaction.guild);
  
  const method = interaction.deferred || interaction.replied ? "editReply" : "update";
  await interaction[method](response);
}
