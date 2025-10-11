const ContainerBuilder = require("@helpers/ContainerBuilder");
const { getCommandUsage, getSlashUsage } = require("@handlers/command");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "exp",
  description: "Get a brief and easy explanation of any command",
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<command_name>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "command",
        description: "Name of the command to explain",
        type: 3,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const commandName = args[0].toLowerCase();
    const cmd = message.client.getCommand(commandName);

    if (!cmd) {
      return message.safeReply(
        ContainerBuilder.error(
          "Command Not Found",
          `No command found with the name **${commandName}**`,
          0xFF0000
        )
      );
    }

    const components = [];
    
    components.push(
      ContainerBuilder.createTextDisplay(`## 📖 ${cmd.name} Command Explanation`)
    );
    
    components.push(ContainerBuilder.createSeparator());

    // Description
    components.push(
      ContainerBuilder.createTextDisplay(
        `**What it does:**\n${cmd.description || "No description available"}`
      )
    );

    components.push(ContainerBuilder.createSeparator());

    // Usage
    if (cmd.command && cmd.command.usage) {
      const prefix = message.guild?.settings?.prefix || "!";
      components.push(
        ContainerBuilder.createTextDisplay(
          `**How to use:**\n\`${prefix}${cmd.name} ${cmd.command.usage}\``
        )
      );
    }

    // Category
    components.push(
      ContainerBuilder.createTextDisplay(
        `**Category:** ${cmd.category || "Uncategorized"}`
      )
    );

    // Cooldown
    if (cmd.cooldown) {
      components.push(
        ContainerBuilder.createTextDisplay(
          `**Cooldown:** ${cmd.cooldown} seconds`
        )
      );
    }

    // Permissions
    if (cmd.userPermissions && cmd.userPermissions.length > 0) {
      components.push(
        ContainerBuilder.createTextDisplay(
          `**Required Permissions:** ${cmd.userPermissions.join(", ")}`
        )
      );
    }

    // Aliases
    if (cmd.command?.aliases && cmd.command.aliases.length > 0) {
      components.push(
        ContainerBuilder.createTextDisplay(
          `**Aliases:** ${cmd.command.aliases.map(a => `\`${a}\``).join(", ")}`
        )
      );
    }

    return message.safeReply(
      new ContainerBuilder()
        .addContainer({ 
          accentColor: 0x5865F2,
          components 
        })
        .build()
    );
  },

  async interactionRun(interaction) {
    const commandName = interaction.options.getString("command").toLowerCase();
    const cmd = interaction.client.slashCommands.get(commandName);

    if (!cmd) {
      return interaction.followUp(
        ContainerBuilder.error(
          "Command Not Found",
          `No slash command found with the name **${commandName}**`,
          0xFF0000
        )
      );
    }

    const components = [];
    
    components.push(
      ContainerBuilder.createTextDisplay(`## 📖 /${cmd.name} Command Explanation`)
    );
    
    components.push(ContainerBuilder.createSeparator());

    // Description
    components.push(
      ContainerBuilder.createTextDisplay(
        `**What it does:**\n${cmd.description || "No description available"}`
      )
    );

    components.push(ContainerBuilder.createSeparator());

    // Usage
    if (cmd.slashCommand && cmd.slashCommand.options) {
      const optionsText = cmd.slashCommand.options
        .map(opt => `\`${opt.name}\`${opt.required ? ' (required)' : ' (optional)'}`)
        .join(", ");
      if (optionsText) {
        components.push(
          ContainerBuilder.createTextDisplay(
            `**Options:**\n${optionsText}`
          )
        );
      }
    }

    // Category
    components.push(
      ContainerBuilder.createTextDisplay(
        `**Category:** ${cmd.category || "Uncategorized"}`
      )
    );

    // Cooldown
    if (cmd.cooldown) {
      components.push(
        ContainerBuilder.createTextDisplay(
          `**Cooldown:** ${cmd.cooldown} seconds`
        )
      );
    }

    // Permissions
    if (cmd.userPermissions && cmd.userPermissions.length > 0) {
      components.push(
        ContainerBuilder.createTextDisplay(
          `**Required Permissions:** ${cmd.userPermissions.join(", ")}`
        )
      );
    }

    return interaction.followUp(
      new ContainerBuilder()
        .addContainer({ 
          accentColor: 0x5865F2,
          components 
        })
        .build()
    );
  },
};
