const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "fuck",
  description: "Send a fuck you message to someone",
  category: "FUN",
  botPermissions: ["EmbedLinks"],
  cooldown: 5,
  command: {
    enabled: true,
    usage: "<@user> [reason]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The user to fuck",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Why are you fucking them?",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = message.mentions.users.first();
    
    if (!target) {
      return message.safeReply("<:error:1424072711671382076> You need to mention someone to fuck!");
    }

    if (target.id === message.author.id) {
      return message.safeReply("🤡 You can't fuck yourself! Go touch some grass.");
    }

    if (target.id === message.client.user.id) {
      return message.safeReply("😤 How dare you! Go fuck yourself instead!");
    }

    const reason = args.slice(1).join(" ") || "No reason specified";
    
    const fuckMessages = [
      `🖕 **${message.author.username}** just told **${target.username}** to go fuck themselves!`,
      `💢 **${target.username}** got absolutely fucked by **${message.author.username}**!`,
      `🔥 **${message.author.username}** sent **${target.username}** straight to fuck town!`,
      `⚡ **${target.username}** just got a big FUCK YOU from **${message.author.username}**!`,
      `🚫 **${message.author.username}** says: "${target.username}, kindly fuck off!"`,
      `💀 **${target.username}** just got destroyed! Fuck you from **${message.author.username}**!`,
      `🎯 **${message.author.username}** delivered a critical FUCK to **${target.username}**!`,
    ];

    const randomMessage = fuckMessages[Math.floor(Math.random() * fuckMessages.length)];

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setTitle("🖕 FUCK YOU!")
      .setDescription(randomMessage)
      .addFields({ name: "📝 Reason", value: reason, inline: false })
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ 
        text: `Requested by ${message.author.username}`, 
        iconURL: message.author.displayAvatarURL({ dynamic: true }) 
      })
      .setTimestamp();

    return message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason specified";

    if (target.id === interaction.user.id) {
      return interaction.followUp("🤡 You can't fuck yourself! Go touch some grass.");
    }

    if (target.id === interaction.client.user.id) {
      return interaction.followUp("😤 How dare you! Go fuck yourself instead!");
    }

    const fuckMessages = [
      `🖕 **${interaction.user.username}** just told **${target.username}** to go fuck themselves!`,
      `💢 **${target.username}** got absolutely fucked by **${interaction.user.username}**!`,
      `🔥 **${interaction.user.username}** sent **${target.username}** straight to fuck town!`,
      `⚡ **${target.username}** just got a big FUCK YOU from **${interaction.user.username}**!`,
      `🚫 **${interaction.user.username}** says: "${target.username}, kindly fuck off!"`,
      `💀 **${target.username}** just got destroyed! Fuck you from **${interaction.user.username}**!`,
      `🎯 **${interaction.user.username}** delivered a critical FUCK to **${target.username}**!`,
    ];

    const randomMessage = fuckMessages[Math.floor(Math.random() * fuckMessages.length)];

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setTitle("🖕 FUCK YOU!")
      .setDescription(randomMessage)
      .addFields({ name: "📝 Reason", value: reason, inline: false })
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ 
        text: `Requested by ${interaction.user.username}`, 
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTimestamp();

    return interaction.followUp({ embeds: [embed] });
  },
};
