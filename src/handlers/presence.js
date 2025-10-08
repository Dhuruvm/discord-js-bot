const { ActivityType } = require("discord.js");

let messageIndex = 0;

/**
 * @param {import('@src/structures').BotClient} client
 */
module.exports = (client) => {
  client.user.setPresence({
    activities: [
      {
        name: "unstoppable",
        type: ActivityType.Listening,
      },
    ],
    status: "online",
  });
}
function updatePresence(client) {
  let messages = client.config.PRESENCE.MESSAGE;
  let message = Array.isArray(messages) ? messages[messageIndex] : messages;

  if (message.includes("{servers}")) {
    message = message.replaceAll("{servers}", client.guilds.cache.size);
  }

  if (message.includes("{members}")) {
    const members = client.guilds.cache.map((g) => g.memberCount).reduce((partial_sum, a) => partial_sum + a, 0);
    message = message.replaceAll("{members}", members);
  }

  const getType = (type) => {
    switch (type) {
      case "COMPETING":
        return ActivityType.Competing;

      case "LISTENING":
        return ActivityType.Listening;

      case "PLAYING":
        return ActivityType.Playing;

      case "WATCHING":
        return ActivityType.Watching;

      case "STREAMING":
        return ActivityType.Streaming;

      case "CUSTOM":
        return ActivityType.Custom;
    }
  };

  if (client.config.PRESENCE.TYPE === "CUSTOM") {
    client.user.setPresence({
      status: client.config.PRESENCE.STATUS,
      activities: [
        {
          name: message,
          state: message,
          type: getType(client.config.PRESENCE.TYPE),
        },
      ],
    });
  } else if (client.config.PRESENCE.TYPE === "STREAMING") {
    client.user.setPresence({
      status: client.config.PRESENCE.STATUS,
      activities: [
        {
          name: message,
          type: getType(client.config.PRESENCE.TYPE),
          url: client.config.PRESENCE.URL || "https://twitch.tv/discord",
        },
      ],
    });
  } else {
    client.user.setPresence({
      status: client.config.PRESENCE.STATUS,
      activities: [
        {
          name: message,
          type: getType(client.config.PRESENCE.TYPE),
        },
      ],
    });
  }

  if (Array.isArray(messages)) {
    messageIndex = (messageIndex + 1) % messages.length;
  }
}

module.exports = function handlePresence(client) {
  updatePresence(client);
  setInterval(() => updatePresence(client), 10 * 60 * 1000);
};
