const ModernEmbed = require("@helpers/ModernEmbed");
const { getUser } = require("@schemas/User");
const { ECONOMY } = require("@root/config.js");
const { diffHours, getRemainingTime } = require("@helpers/Utils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "daily",
  description: "receive a daily bonus",
  category: "ECONOMY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["dailyreward", "dailybonus"],
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args) {
    const response = await daily(message.author);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = await daily(interaction.user);
    await interaction.followUp(response);
  },
};

async function daily(user) {
  const userDb = await getUser(user);
  let streak = 0;

  if (userDb.daily.timestamp) {
    const lastUpdated = new Date(userDb.daily.timestamp);
    const difference = diffHours(new Date(), lastUpdated);
    if (difference < 24) {
      const nextUsage = lastUpdated.setHours(lastUpdated.getHours() + 24);
      return ModernEmbed.warning(
        "Daily Cooldown",
        `You've already claimed your daily reward! Come back in \`${getRemainingTime(nextUsage)}\` to claim again.`,
        `⏰ Keep your streak alive by coming back daily!`
      );
    }
    streak = userDb.daily.streak || streak;
    if (difference < 48) streak += 1;
    else streak = 0;
  }

  userDb.daily.streak = streak;
  userDb.coins += ECONOMY.DAILY_COINS;
  userDb.daily.timestamp = new Date();
  await userDb.save();

  const embed = new ModernEmbed()
    .setColor(0xFFFFFF)
    .setHeader("💰 Daily Reward Claimed!", `Successfully claimed your daily bonus!`)
    .setThumbnail(user.displayAvatarURL())
    .addField("💵 Received", `\`${ECONOMY.DAILY_COINS}${ECONOMY.CURRENCY}\``, true)
    .addField("🔥 Streak", `\`${streak} day${streak !== 1 ? 's' : ''}\``, true)
    .addField("💳 New Balance", `\`${userDb.coins}${ECONOMY.CURRENCY}\``, true)
    .setFooter(`Come back tomorrow for another reward!`)
    .setTimestamp()
    .addButton({
      customId: 'view-balance',
      label: 'View Balance',
      style: 'Primary',
      emoji: '💰'
    })
    .addButton({
      customId: 'view-leaderboard',
      label: 'Leaderboard',
      style: 'Secondary',
      emoji: '🏆'
    });

  return embed.toMessage();
}
