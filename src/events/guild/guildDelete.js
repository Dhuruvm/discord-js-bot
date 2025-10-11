const ContainerBuilder = require("@helpers/ContainerBuilder");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  if (!guild.available) return;
  client.logger.log(`Guild Left: ${guild.name} Members: ${guild.memberCount}`);

  const settings = await getSettings(guild);
  settings.data.leftAt = new Date();
  await settings.save();

  let ownerTag;
  const ownerId = guild.ownerId || settings.data.owner;
  try {
    const owner = await client.users.fetch(ownerId);
    ownerTag = owner.tag;
  } catch (err) {
    ownerTag = "Deleted User";
  }

  const container = ContainerBuilder.serverInfo({
    title: `👋 Server Left: ${guild.name || "Unknown"}`,
    description: `**Server ID:** ${guild.id}\n**Owner:** ${ownerTag} (<@${ownerId}>)\n**Members:** ${guild.memberCount}`,
    thumbnail: guild.iconURL(),
    fields: [
      {
        name: "📊 Remaining Servers",
        value: `**Active Servers:** ${client.guilds.cache.size}`,
        inline: false,
      }
    ],
    accentColor: parseInt(client.config.EMBED_COLORS.ERROR.replace('#', ''), 16),
    buttons: []
  });

  for (const ownerIdConfig of client.config.OWNER_IDS) {
    try {
      const owner = await client.users.fetch(ownerIdConfig).catch(() => null);
      if (owner) {
        await owner.send(container).catch(() => 
          client.logger.warn(`Failed to send guild leave notification to owner ${ownerIdConfig}`)
        );
      }
    } catch (error) {
      client.logger.error(`Error sending DM to owner ${ownerIdConfig}:`, error);
    }
  }

  if (client.joinLeaveWebhook) {
    client.joinLeaveWebhook.send({
      username: "Leave",
      avatarURL: client.user.displayAvatarURL(),
      ...container,
    }).catch(() => {});
  }
};
