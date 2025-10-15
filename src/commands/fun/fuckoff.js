const { EmbedBuilder, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "fuckoff",
  description: "Tell someone to fuck off with style",
  category: "FUN",
  botPermissions: ["EmbedLinks"],
  cooldown: 5,
  command: {
    enabled: true,
    usage: "<@user> [intensity: low/medium/high/nuclear]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The user to tell to fuck off",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "intensity",
        description: "How hard should they fuck off?",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "Low - Polite fuck off", value: "low" },
          { name: "Medium - Regular fuck off", value: "medium" },
          { name: "High - Aggressive fuck off", value: "high" },
          { name: "Nuclear - Obliterate them", value: "nuclear" },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const target = message.mentions.users.first();
    
    if (!target) {
      return message.safeReply("<:error:1424072711671382076> You need to mention someone to tell them to fuck off!");
    }

    if (target.id === message.author.id) {
      return message.safeReply("🤡 Telling yourself to fuck off? That's a new level of self-hatred!");
    }

    if (target.id === message.client.user.id) {
      return message.safeReply("😤 No, YOU fuck off! 🖕");
    }

    const intensity = args.slice(1).join(" ").toLowerCase() || "medium";
    const response = getFuckOffResponse(message.author, target, intensity);

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("fuckoff_counter")
        .setLabel("👍 They deserved it")
        .setStyle(ButtonStyle.Primary)
    );

    const sentMsg = await message.safeReply({ 
      embeds: [response.embed],
      components: [button]
    });

    let count = 0;
    const collector = message.channel.createMessageComponentCollector({
      time: 30000,
      max: 50,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "fuckoff_counter") {
        count++;
        await interaction.deferUpdate();
        
        const newButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("fuckoff_counter")
            .setLabel(`👍 They deserved it (${count})`)
            .setStyle(ButtonStyle.Primary)
        );

        await sentMsg.edit({ components: [newButton] });
      }
    });

    collector.on("end", () => {
      const disabledButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("fuckoff_counter")
          .setLabel(`👍 They deserved it (${count})`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
      
      sentMsg.edit({ components: [disabledButton] }).catch(() => {});
    });
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const intensity = interaction.options.getString("intensity") || "medium";

    if (target.id === interaction.user.id) {
      return interaction.followUp("🤡 Telling yourself to fuck off? That's a new level of self-hatred!");
    }

    if (target.id === interaction.client.user.id) {
      return interaction.followUp("😤 No, YOU fuck off! 🖕");
    }

    const response = getFuckOffResponse(interaction.user, target, intensity);

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("fuckoff_counter")
        .setLabel("👍 They deserved it")
        .setStyle(ButtonStyle.Primary)
    );

    const sentMsg = await interaction.followUp({ 
      embeds: [response.embed],
      components: [button]
    });

    let count = 0;
    const collector = interaction.channel.createMessageComponentCollector({
      time: 30000,
      max: 50,
    });

    collector.on("collect", async (btnInteraction) => {
      if (btnInteraction.customId === "fuckoff_counter") {
        count++;
        await btnInteraction.deferUpdate();
        
        const newButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("fuckoff_counter")
            .setLabel(`👍 They deserved it (${count})`)
            .setStyle(ButtonStyle.Primary)
        );

        await sentMsg.edit({ components: [newButton] });
      }
    });

    collector.on("end", () => {
      const disabledButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("fuckoff_counter")
          .setLabel(`👍 They deserved it (${count})`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
      
      sentMsg.edit({ components: [disabledButton] }).catch(() => {});
    });
  },
};

function getFuckOffResponse(author, target, intensity) {
  const intensityMap = {
    low: {
      title: "😊 Politely Fuck Off",
      color: 0x90EE90,
      messages: [
        `**${author.username}** kindly asks **${target.username}** to please fuck off 🙏`,
        `**${target.username}**, would you be so kind as to fuck off? - **${author.username}** 💐`,
        `**${author.username}**: "Excuse me **${target.username}**, but could you fuck off? Thank you!" 🌸`,
      ],
      gif: "https://media.giphy.com/media/l2YWqU7ev0l5nfYTC/giphy.gif"
    },
    medium: {
      title: "🖕 Fuck Off",
      color: 0xFFA500,
      messages: [
        `**${author.username}** tells **${target.username}** to fuck off! 🚪`,
        `Hey **${target.username}**, fuck off! Sincerely, **${author.username}** 💢`,
        `**${target.username}**, do everyone a favor and fuck off - **${author.username}** 🔥`,
      ],
      gif: "https://media.giphy.com/media/xT1R9Qy80qNb8oK5Ko/giphy.gif"
    },
    high: {
      title: "💥 FUCK OFF NOW!",
      color: 0xFF4500,
      messages: [
        `**${author.username}** SCREAMS AT **${target.username}** TO FUCK OFF RIGHT NOW! 😤`,
        `**${target.username}**, FUCK OFF IMMEDIATELY! - **${author.username}** 🔥`,
        `GET THE FUCK OUT **${target.username}**! Nobody wants you here! - **${author.username}** ⚡`,
      ],
      gif: "https://media.giphy.com/media/l4FGBwHEiHRQcU4Lu/giphy.gif"
    },
    nuclear: {
      title: "☢️ NUCLEAR FUCK OFF",
      color: 0xFF0000,
      messages: [
        `🚨 **TACTICAL FUCK OFF DEPLOYED** 🚨\n**${author.username}** has OBLITERATED **${target.username}**!\n\n💥 FUCK OFF TO ANOTHER DIMENSION! 💥`,
        `⚠️ **MAXIMUM FUCK OFF ACHIEVED** ⚠️\n**${target.username}** has been sentenced to ETERNAL FUCK OFF by **${author.username}**!\n\n🔥 GET FUCKED! 🔥`,
        `🔴 **DEFCON 1 FUCK OFF** 🔴\n**${author.username}** launches a THERMONUCLEAR FUCK OFF at **${target.username}**!\n\n💀 FUCK OFF AND NEVER RETURN! 💀`,
      ],
      gif: "https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif"
    },
  };

  const data = intensityMap[intensity] || intensityMap.medium;
  const randomMessage = data.messages[Math.floor(Math.random() * data.messages.length)];

  const embed = new EmbedBuilder()
    .setColor(data.color)
    .setTitle(data.title)
    .setDescription(randomMessage)
    .setImage(data.gif)
    .setFooter({ 
      text: `Intensity: ${intensity.toUpperCase()} | Requested by ${author.username}`, 
      iconURL: author.displayAvatarURL({ dynamic: true }) 
    })
    .setTimestamp();

  return { embed };
}
