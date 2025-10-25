const ModernEmbed = require("@helpers/ModernEmbed");
const EmojiManager = require("@helpers/EmojiManager");
const { ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require("discord.js");

const AUTOMOD_FEATURES = {
  antispam: { name: "Anti-Spam", emoji: "🚫", path: "anti_spam" },
  antilink: { name: "Anti-Link", emoji: "🔗", path: "anti_links" },
  antibadwords: { name: "Anti-Badwords", emoji: "🤬", path: "anti_badwords" },
  antizalgo: { name: "Anti-Zalgo", emoji: "👾", path: "anti_zalgo" },
  anticaps: { name: "Anti-Caps", emoji: "🔠", path: "anti_caps" },
  antiinvite: { name: "Anti-Invite", emoji: "📨", path: "anti_invite" }
};

module.exports = async function handleAutomodInteraction(interaction) {
  if (!interaction.customId?.startsWith("automod")) return;

  const parts = interaction.customId.split(":");
  const action = parts[1];
  const data = parts[2];

  try {
    if (interaction.isButton()) {
      if (action === "toggle") {
        await handleToggle(interaction, data);
      } else if (action === "config") {
        await showConfiguration(interaction, data);
      } else if (action === "back") {
        await showAutomodPanel(interaction);
      }
    } else if (interaction.isStringSelectMenu()) {
      if (action === "select") {
        await handleFeatureSelect(interaction);
      }
    } else if (interaction.isModalSubmit()) {
      if (action === "config") {
        await handleConfigSubmit(interaction, data);
      }
    }
  } catch (error) {
    console.error("[Automod Handler] Error:", error);
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

async function handleToggle(interaction, featureKey) {
  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  
  if (!settings.automod) settings.automod = {};
  
  const feature = AUTOMOD_FEATURES[featureKey];
  const path = feature.path;
  
  let currentStatus = false;
  if (path === "anti_links") {
    currentStatus = settings.automod[path] || false;
    settings.automod[path] = !currentStatus;
  } else {
    if (!settings.automod[path]) settings.automod[path] = { enabled: false };
    currentStatus = settings.automod[path].enabled || false;
    settings.automod[path].enabled = !currentStatus;
  }
  
  await settings.save();
  
  const newStatus = !currentStatus;
  
  await interaction.update({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} ${feature.emoji} **${feature.name}** is now ${newStatus ? "enabled" : "disabled"}!`
    ).embeds[0]],
    components: []
  });

  setTimeout(async () => {
    await showAutomodPanel(interaction).catch(() => {});
  }, 1500);
}

async function showAutomodPanel(interaction) {
  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  const automod = settings.automod || {};
  
  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`${EmojiManager.get("shield", "🛡️")} Automod Control Panel`, 
      "Protect your server with powerful automated moderation.\n\n**Active Features:**"
    );

  let description = "";
  for (const [key, feature] of Object.entries(AUTOMOD_FEATURES)) {
    const path = feature.path;
    let isEnabled = false;
    
    if (path === "anti_links") {
      isEnabled = automod[path] || false;
    } else {
      isEnabled = automod[path]?.enabled || false;
    }
    
    const status = isEnabled ? EmojiManager.get("on", "🟢") : EmojiManager.get("off", "🔴");
    description += `${status} ${feature.emoji} **${feature.name}**\n`;
  }
  
  embed.setDescription(description + "\n" + embed.embed.data.description);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("automod:select")
    .setPlaceholder(`${EmojiManager.get("settings", "⚙️")} Manage Automod Features`)
    .addOptions(
      Object.entries(AUTOMOD_FEATURES).map(([key, feature]) => {
        const path = feature.path;
        let isEnabled = false;
        
        if (path === "anti_links") {
          isEnabled = automod[path] || false;
        } else {
          isEnabled = automod[path]?.enabled || false;
        }
        
        return {
          label: feature.name,
          value: key,
          description: `${isEnabled ? "Enabled" : "Disabled"} - Click to toggle or configure`,
          emoji: feature.emoji
        };
      })
    );

  const method = interaction.deferred || interaction.replied ? "editReply" : "update";
  await interaction[method]({
    ...embed.toMessage(),
    components: [new ActionRowBuilder().addComponents(selectMenu)]
  });
}

async function handleFeatureSelect(interaction) {
  const selected = interaction.values[0];
  const feature = AUTOMOD_FEATURES[selected];
  
  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  const automod = settings.automod || {};
  
  const path = feature.path;
  let isEnabled = false;
  
  if (path === "anti_links") {
    isEnabled = automod[path] || false;
  } else {
    isEnabled = automod[path]?.enabled || false;
  }
  
  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader(`${feature.emoji} ${feature.name}`, 
      `**Status:** ${isEnabled ? `${EmojiManager.get("on", "🟢")} Enabled` : `${EmojiManager.get("off", "🔴")} Disabled`}\n\n` +
      "Use the buttons below to manage this feature."
    );

  const toggleButton = new ButtonBuilder()
    .setCustomId(`automod:toggle:${selected}`)
    .setLabel(isEnabled ? "Disable" : "Enable")
    .setEmoji(isEnabled ? EmojiManager.get("off", "🔴") : EmojiManager.get("on", "🟢"))
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const configButton = new ButtonBuilder()
    .setCustomId(`automod:config:${selected}`)
    .setLabel("Configure")
    .setEmoji(EmojiManager.get("settings", "⚙️"))
    .setStyle(ButtonStyle.Primary)
    .setDisabled(!isEnabled);

  const backButton = new ButtonBuilder()
    .setCustomId("automod:back")
    .setLabel("Back")
    .setEmoji(EmojiManager.get("arrow_left", "◀️"))
    .setStyle(ButtonStyle.Secondary);

  await interaction.update({
    ...embed.toMessage(),
    components: [new ActionRowBuilder().addComponents(toggleButton, configButton, backButton)]
  });
}

async function showConfiguration(interaction, featureKey) {
  const feature = AUTOMOD_FEATURES[featureKey];
  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  const automod = settings.automod || {};
  const config = automod[feature.path] || {};

  const modal = new ModalBuilder()
    .setCustomId(`automod:config:${featureKey}`)
    .setTitle(`${feature.name} Configuration`);

  if (featureKey === "antispam") {
    const limitInput = new TextInputBuilder()
      .setCustomId("limit")
      .setLabel("Max Messages (per 5 seconds)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("5")
      .setValue(String(config.limit || 5))
      .setRequired(true);

    const actionInput = new TextInputBuilder()
      .setCustomId("action")
      .setLabel("Action (TIMEOUT/KICK/BAN)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("TIMEOUT")
      .setValue(config.action || "TIMEOUT")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(limitInput),
      new ActionRowBuilder().addComponents(actionInput)
    );
  } else if (featureKey === "antibadwords") {
    const wordsInput = new TextInputBuilder()
      .setCustomId("words")
      .setLabel("Blocked Words (comma separated)")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("word1, word2, word3")
      .setValue((config.words || []).join(", "))
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(wordsInput));
  } else if (featureKey === "anticaps") {
    const percentInput = new TextInputBuilder()
      .setCustomId("percent")
      .setLabel("Max Caps Percentage (1-100)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("70")
      .setValue(String(config.percent || 70))
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(percentInput));
  }

  await interaction.showModal(modal);
}

async function handleConfigSubmit(interaction, featureKey) {
  const feature = AUTOMOD_FEATURES[featureKey];
  const { getSettings } = require("@schemas/Guild");
  const settings = await getSettings(interaction.guild);
  
  if (!settings.automod) settings.automod = {};
  if (!settings.automod[feature.path]) settings.automod[feature.path] = { enabled: true };
  
  if (featureKey === "antispam") {
    const limit = parseInt(interaction.fields.getTextInputValue("limit")) || 5;
    const action = interaction.fields.getTextInputValue("action").toUpperCase();
    
    settings.automod[feature.path].limit = Math.max(1, Math.min(limit, 20));
    settings.automod[feature.path].action = ["TIMEOUT", "KICK", "BAN"].includes(action) ? action : "TIMEOUT";
  } else if (featureKey === "antibadwords") {
    const words = interaction.fields.getTextInputValue("words")
      .split(",")
      .map(w => w.trim())
      .filter(w => w.length > 0);
    
    settings.automod[feature.path].words = words;
  } else if (featureKey === "anticaps") {
    const percent = parseInt(interaction.fields.getTextInputValue("percent")) || 70;
    settings.automod[feature.path].percent = Math.max(1, Math.min(percent, 100));
  }
  
  await settings.save();

  await interaction.reply({
    embeds: [ModernEmbed.simpleSuccess(
      `${EmojiManager.getSuccess()} ${feature.emoji} **${feature.name}** configuration updated!`
    ).embeds[0]],
    ephemeral: true
  });
}
