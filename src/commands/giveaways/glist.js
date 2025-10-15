const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "glist",
  description: "List all active giveaways in the server",
  category: "GIVEAWAY",
  botPermissions: ["SendMessages", "EmbedLinks"],
  userPermissions: ["ManageMessages"],
  command: {
    enabled: true,
    usage: "",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
  },

  async messageRun(message, args) {
    const giveaways = message.client.giveawaysManager.giveaways.filter(
      (g) => g.guildId === message.guild.id && !g.ended
    );

    if (giveaways.length === 0) {
      return message.safeReply("❌ There are no active giveaways in this server!");
    }

    const embed = new EmbedBuilder()
      .setTitle("🎉 Active Giveaways")
      .setColor(EMBED_COLORS.BOT_EMBED || "#FFFFFF")
      .setDescription(
        giveaways
          .map((g, i) => {
            const timeLeft = g.remainingTime;
            const endsAt = `<t:${Math.floor(g.endAt / 1000)}:R>`;
            return `**${i + 1}.** ${g.prize}\n├ Channel: <#${g.channelId}>\n├ Winners: ${g.winnerCount}\n├ Ends: ${endsAt}\n└ Message ID: \`${g.messageId}\``;
          })
          .join("\n\n")
      )
      .setFooter({ text: `Total Active Giveaways: ${giveaways.length}` })
      .setTimestamp();

    return message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const giveaways = interaction.client.giveawaysManager.giveaways.filter(
      (g) => g.guildId === interaction.guild.id && !g.ended
    );

    if (giveaways.length === 0) {
      return interaction.followUp("❌ There are no active giveaways in this server!");
    }

    const embed = new EmbedBuilder()
      .setTitle("🎉 Active Giveaways")
      .setColor(EMBED_COLORS.BOT_EMBED || "#FFFFFF")
      .setDescription(
        giveaways
          .map((g, i) => {
            const endsAt = `<t:${Math.floor(g.endAt / 1000)}:R>`;
            return `**${i + 1}.** ${g.prize}\n├ Channel: <#${g.channelId}>\n├ Winners: ${g.winnerCount}\n├ Ends: ${endsAt}\n└ Message ID: \`${g.messageId}\``;
          })
          .join("\n\n")
      )
      .setFooter({ text: `Total Active Giveaways: ${giveaways.length}` })
      .setTimestamp();

    return interaction.followUp({ embeds: [embed] });
  },
};
