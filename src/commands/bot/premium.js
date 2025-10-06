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
    .setColor(0xFFFFFF)
    .setAuthor({ 
      name: "Premium Features",
      iconURL: "https://cdn.discordapp.com/emojis/1234567890.png"
    })
    .setDescription(
      `### Premium Benefits\n` +
      `> • **Priority Support** - Get help faster\n` +
      `> • **Custom Commands** - Create your own commands\n` +
      `> • **Advanced Moderation** - Extended auto-mod features\n` +
      `> • **Custom Embeds** - Personalized embed colors\n` +
      `> • **No Cooldowns** - Skip command cooldowns\n` +
      `> • **Exclusive Modules** - Access to premium-only features\n` +
      `> • **Badge Recognition** - Premium badge on profile`
    )
    .addFields(
      {
        name: "### Pricing",
        value: 
          `> **Monthly:** $4.99/month\n` +
          `> **Yearly:** $49.99/year (Save 17%)\n` +
          `> **Lifetime:** $99.99 (One-time payment)`,
        inline: false,
      }
    )
    .setFooter({ text: "Powered by Blackbit Studio" });

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
