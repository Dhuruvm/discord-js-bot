const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");

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

    const embed = getAliasesEmbed(cmd, data.prefix);
    return message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const cmdName = interaction.options.getString("command").toLowerCase();
    const cmd = interaction.client.slashCommands.get(cmdName) || interaction.client.getCommand(cmdName);

    if (!cmd) {
      return interaction.followUp("No command found with that name.");
    }

    const embed = getAliasesEmbed(cmd, "/");
    return interaction.followUp({ embeds: [embed] });
  },
};

function getAliasesEmbed(cmd, prefix) {
  const aliases = cmd.command?.aliases || [];
  
  const embed = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setTitle(`${cmd.name} Command Aliases`)
    .setDescription(
      `**Command:** \`${prefix}${cmd.name}\`\n\n` +
      `**Aliases:** ${aliases.length > 0 ? aliases.map(a => `\`${prefix}${a}\``).join(', ') : 'No aliases available'}\n\n` +
      `**Description:** ${cmd.description || 'No description available'}\n\n` +
      `**Category:** ${cmd.category || 'NONE'}`
    )
    .setTimestamp()
    .setFooter({ text: "Use the command name or any of its aliases" });

  return embed;
}
