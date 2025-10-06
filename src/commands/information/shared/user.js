const { EmbedBuilder, MessageFlags, ComponentType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @param {import('discord.js').GuildMember} member
 */
module.exports = (member) => {
  let color = member.displayHexColor;
  if (color === "#000000") color = EMBED_COLORS.BOT_EMBED;
  const accentColor = parseInt(color.replace('#', '0x'));

  let rolesString = member.roles.cache
    .filter(r => r.name !== "@everyone")
    .map((r) => `\`${r.name}\``)
    .join(", ");
  if (rolesString.length > 1000) rolesString = rolesString.substring(0, 997) + "...";
  if (!rolesString) rolesString = "No roles";

  const container = {
    type: ComponentType.Container,
    accent_color: accentColor,
    components: [
      // Header Section
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `# 👤 User Information\n\n${member.displayName}'s profile and server details.`
          }
        ],
        accessory: {
          type: ComponentType.Thumbnail,
          media: { url: member.user.displayAvatarURL() },
          description: `${member.displayName} Avatar`
        }
      },

      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },

      // Basic Info Section
      {
        type: ComponentType.TextDisplay,
        content: `### 📋 Basic Information\n\n**Username:** ${member.user.username}\n**User ID:** \`${member.id}\`\n**Display Name:** ${member.displayName}`
      },

      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },

      // Timestamps Section
      {
        type: ComponentType.TextDisplay,
        content: `### 📅 Important Dates\n\n**Joined Server:** <t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>\n**Account Created:** <t:${Math.floor(member.user.createdAt.getTime() / 1000)}:F>`
      },

      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },

      // Roles Section
      {
        type: ComponentType.TextDisplay,
        content: `### 🎭 Roles [${member.roles.cache.size - 1}]\n\n${rolesString}`
      },

      // Separator
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: 2
      },

      // Avatar Link
      {
        type: ComponentType.TextDisplay,
        content: `### 🖼️ Avatar\n\n[Download Avatar](${member.user.displayAvatarURL({ extension: "png", size: 1024 })})`
      },

      // Separator
      {
        type: ComponentType.Separator,
        divider: false,
        spacing: 1
      },

      // Footer
      {
        type: ComponentType.TextDisplay,
        content: `*Requested by ${member.user.tag}* • <t:${Math.floor(Date.now() / 1000)}:R>`
      }
    ]
  };

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
};