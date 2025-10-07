const { trackVoiceStats } = require("@handlers/stats");
const { jailedBots } = require("@commands/owner/jail");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
module.exports = async (client, oldState, newState) => {
  // Track voice stats
  trackVoiceStats(oldState, newState);

  // Check if the bot itself is jailed and trying to leave/switch channels
  const member = newState.member;
  if (member.id === client.user.id && jailedBots.has(member.guild.id)) {
    const jailInfo = jailedBots.get(member.guild.id);
    
    // If bot left the voice channel or switched to a different channel
    if (!newState.channel || newState.channelId !== jailInfo.channelId) {
      try {
        const jailChannel = member.guild.channels.cache.get(jailInfo.channelId);
        if (jailChannel && jailChannel.isVoiceBased()) {
          // Move bot back to the jail channel
          await member.voice.setChannel(jailChannel, "Bot is jailed in this voice channel");
        } else {
          // Jail channel no longer exists, remove from jail
          jailedBots.delete(member.guild.id);
        }
      } catch (error) {
        console.error("Error enforcing bot voice jail:", error);
        // If we can't move bot back, remove from jail
        jailedBots.delete(member.guild.id);
      }
    }
  }

  // Erela.js
  if (client.config.MUSIC.ENABLED) {
    const guild = oldState.guild;

    // if nobody left the channel in question, return.
    if (oldState.channelId !== guild.members.me.voice.channelId || newState.channel) return;

    // otherwise, check how many people are in the channel now
    if (oldState.channel.members.size === 1) {
      setTimeout(() => {
        // if 1 (you), wait 1 minute
        if (!oldState.channel.members.size - 1) {
          const player = client.musicManager.getPlayer(guild.id);
          if (player) client.musicManager.destroyPlayer(guild.id).then(player.disconnect()); // destroy the player
        }
      }, client.config.MUSIC.IDLE_TIME * 1000);
    }
  }
};