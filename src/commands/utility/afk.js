const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

const afkUsers = new Map();

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "afk",
  description: "Set your AFK status with a custom reason",
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["awayfromkeyboard", "away"],
    usage: "[reason]",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "reason",
        description: "Your AFK reason",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const reason = args.join(" ") || "AFK";
    const userId = message.author.id;
    
    afkUsers.set(userId, {
      reason: reason,
      timestamp: Date.now(),
      username: message.author.username
    });

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setDescription(`**${message.author.username}**, you're now **AFK**!\n\n**Reason:** ${reason}`)
      .setFooter({ text: "You'll be removed from AFK when you send a message" })
      .setTimestamp();

    return message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const reason = interaction.options.getString("reason") || "AFK";
    const userId = interaction.user.id;
    
    afkUsers.set(userId, {
      reason: reason,
      timestamp: Date.now(),
      username: interaction.user.username
    });

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setDescription(`**${interaction.user.username}**, you're now **AFK**!\n\n**Reason:** ${reason}`)
      .setFooter({ text: "You'll be removed from AFK when you send a message" })
      .setTimestamp();

    return interaction.followUp({ embeds: [embed] });
  },
};

module.exports.checkAFK = function(message) {
  const userId = message.author.id;
  
  if (afkUsers.has(userId)) {
    afkUsers.delete(userId);
    
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(`**Welcome back, ${message.author.username}!** Your **AFK** status has been removed.`)
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
  }

  message.mentions.users.forEach(user => {
    if (afkUsers.has(user.id)) {
      const afkData = afkUsers.get(user.id);
      
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.WARNING)
        .setDescription(`**${user.username}** is AFK - <t:${Math.floor(afkData.timestamp / 1000)}:R>`)
        .setTimestamp();
      
      message.channel.send({ embeds: [embed] });
    }
  });
};
