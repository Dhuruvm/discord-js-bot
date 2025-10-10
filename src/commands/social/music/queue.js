const ContainerBuilder = require("@helpers/ContainerBuilder");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "queue",
  description: "displays the current music queue",
  category: "MUSIC",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "[page]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "page",
        description: "page number",
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const page = args.length && Number(args[0]) ? Number(args[0]) : 1;
    const response = getQueue(message, page);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const page = interaction.options.getInteger("page");
    const response = getQueue(interaction, page);
    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 * @param {number} pgNo
 */
function getQueue({ client, guild }, pgNo) {
  const player = client.musicManager.getPlayer(guild.id);
  if (!player) return "🚫 There is no music playing in this guild.";

  const queue = player.queue;

  const multiple = 10;
  const page = pgNo || 1;
  const end = page * multiple;
  const start = end - multiple;
  const tracks = queue.tracks.slice(start, end);
  const maxPages = Math.ceil(queue.tracks.length / multiple);

  let description = "";
  if (queue.current) {
    description = `**Now Playing:** [${queue.current.title}](${queue.current.uri})\n\n`;
  }

  if (!tracks.length) {
    description += `No tracks in ${page > 1 ? `page ${page}` : "the queue"}.`;
  } else {
    description += tracks.map((track, i) => `${start + ++i}. [${track.title}](${track.uri})`).join("\n");
  }

  description += `\n\n*Page ${page > maxPages ? maxPages : page} of ${maxPages}*`;

  return ContainerBuilder.quickMessage(
    `📜 Queue for ${guild.name}`,
    description,
    [],
    0xFFFFFF
  );
}
