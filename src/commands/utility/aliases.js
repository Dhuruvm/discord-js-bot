const { ApplicationCommandOptionType, ButtonStyle } = require("discord.js");
const { PREFIX_COMMANDS } = require("@root/config");
const ContainerBuilder = require("@helpers/ContainerBuilder");

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
      const errorContainer = new ContainerBuilder()
        .addContainer({
          accentColor: 0xFF0000,
          components: [
            ContainerBuilder.createTextDisplay("## ❌ Command Not Found\n\nNo command found with that name.")
          ]
        })
        .build();
      return message.safeReply(errorContainer);
    }

    const response = getAliasesContainer(cmd, data.prefix, false);
    return message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const cmdName = interaction.options.getString("command").toLowerCase();
    const slashCmd = interaction.client.slashCommands.get(cmdName);
    const prefixCmd = interaction.client.getCommand(cmdName);

    if (!slashCmd && !prefixCmd) {
      const errorContainer = new ContainerBuilder()
        .addContainer({
          accentColor: 0xFF0000,
          components: [
            ContainerBuilder.createTextDisplay("## ❌ Command Not Found\n\nNo command found with that name.")
          ]
        })
        .build();
      return interaction.followUp(errorContainer);
    }

    const prefix = data?.settings?.prefix || PREFIX_COMMANDS.DEFAULT_PREFIX;
    const response = getAliasesContainer(slashCmd || prefixCmd, prefix, !!slashCmd);
    return interaction.followUp(response);
  },
};

function getAliasesContainer(cmd, prefix, isSlashContext) {
  const aliases = cmd.command?.aliases || [];
  
  let content;
  let accentColor;
  
  if (isSlashContext) {
    accentColor = 0x5865F2; // Blue for info
    content = ContainerBuilder.createTextDisplay(
      `## 📋 ${cmd.name} Command Information\n\n` +
      `**Command:** \`/${cmd.name}\`\n\n` +
      `**Aliases:** Slash commands do not support aliases.\n\n` +
      `**Description:** ${cmd.description || 'No description available'}\n\n` +
      `**Category:** ${cmd.category || 'NONE'}\n\n` +
      `💡 **Tip:** To use command aliases, use the prefix form: \`${prefix}${cmd.name}\`\n\n` +
      `*Aliases are only available with prefix commands.*`
    );
  } else {
    accentColor = 0x00FF00; // Green for success
    const aliasText = aliases.length > 0 
      ? aliases.map(a => `\`${prefix}${a}\``).join(', ')
      : 'No aliases available';
    
    content = ContainerBuilder.createTextDisplay(
      `## 📋 ${cmd.name} Command Information\n\n` +
      `**Prefix Command:** \`${prefix}${cmd.name}\`\n\n` +
      `**Aliases:** ${aliasText}\n\n` +
      `**Description:** ${cmd.description || 'No description available'}\n\n` +
      `**Category:** ${cmd.category || 'NONE'}\n\n` +
      `*Note: Aliases only work with prefix commands, not slash commands.*`
    );
  }

  const payload = new ContainerBuilder()
    .addContainer({
      accentColor,
      components: [content]
    })
    .build();

  return payload;
}
