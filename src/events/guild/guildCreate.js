const ContainerBuilder = require("@helpers/ContainerBuilder");
const { getSettings: registerGuild } = require("@schemas/Guild");
const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  if (!guild.available) return;
  if (!guild.members.cache.has(guild.ownerId)) await guild.fetchOwner({ cache: true }).catch(() => {});
  client.logger.log(`Guild Joined: ${guild.name} Members: ${guild.memberCount}`);
  await registerGuild(guild);

  await guild.members.fetch().catch(() => {});
  
  const humans = guild.members.cache.filter(m => !m.user.bot).size;
  const bots = guild.members.cache.filter(m => m.user.bot).size;
  const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
  const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
  const categories = guild.channels.cache.filter(c => c.type === 4).size;
  const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
  const joinedTimestamp = Math.floor(Date.now() / 1000);
  
  // Try to create an invite link
  let inviteUrl = "No invite available";
  try {
    const textChannel = guild.channels.cache.find(
      ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has("CreateInstantInvite")
    );
    
    if (textChannel) {
      const invite = await textChannel.createInvite({
        maxAge: 0, // Never expires
        maxUses: 0, // Unlimited uses
        unique: true,
        reason: "Bot owner notification invite"
      });
      inviteUrl = invite.url;
    }
  } catch (error) {
    client.logger.warn(`Could not create invite for ${guild.name}:`, error.message);
  }

  const owner = guild.members.cache.get(guild.ownerId) || { user: { tag: "Unknown", id: guild.ownerId } };
  
  const container = ContainerBuilder.serverInfo({
    title: `🎉 New Server Joined!`,
    description: `**${guild.name}**\n\`${guild.id}\`\n\n**Joined:** <t:${joinedTimestamp}:R>\n**Created:** <t:${createdTimestamp}:F>`,
    thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
    fields: [
      {
        name: "👑 Owner",
        value: `${owner.user.tag}\n<@${guild.ownerId}>\n\`${guild.ownerId}\``,
        inline: true,
      },
      {
        name: "👥 Members",
        value: `**Total:** ${guild.memberCount}\n**Humans:** ${humans}\n**Bots:** ${bots}`,
        inline: true,
      },
      {
        name: "📺 Channels",
        value: `**Total:** ${guild.channels.cache.size}\n**Text:** ${textChannels}\n**Voice:** ${voiceChannels}\n**Categories:** ${categories}`,
        inline: true,
      },
      {
        name: "📊 Server Stats",
        value: `**Roles:** ${guild.roles.cache.size}\n**Emojis:** ${guild.emojis.cache.size}\n**Stickers:** ${guild.stickers.cache.size}`,
        inline: true,
      },
      {
        name: "⚡ Boost Status",
        value: `**Level:** ${guild.premiumTier}/3\n**Boosts:** ${guild.premiumSubscriptionCount || 0}`,
        inline: true,
      },
      {
        name: "🔒 Security",
        value: `**Verification:** ${guild.verificationLevel}\n**NSFW Level:** ${guild.nsfwLevel}\n**MFA:** ${guild.mfaLevel ? 'Required' : 'Not Required'}`,
        inline: true,
      },
      {
        name: "🌍 Server Info",
        value: `**Locale:** ${guild.preferredLocale}\n**Vanity URL:** ${guild.vanityURLCode || 'None'}\n**Features:** ${guild.features.length}`,
        inline: true,
      },
      {
        name: "📊 Total Bot Servers",
        value: `**Active Servers:** ${client.guilds.cache.size}\n**Total Users:** ${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0).toLocaleString()}`,
        inline: true,
      },
      {
        name: "🔗 Invite Link",
        value: inviteUrl === "No invite available" ? inviteUrl : `[Click Here](${inviteUrl})`,
        inline: false,
      }
    ],
    accentColor: 0x00FF00,
    buttons: [
      {
        label: "View Server",
        url: inviteUrl !== "No invite available" ? inviteUrl : `https://discord.com/channels/${guild.id}`,
        style: "Link",
        emoji: "🔗"
      },
      {
        label: "Server ID",
        customId: `copy_${guild.id}`,
        style: "Secondary",
        emoji: "📋",
        disabled: true
      }
    ]
  });

  // Build action buttons for owner control
  const actionButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`leave_${guild.id}`)
      .setLabel("Leave Server")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🚪"),
    new ButtonBuilder()
      .setCustomId(`info_${guild.id}`)
      .setLabel("More Info")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("ℹ️")
  );

  for (const ownerId of client.config.OWNER_IDS) {
    try {
      const owner = await client.users.fetch(ownerId).catch(() => null);
      if (owner) {
        const msg = await owner.send({ 
          ...container, 
          components: [actionButtons] 
        }).catch(() => 
          client.logger.warn(`Failed to send guild join notification to owner ${ownerId}`)
        );

        if (msg) {
          // Add button interaction handler
          const collector = msg.createMessageComponentCollector({
            time: 300000 // 5 minutes
          });

          collector.on('collect', async (interaction) => {
            if (interaction.user.id !== ownerId) return;

            if (interaction.customId === `leave_${guild.id}`) {
              const guildToLeave = client.guilds.cache.get(guild.id);
              if (guildToLeave) {
                const confirmContainer = ContainerBuilder.warning(
                  "⚠️ Confirm Leave Server",
                  `Are you sure you want to leave **${guildToLeave.name}**?\n\nReact with ✅ to confirm or ❌ to cancel.\n\n**This action cannot be undone!**`,
                  0xFFA500
                );
                
                await interaction.update({ ...confirmContainer, components: [] });
                await interaction.message.react('✅');
                await interaction.message.react('❌');

                const reactionCollector = interaction.message.createReactionCollector({
                  filter: (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === ownerId,
                  max: 1,
                  time: 30000
                });

                reactionCollector.on('collect', async (reaction) => {
                  if (reaction.emoji.name === '✅') {
                    await guildToLeave.leave();
                    const successContainer = ContainerBuilder.success(
                      "Left Server",
                      `Successfully left **${guildToLeave.name}**`,
                      0x00FF00
                    );
                    await interaction.message.edit({ ...successContainer, components: [] });
                  } else {
                    await interaction.message.edit({ ...container, components: [actionButtons] });
                  }
                  await interaction.message.reactions.removeAll().catch(() => {});
                });
              }
            } else if (interaction.customId === `info_${guild.id}`) {
              const guildInfo = client.guilds.cache.get(guild.id);
              if (guildInfo) {
                const features = guildInfo.features.length > 0 
                  ? guildInfo.features.slice(0, 10).join(', ') + (guildInfo.features.length > 10 ? '...' : '')
                  : 'None';

                const infoContainer = ContainerBuilder.quickMessage(
                  `ℹ️ Detailed Info: ${guildInfo.name}`,
                  `**Description:** ${guildInfo.description || 'No description'}\n\n**Features:**\n${features}\n\n**System Channel:** ${guildInfo.systemChannel ? `<#${guildInfo.systemChannel.id}>` : 'None'}\n**AFK Channel:** ${guildInfo.afkChannel ? `<#${guildInfo.afkChannel.id}>` : 'None'}\n**AFK Timeout:** ${guildInfo.afkTimeout}s`,
                  [],
                  0x5865F2,
                  [
                    {
                      label: "Back",
                      customId: `back_${guild.id}`,
                      style: "Secondary",
                      emoji: "◀️"
                    }
                  ]
                );
                await interaction.update({ ...infoContainer, components: [] });
              }
            } else if (interaction.customId === `back_${guild.id}`) {
              await interaction.update({ ...container, components: [actionButtons] });
            }
          });

          collector.on('end', async () => {
            try {
              await msg.edit({ components: [] });
            } catch (error) {
              // Message might be deleted
            }
          });
        }
      }
    } catch (error) {
      client.logger.error(`Error sending DM to owner ${ownerId}:`, error);
    }
  }

  if (client.joinLeaveWebhook) {
    client.joinLeaveWebhook.send({
      username: "Join",
      avatarURL: client.user.displayAvatarURL(),
      ...container,
    }).catch(() => {});
  }
};
