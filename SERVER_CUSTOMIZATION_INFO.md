# Server-Specific Bot Customization Guide

## ✅ What Works Per-Server

### 🏷️ Server Nickname (`sname` command)
**Works perfectly!** Each server can have a unique bot nickname.

```
!sname Cool Bot        - Changes bot name to "Cool Bot" in this server
!sname Server Guard    - Changes bot name to "Server Guard" in this server
```

## ⚠️ What Doesn't Work Per-Server (Discord API Limitation)

### 🖼️ Profile Picture (`spfp` command)
**Changes globally!** Discord bots can only have ONE profile picture across all servers.
- When you use `!spfp <image>`, it changes the bot's avatar everywhere
- This is a Discord API limitation, not a bot limitation

### 🎨 Banner (`sbanner` command)  
**Changes globally!** Discord bots can only have ONE banner across all servers.
- Requires the bot to have Discord Nitro
- Changes affect all servers when updated

## 🎯 Workarounds & Solutions

### Option 1: Use Webhooks (Advanced)
Create server-specific webhooks with custom avatars and names:
- Webhooks can have unique names and avatars per server
- Requires additional setup and commands
- Messages appear from the webhook instead of the bot

### Option 2: Server Nicknames (Recommended)
Use `!sname` to customize the bot's display name per server:
- ✅ Works perfectly per-server
- ✅ Easy to use
- ✅ No limitations

### Option 3: Server Branding via Bot Messages
Customize how the bot appears through:
- Custom embed colors per server
- Server-specific welcome messages
- Unique command responses per server

## 📝 Current Commands

| Command | What It Does | Per-Server? |
|---------|--------------|-------------|
| `!sname <name>` | Change bot nickname | ✅ YES |
| `!spfp <image>` | Change profile picture | ❌ NO - Global only |
| `!sbanner <image>` | Change banner | ❌ NO - Global only |
| `!sreset` | Reset customizations | Partial |

## 🔧 Technical Details

Discord's Bot API has these limitations:
- One avatar per bot account (globally)
- One banner per bot account (globally)  
- Nicknames ARE per-server (this works!)

This is intentional by Discord to maintain bot identity across servers.

## 💡 Recommendations

**For server owners:**
1. Use `!sname` to customize the bot's display name
2. Keep profile picture and banner consistent across servers
3. Use custom embed branding for server-specific appearance

**For multi-server uniqueness:**
1. Set a universal bot avatar that represents your brand
2. Use server nicknames for customization
3. Implement server-specific command prefixes and responses
