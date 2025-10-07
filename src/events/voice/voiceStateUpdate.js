const { trackVoiceStats } = require("@handlers/stats");
const { joinVoiceChannel } = require("@discordjs/voice");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
module.exports = async (client, oldState, newState) => {
  // Track voice stats
  trackVoiceStats(oldState, newState);

  // Check if bot is jailed and enforce jail
  const jailedBots = require("@root/src/commands/owner/jail").jailedBots;
  const botMember = oldState.guild.members.cache.get(client.user.id);
  
  if (jailedBots.has(oldState.guild.id)) {
    const jailInfo = jailedBots.get(oldState.guild.id);
    
    // If the bot left the jailed channel or was moved
    if (oldState.member?.id === client.user.id && oldState.channelId === jailInfo.channelId && !newState.channelId) {
      // Rejoin the jailed channel
      try {
        const connection = joinVoiceChannel({
          channelId: jailInfo.channelId,
          guildId: oldState.guild.id,
          adapterCreator: oldState.guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false,
        });
        jailInfo.connection = connection;
        console.log(`Bot rejoined jailed channel: ${jailInfo.channelName}`);
      } catch (error) {
        console.error("Failed to rejoin jailed channel:", error);
      }
    }
    
    // If bot was moved to another channel while jailed
    if (oldState.member?.id === client.user.id && newState.channelId && newState.channelId !== jailInfo.channelId) {
      // Move back to jailed channel
      try {
        const connection = joinVoiceChannel({
          channelId: jailInfo.channelId,
          guildId: oldState.guild.id,
          adapterCreator: oldState.guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false,
        });
        jailInfo.connection = connection;
        console.log(`Bot moved back to jailed channel: ${jailInfo.channelName}`);
      } catch (error) {
        console.error("Failed to move back to jailed channel:", error);
      }
    }
  }

  // Erela.js - only disconnect if NOT jailed
  if (client.config.MUSIC.ENABLED && !jailedBots.has(oldState.guild.id)) {
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