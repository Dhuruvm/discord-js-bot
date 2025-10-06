const { ApplicationCommandOptionType } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");
const emojis = require("@root/emojis.json");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "autorole",
  description: "setup role to be given when a member joins the server",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    aliases: ["autoassign", "joinrole"],
    usage: "<role|off>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "add",
        description: "setup the autorole",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "the role to be given",
            type: ApplicationCommandOptionType.Role,
            required: false,
          },
          {
            name: "role_id",
            description: "the role id to be given",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "remove",
        description: "disable the autorole",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const input = args.join(" ");
    let response;

    if (input.toLowerCase() === "off") {
      response = await setAutoRole(message, null, data.settings);
    } else {
      const roles = message.guild.findMatchingRoles(input);
      if (roles.length === 0) response = ModernEmbed.simpleError("No matching roles found");
      else response = await setAutoRole(message, roles[0], data.settings);
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    // add
    if (sub === "add") {
      let role = interaction.options.getRole("role");
      if (!role) {
        const role_id = interaction.options.getString("role_id");
        if (!role_id) return interaction.followUp(ModernEmbed.simpleError("Please provide a role or role id"));

        const roles = interaction.guild.findMatchingRoles(role_id);
        if (roles.length === 0) return interaction.followUp(ModernEmbed.simpleError("No matching roles found"));
        role = roles[0];
      }

      response = await setAutoRole(interaction, role, data.settings);
    }

    // remove
    else if (sub === "remove") {
      response = await setAutoRole(interaction, null, data.settings);
    }

    // default
    else response = ModernEmbed.simpleError("Invalid subcommand");

    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").Message | import("discord.js").CommandInteraction} message
 * @param {import("discord.js").Role} role
 * @param {import("@models/Guild")} settings
 */
async function setAutoRole({ guild }, role, settings) {
  if (role) {
    if (role.id === guild.roles.everyone.id) return ModernEmbed.simpleError("You cannot set `@everyone` as the autorole");
    if (!guild.members.me.permissions.has("ManageRoles")) return ModernEmbed.simpleError("I don't have the `ManageRoles` permission");
    if (guild.members.me.roles.highest.position < role.position)
      return ModernEmbed.simpleError("I don't have permission to assign this role. My role must be higher than the target role.");
    if (role.managed) return ModernEmbed.simpleError("This role is managed by an integration and cannot be assigned");
  }

  if (!role) settings.autorole = null;
  else settings.autorole = role.id;

  await settings.save();
  return ModernEmbed.simpleSuccess(`Autorole has been ${!role ? "disabled" : `set to ${role}`}`);
}
