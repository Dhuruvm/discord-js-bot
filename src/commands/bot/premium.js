const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ModernEmbed = require("@helpers/ModernEmbed");
const { SUPPORT_SERVER } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "premium",
  description: "View premium features and subscription plans",
  category: "BOT",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["vip", "pro"],
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [],
  },

  async messageRun(message, args) {
    const response = getPremiumMessage();
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = getPremiumMessage();
    await interaction.followUp(response);
  },
};

function getPremiumMessage() {
  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle(`${ModernEmbed.getEmoji("premium")} Premium Features`)
    .setDescription("Unlock powerful features and support the bot development!")
    .addFields(
      {
        name: `${ModernEmbed.getEmoji("check")} Premium Benefits`,
        value: [
          "• **Priority Support** - Get help faster",
          "• **Custom Commands** - Create your own commands",
          "• **Advanced Moderation** - Extended auto-mod features",
          "• **Custom Embeds** - Personalized embed colors",
          "• **No Cooldowns** - Skip command cooldowns",
          "• **Exclusive Modules** - Access to premium-only features",
          "• **Badge Recognition** - Premium badge on profile",
        ].join("\n"),
        inline: false,
      },
      {
        name: `${ModernEmbed.getEmoji("economy")} Pricing`,
        value: [
          "**Monthly:** $4.99/month",
          "**Yearly:** $49.99/year (Save 17%)",
          "**Lifetime:** $99.99 (One-time payment)",
        ].join("\n"),
        inline: false,
      }
    )
    .setFooter({ text: "Premium helps us keep the bot running and improving!" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Get Premium")
      .setEmoji(ModernEmbed.getEmoji("premium"))
      .setURL("https://discord.gg/premium")
      .setStyle(ButtonStyle.Link)
  );

  if (SUPPORT_SERVER) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Contact Support")
        .setEmoji(ModernEmbed.getEmoji("support"))
        .setURL(SUPPORT_SERVER)
        .setStyle(ButtonStyle.Link)
    );
  }

  return { embeds: [embed], components: [row] };
}
