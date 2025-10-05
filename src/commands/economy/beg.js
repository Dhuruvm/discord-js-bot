const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "beg",
  description: "beg from someone",
  category: "ECONOMY",
  cooldown: 21600,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["begmoney", "plead"],
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args) {
    const response = await beg(message.author);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = await beg(interaction.user);
    await interaction.followUp(response);
  },
};

async function beg(user) {
  let users = [
    "PewDiePie",
    "T-Series",
    "Sans",
    "RLX",
    "Pro Gamer 711",
    "Zenitsu",
    "Jake Paul",
    "Kaneki Ken",
    "KSI",
    "Naruto",
    "Mr. Beast",
    "Ur Mom",
    "A Broke Person",
    "Giyu Tomiaka",
    "Bejing Embacy",
    "A Random Asian Mom",
    "Ur Step Sis",
    "Jin Mori",
    "Sakura (AKA Trash Can)",
    "Hammy The Hamster",
    "Kakashi Sensei",
    "Minato",
    "Tanjiro",
    "ZHC",
    "The IRS",
    "Joe Mama",
  ];

  let amount = Math.floor(Math.random() * `${ECONOMY.MAX_BEG_AMOUNT}` + `${ECONOMY.MIN_BEG_AMOUNT}`);
  const userDb = await getUser(user);
  userDb.coins += amount;
  await userDb.save();

  const randomUser = users[Math.floor(Math.random() * users.length)];
  
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setTitle("🎁 Donation Received!")
    .setDescription(`**${randomUser}** donated you some coins!`)
    .addFields(
      { name: "💰 Amount", value: `\`${amount}${ECONOMY.CURRENCY}\``, inline: true },
      { name: "💳 Balance", value: `\`${userDb.coins}${ECONOMY.CURRENCY}\``, inline: true }
    )
    .setFooter({ text: "Better than nothing!" })
    .setTimestamp();

  return { embeds: [embed] };
}
