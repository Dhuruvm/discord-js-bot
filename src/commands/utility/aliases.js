const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { PREFIX_COMMANDS } = require("@root/config");

module.exports = {
  name: "aliases",
  description: "View all aliases for a specific command",
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["alias", "aka"],
    usage: "<command>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "command",
        description: "The command name to check aliases for",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args, data) {
    const trigger = args[0].toLowerCase();
    const cmd = message.client.getCommand(trigger);

    if (!cmd) {
      return message.safeReply("No command found with that name.");
    }

    const embed = getAliasesEmbed(cmd, data.prefix, false);
    return message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction, data) {
    const cmdName = interaction.options.getString("command").toLowerCase();
    const slashCmd = interaction.client.slashCommands.get(cmdName);
    const prefixCmd = interaction.client.getCommand(cmdName);

    if (!slashCmd && !prefixCmd) {
      return interaction.followUp("No command found with that name.");
    }

    const prefix = data?.settings?.prefix || PREFIX_COMMANDS.DEFAULT_PREFIX;
    const embed = getAliasesEmbed(slashCmd || prefixCmd, prefix, !!slashCmd);
    return interaction.followUp({ embeds: [embed] });
  },
};

function getAliasesEmbed(cmd, prefix, isSlashContext) {
  const aliases = cmd.command?.aliases || [];
  
  const embed = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setTitle(`${cmd.name} Command Information`);

  if (isSlashContext) {
    embed.setDescription(
      `**Command:** \`/${cmd.name}\`\n\n` +
      `**Aliases:** Slash commands do not support aliases.\n\n` +
      `**Description:** ${cmd.description || 'No description available'}\n\n` +
      `**Category:** ${cmd.category || 'NONE'}\n\n` +
      `💡 **Tip:** To use command aliases, use the prefix form: \`${prefix}${cmd.name}\``
    )
    .setFooter({ text: "Aliases are only available with prefix commands." });
  } else {
    embed.setDescription(
      `**Prefix Command:** \`${prefix}${cmd.name}\`\n\n` +
      `**Aliases:** ${aliases.length > 0 ? aliases.map(a => `\`${prefix}${a}\``).join(', ') : 'No aliases available'}\n\n` +
      `**Description:** ${cmd.description || 'No description available'}\n\n` +
      `**Category:** ${cmd.category || 'NONE'}`
    )
    .setFooter({ text: "Note: Aliases only work with prefix commands, not slash commands." });
  }

  embed.setTimestamp();
  return embed;
}
