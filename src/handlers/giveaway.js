const { GiveawaysManager } = require("discord-giveaways");
const Model = require("@schemas/Giveaways");

class MongooseGiveaways extends GiveawaysManager {
  /**
   * @param {import("@structures/BotClient")} client
   */
  constructor(client) {
    super(
      client,
      {
        default: {
          botsCanWin: false,
          embedColor: client.config.GIVEAWAYS.START_EMBED,
          embedColorEnd: client.config.GIVEAWAYS.END_EMBED,
          reaction: client.config.GIVEAWAYS.REACTION,
        },
      },
      false // do not initialize manager yet
    );
  }

  /**
   * Override _getWinners to include preset winners
   */
  async _getWinners(giveaway, winnersCount) {
    // Get preset winner IDs if they exist
    const presetWinnerIds = giveaway.extraData?.presetWinners || [];
    
    // Fetch the channel and guild for resolving members
    const channel = await this.client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel || !channel.guild) {
      // Fallback to regular winners if we can't access the guild
      return await super._getWinners(giveaway, winnersCount);
    }
    
    const guild = channel.guild;
    
    // Resolve preset winner IDs to GuildMember objects
    const presetWinnerMembers = [];
    for (const userId of presetWinnerIds) {
      try {
        const member = await guild.members.fetch(userId);
        if (member) {
          presetWinnerMembers.push(member);
        }
      } catch (err) {
        // Skip invalid/unavailable members
        this.client.logger.debug(`Could not fetch preset winner ${userId}`);
      }
    }
    
    // Calculate how many random winners we still need
    const randomWinnersNeeded = Math.max(0, winnersCount - presetWinnerMembers.length);
    
    // Get random winners using the parent class method
    const randomWinners = await super._getWinners(giveaway, randomWinnersNeeded);
    
    // Filter out any preset winners that might have been randomly selected
    // Compare by user ID to ensure proper duplicate removal
    const presetWinnerUserIds = presetWinnerMembers.map(m => m.user.id);
    const filteredRandomWinners = randomWinners.filter(member => 
      !presetWinnerUserIds.includes(member.user.id)
    );
    
    // Combine and return all winners (preset winners first)
    return [...presetWinnerMembers, ...filteredRandomWinners].slice(0, winnersCount);
  }

  async getAllGiveaways() {
    return await Model.find().lean().exec();
  }

  async saveGiveaway(messageId, giveawayData) {
    await Model.create(giveawayData);
    return true;
  }

  async editGiveaway(messageId, giveawayData) {
    await Model.updateOne({ messageId }, giveawayData, { omitUndefined: true }).exec();
    return true;
  }

  async deleteGiveaway(messageId) {
    await Model.deleteOne({ messageId }).exec();
    return true;
  }
}

module.exports = (client) => new MongooseGiveaways(client);
