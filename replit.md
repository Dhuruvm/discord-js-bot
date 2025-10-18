# Discord.js v14 Bot

## Overview
This project is a comprehensive, multipurpose Discord bot built with Discord.js v14, offering extensive functionality across administration, moderation, economy, music, giveaways, invites, statistics, tickets, auto-moderation, anime reactions, image manipulation, and general utilities. It features a modular command system supporting both prefix and slash commands. The bot is designed as a production-ready solution with optional web dashboard support, extensive configuration, and robust error handling.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (October 18, 2025)

### UI/UX Modernization - Professional Clean Style
- **Complete Embed Modernization**: Redesigned all bot embeds and containers to match professional Discord UI patterns
- **No Emoji Policy**: Removed all emojis from main embed/container content for clean, professional appearance
- **Help Command Redesign**: Updated to ultra-clean layout with:
  - Bold section headers (Command Information, Need Extra Help?)
  - Italic descriptive text for secondary information
  - Clean bullet points (•) instead of ASCII decorations
  - Hyperlinks embedded in text naturally
  - No emojis in main container
- **Bug Report System**: New `/reportbug` command with modal form
  - Professional 5-field modal for comprehensive bug reporting
  - Sends detailed reports to owner DM (with emojis for owner visibility)
  - Clean confirmation message to users (no emojis)
  - Integrated with InteractionRouter for proper modal handling
- **Command Standardization**: Updated bot commands (ping, invite, uptime) to remove emojis from titles and content
- **Maintained Functionality**: All emoji references moved to emojis.json for easy management while keeping UI clean

## Recent Changes (October 18, 2025 - Earlier)

### Emoji System & UI Improvements
- **Centralized Emoji System**: Fixed `EmojiManager.js` to correctly load emojis from root `emojis.json` file instead of non-existent `src/data/emojis.json`
- **Added Helper Methods**: Added convenient getter methods to EmojiManager: `getSuccess()`, `getError()`, `getWarning()`, `getInfo()`, `getLoading()`
- **Replaced Hardcoded Emojis**: Updated `gwin` command to use emojis from `emojis.json` instead of hardcoded custom emoji IDs
- **Beautiful Sidebar Formatting**: Added clean box-drawing characters (╭─╯│) to create professional sidebars in help menu and command outputs
- **Help Command Prefix Fix**: Replaced all hardcoded "/" slashes with the actual server prefix for consistency across all command displays
- **Enhanced Command Lists**: Improved command display with "—" separator and better formatting in category views
- **Hidden Owner Commands**: Owner category (including `gwin`) is now completely hidden from help menus for all users, including owners. Commands remain accessible when called directly by authorized users only.

### Giveaway System Fixes
- **Fixed gstart Interaction Error**: Corrected "Unknown Message" error by using `btnInteraction.editReply()` instead of trying to edit the original message after `deferUpdate()`
- **Fixed gwin Slash Commands**: Ensured `gwin` uses `interaction.followUp()` correctly after framework's auto-defer for ephemeral slash commands
- **Modal Input Fix**: Previously corrected "Expected a number primitive" error in giveaway setup
- **Improved gwin Output**: Added sidebar formatting to preset winners list for better visual organization

### Music System Fixes & Enhancements
- **Installed Java JDK**: Added Java runtime to enable Lavalink music server, resolving "spawn java ENOENT" errors.
- **Enhanced Music Player UI**: Completely redesigned music player with professional visuals:
  - Added animated progress bars with time display (current/total)
  - Dynamic color-coding: Green when playing, Orange when paused
  - Volume and loop mode indicators with emoji icons
  - Song thumbnails and clickable titles
  - Enhanced button controls with emojis (⏮️ ⏸️ ⏭️ ⏹️ 🔀 🔁 📜)
  - Professional queue display with total duration
- **Music Player Controls**: All interactive buttons (play/pause, next/previous, shuffle, loop, queue) fully functional via `src/components/music/player-controls.js`.
- **Lavalink Status**: Music server now starts successfully and connects without errors.

### Help Command Fix
- **Fixed Component Serialization**: Added type checking for `row.toJSON()` to handle both ActionRowBuilder objects and plain JSON objects, preventing crashes when help menu times out.

### Previous Changes (October 17, 2025)
- **Fixed gamble command error**: Corrected `var2.equals === var3` to `var2 === var3` in the reward calculation function.
- **Improved bank command validation**: Simplified argument parsing in deposit/withdraw subcommands.
- **Added DASHBOARD_DEV_MODE**: New environment variable to run the dashboard without Discord OAuth2 authentication for development/testing purposes.

## System Architecture

### Core Framework
- **Discord.js v14**: Primary Discord API wrapper.
- **Node.js**: Runtime environment (minimum v18.0.0).
- **Module Alias System**: Path aliasing for cleaner imports (e.e., `@helpers`, `@schemas`).

### Command Architecture
- **Dual Command System**: Supports both prefix and slash commands/context menus.
- **Command Structure**: Centralized definitions in `src/commands/` organized by category.
- **Command Validation**: Built-in system for permissions, cooldowns, and arguments.
- **Context Menus**: User and message context menu support.

### Database Layer
- **MongoDB with Mongoose**: Primary data persistence with separate schemas for guild settings, user data, moderation logs, giveaways, reaction roles, etc.

### Feature Modules
- **Comprehensive Functionality**: Includes bot information, a Lavalink-based music system with modern UI, a coin-based economy, moderation and auto-moderation, invite tracking, statistics and leveling, a Mongoose-backed giveaway manager, a multi-category ticket system, flag reaction-based translation, counter channels, and a greeting system.

### Web Dashboard (Optional)
- **Express.js**: Web server framework with EJS templates, `express-session` for session management with MongoDB store, and Discord OAuth2 for authentication, providing a web-based configuration interface.

### Handlers & Middleware
- **Centralized Handlers**: For events, commands, interactions, presence updates, counter channels, reaction roles, stats, and greetings.

### Caching Strategy
- **Configurable Cache Sizes**: Separate limits for guilds, users, members, invites, cooldowns, and antispam.

### Error Handling & Logging
- **Pino Logger**: Structured logging with optional webhook reporting and global unhandled rejection catching.

### Extension System
- **Discord.js Extenders**: Custom methods added to Discord.js prototypes (Message, Guild, GuildChannel).

### Configuration Management
- **Environment Variables**: For sensitive data (`.env`).
- **Config File**: Centralized configuration for features, embed colors, and cache sizes.
- **Emoji Configuration**: Centralized emoji management via `emojis.json` with runtime reload capability.

### UI/UX Decisions
- **Components V2 System**: Utilizes Discord's latest Components V2 for modern, clean message layouts, including Container, Text Display, and Separator components.
- **ContainerBuilder Helper**: Custom helper class for consistent UI element creation, supporting accent colors, text displays, separators, and action rows.
- **Message Flags**: All container-based messages use flag `1 << 15` (IS_COMPONENTS_V2).
- **Interactive Components**: Action rows with buttons/select menus are positioned below containers.
- **Design Patterns**: Clean containers, markdown headers, emoji integration, and color-coded accent bars (Blue for info, Green for success, Red for error, Yellow for warning).
- **ModernEmbed Fallback**: Maintained for commands not yet migrated to Components V2.
- **No ASCII Decorations**: Replaced with native Discord markdown and component layouts.
- **Centralized Emoji System**: All bot emojis managed through `emojis.json` config file with owner commands for runtime management.

## External Dependencies

### Required Services
- **MongoDB**: For persistent data storage.
- **Discord Bot Token**: From Discord Developer Portal.
- **Lavalink Nodes**: For music functionality.

### Optional Services
- **Spotify API**: Client ID and secret for music integration.
- **Discord OAuth2**: Bot secret for dashboard authentication.
- **Error Webhook**: Discord webhook URL for error logging.
- **Weatherstack API**: For weather commands.
- **Strange API**: For image manipulation commands.
- **Pinterest API**: Access token, app ID, and app secret for the `!pfp` command.

### Key NPM Packages
- `discord.js`: Discord API interaction.
- `mongoose`: MongoDB ODM.
- `lavaclient`, `@lavaclient/queue`, `@lavaclient/spotify`: Music player and Spotify integration.
- `discord-giveaways`: Giveaway management.
- `express`, `ejs`, `express-session`, `connect-mongo`: Web dashboard.
- `@vitalets/google-translate-api`: Translation service.
- `nekos.life`: Anime reactions API.
- `pino`, `pino-pretty`: Logging.
- `sourcebin_js`: Ticket transcript hosting.
- `discord-together`: Discord Activities integration.