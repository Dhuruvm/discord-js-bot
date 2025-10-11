const { ApplicationCommandOptionType } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const ContainerBuilder = require("@helpers/ContainerBuilder");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "antinuke",
  description: "Configure advanced server protection system",
  category: "ANTINUKE",
  userPermissions: ["Administrator"],
  botPermissions: ["Administrator"],
  command: {
    enabled: true,
    usage: "setup | whitelist | status | disable",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "setup",
        description: "Open the interactive antinuke setup panel",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "whitelist",
        description: "Manage the antinuke whitelist",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "action",
            description: "Add or remove from whitelist",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: "Add User", value: "add" },
              { name: "Remove User", value: "remove" },
              { name: "View List", value: "view" },
            ],
          },
          {
            name: "user",
            description: "User to add/remove from whitelist",
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: "status",
        description: "View current antinuke configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "disable",
        description: "Completely disable antinuke protection",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args) {
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === "setup") {
      const { createSetupPanel } = require("@src/components/antinuke/setup-panel");
      const response = await createSetupPanel(message.guild);
      return message.safeReply(response);
    }

    if (subcommand === "status") {
      const statusDisplay = await getStatusDisplay(message.guild);
      return message.safeReply(statusDisplay);
    }

    if (subcommand === "disable") {
      const settings = await getSettings(message.guild);
      if (!settings.antinuke?.enabled) {
        return message.safeReply(
          ContainerBuilder.info("Antinuke Already Disabled", "Antinuke protection is not currently enabled.", 0xFFA500)
        );
      }

      settings.antinuke.enabled = false;
      await settings.save();

      return message.safeReply(
        ContainerBuilder.success(
          "Antinuke Disabled",
          "🛑 Antinuke protection has been disabled.\n\nUse `!antinuke setup` to re-enable it.",
          0xFF0000
        )
      );
    }

    if (subcommand === "whitelist") {
      return message.safeReply(
        ContainerBuilder.info(
          "Use Slash Command",
          "Please use `/antinuke whitelist` for whitelist management with dropdown menus.",
          0xFFA500
        )
      );
    }

    return message.safeReply(
      ContainerBuilder.error(
        "Invalid Subcommand",
        "Available subcommands: `setup`, `whitelist`, `status`, `disable`",
        0xFF0000
      )
    );
  },

  async interactionRun(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "setup") {
      await interaction.deferReply();
      const { createSetupPanel } = require("@src/components/antinuke/setup-panel");
      const response = await createSetupPanel(interaction.guild);
      return interaction.editReply(response);
    }

    if (subcommand === "whitelist") {
      await interaction.deferReply();
      const action = interaction.options.getString("action");
      const user = interaction.options.getUser("user");

      const settings = await getSettings(interaction.guild);
      if (!settings.antinuke) {
        settings.antinuke = { whitelist: [] };
      }

      if (action === "view") {
        const whitelist = settings.antinuke.whitelist || [];
        if (whitelist.length === 0) {
          return interaction.editReply(
            ContainerBuilder.info("Whitelist Empty", "No users are currently whitelisted.", 0xFFA500)
          );
        }

        const userList = await Promise.all(
          whitelist.map(async (userId) => {
            try {
              const user = await interaction.client.users.fetch(userId);
              return `• ${user.tag} (${userId})`;
            } catch {
              return `• Unknown User (${userId})`;
            }
          })
        );

        return interaction.editReply(
          ContainerBuilder.info(
            "Antinuke Whitelist",
            `**${whitelist.length} Whitelisted User${whitelist.length !== 1 ? 's' : ''}**\n\n${userList.join('\n')}`,
            0x00FF00
          )
        );
      }

      if (!user) {
        return interaction.editReply(
          ContainerBuilder.error("Missing User", "Please specify a user to add/remove.", 0xFF0000)
        );
      }

      if (action === "add") {
        if (!settings.antinuke.whitelist) settings.antinuke.whitelist = [];
        
        if (settings.antinuke.whitelist.includes(user.id)) {
          return interaction.editReply(
            ContainerBuilder.error("Already Whitelisted", `${user.tag} is already on the whitelist.`, 0xFF0000)
          );
        }

        settings.antinuke.whitelist.push(user.id);
        await settings.save();

        return interaction.editReply(
          ContainerBuilder.success(
            "User Whitelisted",
            `✅ Added **${user.tag}** to the antinuke whitelist.\n\nThis user can now perform administrative actions without triggering antinuke.`,
            0x00FF00
          )
        );
      }

      if (action === "remove") {
        if (!settings.antinuke.whitelist?.includes(user.id)) {
          return interaction.editReply(
            ContainerBuilder.error("Not Whitelisted", `${user.tag} is not on the whitelist.`, 0xFF0000)
          );
        }

        settings.antinuke.whitelist = settings.antinuke.whitelist.filter(id => id !== user.id);
        await settings.save();

        return interaction.editReply(
          ContainerBuilder.success(
            "User Removed",
            `✅ Removed **${user.tag}** from the antinuke whitelist.`,
            0x00FF00
          )
        );
      }
    }

    if (subcommand === "status") {
      await interaction.deferReply();
      const statusDisplay = await getStatusDisplay(interaction.guild);
      return interaction.editReply(statusDisplay);
    }

    if (subcommand === "disable") {
      await interaction.deferReply();
      const settings = await getSettings(interaction.guild);
      
      if (!settings.antinuke?.enabled) {
        return interaction.editReply(
          ContainerBuilder.info("Antinuke Already Disabled", "Antinuke protection is not currently enabled.", 0xFFA500)
        );
      }

      settings.antinuke.enabled = false;
      await settings.save();

      return interaction.editReply(
        ContainerBuilder.success(
          "Antinuke Disabled",
          "🛑 Antinuke protection has been disabled.\n\nUse `/antinuke setup` to re-enable it.",
          0xFF0000
        )
      );
    }
  },
};

async function getStatusDisplay(guild) {
  const settings = await getSettings(guild);
  const antinuke = settings.antinuke || {};

  const components = [];
  
  components.push(ContainerBuilder.createTextDisplay("# 🛡️ Antinuke Status"));
  components.push(ContainerBuilder.createSeparator());

  const mainStatus = antinuke.enabled ? "✅ **ENABLED**" : "❌ **DISABLED**";
  components.push(ContainerBuilder.createTextDisplay(`**System Status:** ${mainStatus}`));

  if (antinuke.log_channel) {
    components.push(ContainerBuilder.createTextDisplay(`**Log Channel:** <#${antinuke.log_channel}>`));
  }

  components.push(ContainerBuilder.createTextDisplay(`**Punishment Type:** ${antinuke.punishment || 'BAN'}`));
  components.push(ContainerBuilder.createTextDisplay(`**Whitelisted Users:** ${antinuke.whitelist?.length || 0}`));

  components.push(ContainerBuilder.createSeparator());
  components.push(ContainerBuilder.createTextDisplay("## Protection Modules"));

  const modules = [
    { name: "Anti-Ban", key: "anti_ban" },
    { name: "Anti-Kick", key: "anti_kick" },
    { name: "Anti-Role Create", key: "anti_role_create" },
    { name: "Anti-Role Delete", key: "anti_role_delete" },
    { name: "Anti-Channel Create", key: "anti_channel_create" },
    { name: "Anti-Channel Delete", key: "anti_channel_delete" },
    { name: "Anti-Webhook", key: "anti_webhook" },
    { name: "Anti-Bot Add", key: "anti_bot" },
    { name: "Anti-Server Update", key: "anti_server_update" },
    { name: "Anti-Emoji Delete", key: "anti_emoji_delete" },
    { name: "Anti-Prune", key: "anti_prune" },
  ];

  modules.forEach(module => {
    const enabled = antinuke[module.key]?.enabled;
    const status = enabled ? "✅" : "❌";
    const limit = antinuke[module.key]?.limit;
    const extra = limit ? ` (${limit}/10s)` : "";
    components.push(ContainerBuilder.createTextDisplay(`${status} **${module.name}**${extra}`));
  });

  return {
    flags: 1 << 15,
    components: [
      {
        type: 17,
        accent_color: antinuke.enabled ? 0x00FF00 : 0xFF0000,
        components: components
      }
    ]
  };
}
