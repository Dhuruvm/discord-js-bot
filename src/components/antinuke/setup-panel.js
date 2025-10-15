const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const ContainerBuilder = require("@helpers/ContainerBuilder");
const { getSettings } = require("@schemas/Guild");

/**
 * Create the interactive antinuke setup panel
 */
async function createSetupPanel(guild) {
  const settings = await getSettings(guild);
  const antinuke = settings.antinuke || {};

  const components = [];
  
  components.push(ContainerBuilder.createTextDisplay("# 🛡️ Antinuke Control Panel"));
  components.push(ContainerBuilder.createSeparator());
  
  const status = antinuke.enabled ? "<:success:1424072640829722745> **ACTIVE**" : "<:error:1424072711671382076> **INACTIVE**";
  components.push(ContainerBuilder.createTextDisplay(`**Protection Status:** ${status}`));
  
  if (antinuke.log_channel) {
    components.push(ContainerBuilder.createTextDisplay(`**Log Channel:** <#${antinuke.log_channel}>`));
  }
  
  components.push(ContainerBuilder.createTextDisplay(`**Punishment:** ${antinuke.punishment || 'BAN'}`));
  components.push(ContainerBuilder.createTextDisplay(`**Whitelisted:** ${antinuke.whitelist?.length || 0} users`));
  
  components.push(ContainerBuilder.createSeparator());
  components.push(ContainerBuilder.createTextDisplay("## Quick Setup"));
  components.push(ContainerBuilder.createTextDisplay("Use the controls below to configure your server's security."));

  // Row 1: Main Controls
  const mainControls = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("antinuke_toggle")
      .setLabel(antinuke.enabled ? "Disable Protection" : "Enable Protection")
      .setStyle(antinuke.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
      .setEmoji(antinuke.enabled ? "🛑" : "<:success:1424072640829722745>"),
    new ButtonBuilder()
      .setCustomId("antinuke_configure")
      .setLabel("Configure Modules")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⚙️"),
    new ButtonBuilder()
      .setCustomId("antinuke_punishment")
      .setLabel("Punishment Settings")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⚔️")
  );

  // Row 2: Module Selection
  const moduleSelect = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("antinuke_module_select")
      .setPlaceholder("🔒 Select protection modules to configure")
      .setMinValues(1)
      .setMaxValues(5)
      .addOptions([
        {
          label: "Anti-Ban Protection",
          description: "Prevent mass bans",
          value: "anti_ban",
          emoji: "🚫"
        },
        {
          label: "Anti-Kick Protection",
          description: "Prevent mass kicks",
          value: "anti_kick",
          emoji: "👢"
        },
        {
          label: "Anti-Role Protection",
          description: "Prevent role creation/deletion",
          value: "anti_role",
          emoji: "🎭"
        },
        {
          label: "Anti-Channel Protection",
          description: "Prevent channel creation/deletion",
          value: "anti_channel",
          emoji: "📁"
        },
        {
          label: "Anti-Webhook Protection",
          description: "Prevent webhook spam",
          value: "anti_webhook",
          emoji: "🪝"
        },
      ])
  );

  // Row 3: Whitelist & Settings
  const settingsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("antinuke_whitelist_add")
      .setLabel("Add to Whitelist")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("➕"),
    new ButtonBuilder()
      .setCustomId("antinuke_whitelist_view")
      .setLabel("View Whitelist")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📋"),
    new ButtonBuilder()
      .setCustomId("antinuke_log_channel")
      .setLabel("Set Log Channel")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📝")
  );

  // Row 4: Quick Actions
  const quickActions = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("antinuke_preset_high")
      .setLabel("High Security")
      .setStyle(ButtonStyle.Success)
      .setEmoji("🔒"),
    new ButtonBuilder()
      .setCustomId("antinuke_preset_medium")
      .setLabel("Medium Security")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🔓"),
    new ButtonBuilder()
      .setCustomId("antinuke_refresh")
      .setLabel("Refresh Panel")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🔄")
  );

  return {
    flags: 1 << 15,
    components: [
      {
        type: 17,
        accent_color: antinuke.enabled ? 0x00FF00 : 0xFFA500,
        components: components
      }
    ],
    components_v2: [mainControls, moduleSelect, settingsRow, quickActions]
  };
}

module.exports = { createSetupPanel };
