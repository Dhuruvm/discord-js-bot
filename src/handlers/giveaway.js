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
    
    // Patch the roll method for all giveaways to support preset winners
    this._patchGiveawayRoll();
  }
  
  /**
   * Patch the Giveaway.roll() method to include preset winners
   */
  _patchGiveawayRoll() {
    const self = this;
    const originalInit = this._init.bind(this);
    
    this._init = async function() {
      await originalInit();
      
      // Patch all existing giveaways
      for (const giveaway of this.giveaways) {
        self._patchSingleGiveaway(giveaway);
      }
    };
  }
  
  /**
   * Patch a single giveaway instance to support preset winners
   */
  _patchSingleGiveaway(giveaway) {
    const originalRoll = giveaway.roll.bind(giveaway);
    const client = this.client;
    
    giveaway.roll = async function(winnerCount = this.winnerCount) {
      client.logger.debug(`[GWIN DEBUG] roll() called for giveaway ${this.messageId}`);
      client.logger.debug(`[GWIN DEBUG] Winner count requested: ${winnerCount}`);
      client.logger.debug(`[GWIN DEBUG] Giveaway extraData:`, this.extraData);
      
      // Get preset winner IDs if they exist
      const presetWinnerIds = this.extraData?.presetWinners || [];
      client.logger.debug(`[GWIN DEBUG] Found ${presetWinnerIds.length} preset winners:`, presetWinnerIds);
      
      if (presetWinnerIds.length === 0) {
        // No preset winners, use normal roll
        client.logger.debug(`[GWIN DEBUG] No preset winners, using normal roll`);
        return await originalRoll(winnerCount);
      }
      
      // Fetch guild for member resolution
      const guild = this.message?.guild || await client.guilds.fetch(this.guildId).catch(() => null);
      if (!guild) {
        client.logger.debug(`[GWIN DEBUG] Could not fetch guild, using normal roll`);
        return await originalRoll(winnerCount);
      }
      
      // Resolve preset winner IDs to GuildMember objects
      const presetWinnerMembers = [];
      for (const userId of presetWinnerIds) {
        try {
          const member = await guild.members.fetch(userId);
          if (member && !member.user.bot) {
            presetWinnerMembers.push(member);
            client.logger.debug(`[GWIN DEBUG] Resolved preset winner: ${member.user.tag} (${userId})`);
          }
        } catch (err) {
          client.logger.debug(`[GWIN DEBUG] Could not fetch preset winner ${userId}`);
        }
      }
      
      // Limit preset winners to the requested count
      const validPresetWinners = presetWinnerMembers.slice(0, winnerCount);
      client.logger.debug(`[GWIN DEBUG] Valid preset winners: ${validPresetWinners.length}`);
      
      // Calculate how many random winners we still need
      const randomWinnersNeeded = Math.max(0, winnerCount - validPresetWinners.length);
      client.logger.debug(`[GWIN DEBUG] Random winners needed: ${randomWinnersNeeded}`);
      
      // If we don't need any random winners, return preset winners only
      if (randomWinnersNeeded === 0) {
        client.logger.debug(`[GWIN DEBUG] Returning only preset winners`);
        return validPresetWinners;
      }
      
      // Get random winners using the original roll method
      const randomWinners = await originalRoll(randomWinnersNeeded * 2); // Get extra to filter duplicates
      
      // Filter out preset winners from random winners to avoid duplicates
      const presetWinnerUserIds = new Set(validPresetWinners.map(m => m.user.id));
      const filteredRandomWinners = randomWinners.filter(member => 
        member && !presetWinnerUserIds.has(member.user.id)
      );
      
      // Take exactly the number of random winners we need
      const selectedRandomWinners = filteredRandomWinners.slice(0, randomWinnersNeeded);
      
      // Combine preset and random winners
      const allWinners = [...validPresetWinners, ...selectedRandomWinners];
      
      client.logger.debug(`[GWIN DEBUG] Final winners:`, {
        presetWinners: validPresetWinners.length,
        randomWinners: selectedRandomWinners.length,
        total: allWinners.length,
        winnerTags: allWinners.map(m => m.user.tag)
      });
      
      // Return exactly winnerCount winners (preset winners first)
      return allWinners.slice(0, winnerCount);
    };
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
        if (member && !member.user.bot) {
          presetWinnerMembers.push(member);
        }
      } catch (err) {
        // Skip invalid/unavailable members
        this.client.logger.debug(`Could not fetch preset winner ${userId}`);
      }
    }
    
    // Limit preset winners to the requested count
    const validPresetWinners = presetWinnerMembers.slice(0, winnersCount);
    
    // Calculate how many random winners we still need
    const randomWinnersNeeded = Math.max(0, winnersCount - validPresetWinners.length);
    
    // If we don't need any random winners, return preset winners only
    if (randomWinnersNeeded === 0) {
      return validPresetWinners;
    }
    
    // Get more random winners than needed to account for potential duplicates
    const extraWinners = Math.ceil(randomWinnersNeeded * 1.5);
    const randomWinners = await super._getWinners(giveaway, extraWinners);
    
    // Filter out preset winners from random winners to avoid duplicates
    const presetWinnerUserIds = new Set(validPresetWinners.map(m => m.user.id));
    const filteredRandomWinners = randomWinners.filter(member => 
      !presetWinnerUserIds.has(member.user.id)
    );
    
    // Take exactly the number of random winners we need
    const selectedRandomWinners = filteredRandomWinners.slice(0, randomWinnersNeeded);
    
    // Combine preset and random winners
    const allWinners = [...validPresetWinners, ...selectedRandomWinners];
    
    // If we still don't have enough winners, get more random ones
    if (allWinners.length < winnersCount && filteredRandomWinners.length < randomWinnersNeeded) {
      const additionalNeeded = winnersCount - allWinners.length;
      const moreWinners = await super._getWinners(giveaway, additionalNeeded * 2);
      const moreFiltered = moreWinners.filter(member => 
        !presetWinnerUserIds.has(member.user.id) && 
        !allWinners.find(w => w.user.id === member.user.id)
      );
      allWinners.push(...moreFiltered.slice(0, additionalNeeded));
    }
    
    // Return exactly winnersCount winners (preset winners first)
    return allWinners.slice(0, winnersCount);
  }

  /**
   * Override _pickWinners to include preset winners (primary method used by discord-giveaways)
   */
  async _pickWinners(giveaway) {
    // DEBUG: Log the full giveaway object to see what data we have
    this.client.logger.debug(`[GWIN DEBUG] _pickWinners called for giveaway ${giveaway.messageId}`);
    this.client.logger.debug(`[GWIN DEBUG] Giveaway data:`, {
      messageId: giveaway.messageId,
      winnerCount: giveaway.winnerCount,
      hasExtraData: !!giveaway.extraData,
      extraData: giveaway.extraData,
      presetWinners: giveaway.extraData?.presetWinners
    });
    
    // Get preset winner IDs if they exist
    const presetWinnerIds = giveaway.extraData?.presetWinners || [];
    
    this.client.logger.debug(`[GWIN DEBUG] Found ${presetWinnerIds.length} preset winners:`, presetWinnerIds);
    
    // Fetch the channel and guild for resolving members
    const channel = await this.client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel || !channel.guild) {
      // Fallback to regular winners if we can't access the guild
      return await super._pickWinners(giveaway);
    }
    
    const guild = channel.guild;
    const winnersCount = giveaway.winnerCount;
    
    // Resolve preset winner IDs to GuildMember objects
    const presetWinnerMembers = [];
    for (const userId of presetWinnerIds) {
      try {
        const member = await guild.members.fetch(userId);
        if (member && !member.user.bot) {
          presetWinnerMembers.push(member);
        }
      } catch (err) {
        // Skip invalid/unavailable members
        this.client.logger.debug(`Could not fetch preset winner ${userId}`);
      }
    }
    
    // Limit preset winners to the requested count
    const validPresetWinners = presetWinnerMembers.slice(0, winnersCount);
    
    // Calculate how many random winners we still need
    const randomWinnersNeeded = Math.max(0, winnersCount - validPresetWinners.length);
    
    // If we don't need any random winners, return preset winners only
    if (randomWinnersNeeded === 0) {
      return validPresetWinners;
    }
    
    // Get random winners using the parent method
    let randomWinners = await super._pickWinners(giveaway);
    
    // Filter out preset winners from random winners to avoid duplicates
    const presetWinnerUserIds = new Set(validPresetWinners.map(m => m.user.id));
    const filteredRandomWinners = randomWinners.filter(member => 
      !presetWinnerUserIds.has(member.user.id)
    );
    
    // Take exactly the number of random winners we need
    const selectedRandomWinners = filteredRandomWinners.slice(0, randomWinnersNeeded);
    
    // Combine preset and random winners
    const allWinners = [...validPresetWinners, ...selectedRandomWinners];
    
    this.client.logger.debug(`[GWIN DEBUG] Final winner selection:`, {
      presetWinnersSelected: validPresetWinners.length,
      randomWinnersSelected: selectedRandomWinners.length,
      totalWinners: allWinners.length,
      winnerIds: allWinners.map(m => m.user.id)
    });
    
    // Return exactly winnersCount winners (preset winners first)
    return allWinners.slice(0, winnersCount);
  }

  async getAllGiveaways() {
    return await Model.find().lean().exec();
  }

  async saveGiveaway(messageId, giveawayData) {
    await Model.create(giveawayData);
    
    // Patch the newly created giveaway
    const newGiveaway = this.giveaways.find(g => g.messageId === messageId);
    if (newGiveaway) {
      this._patchSingleGiveaway(newGiveaway);
    }
    
    return true;
  }

  async editGiveaway(messageId, giveawayData) {
    this.client.logger.debug(`[GWIN DEBUG] editGiveaway called for ${messageId}`);
    this.client.logger.debug(`[GWIN DEBUG] Data to save:`, JSON.stringify(giveawayData, null, 2));
    
    // Use $set to properly update nested objects like extraData
    const result = await Model.updateOne(
      { messageId }, 
      { $set: giveawayData }
    ).exec();
    
    this.client.logger.debug(`[GWIN DEBUG] Update result:`, result);
    
    // Verify the save by reading back from database
    const savedGiveaway = await Model.findOne({ messageId }).lean().exec();
    this.client.logger.debug(`[GWIN DEBUG] Data in database after save:`, {
      messageId: savedGiveaway?.messageId,
      hasExtraData: !!savedGiveaway?.extraData,
      extraData: savedGiveaway?.extraData
    });
    
    return true;
  }

  async deleteGiveaway(messageId) {
    await Model.deleteOne({ messageId }).exec();
    return true;
  }
}

module.exports = (client) => new MongooseGiveaways(client);
