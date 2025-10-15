# Discord.js v14 Bot

## Overview
This project is a comprehensive, multipurpose Discord bot built with Discord.js v14. It features a modular command system supporting both prefix and slash commands, offering extensive functionality across administration, moderation, economy, music, giveaways, invites, statistics, tickets, auto-moderation, anime reactions, image manipulation, and general utilities. The bot is designed as a production-ready solution with optional web dashboard support, extensive configuration, and robust error handling.

## Recent Changes (October 2025)
### Giveaway System Redesign (October 15, 2025)
- **Recoded to Standalone Commands**: Replaced modal-based subcommand system with direct command syntax like typical Discord bots
- **New Commands**:
  - `!gstart <duration> <winners> <prize> [#channel]` - Start a giveaway with direct arguments
  - `!gend <message_id>` - End an active giveaway
  - `!greroll <message_id>` - Reroll ended giveaway to pick new winners
  - `!gpause <message_id>` - Pause an active giveaway
  - `!gresume <message_id>` - Resume a paused giveaway
  - `!glist` - List all active giveaways with details
  - `!gedit <message_id> <add_time/new_prize/new_winners> <value>` - Edit giveaway settings
- **Features**:
  - Both prefix and slash command support
  - Clear error messages and validation
  - Proper permission checks (ManageMessages required)
  - No modals - all arguments provided directly in command
  - Compatible with existing discord-giveaways manager
  - Min-value validation for winner counts
- **Old System**: Previous modal-based `!giveaway start` command disabled

### Pinterest Profile Picture & Banner Command (October 14, 2025)
- **!pfp command**: Search Pinterest for high-quality profile pictures and banners with full interactive UI
- **Pinterest API Integration**: 
  - Secure API key management via environment variables
  - 10-minute caching system for search results
  - Rate limiting (1 second between requests)
  - Safe search filtering and fallback handling
- **Interactive Features**:
  - Carousel navigation with Prev/Next buttons (up to 25 results)
  - Gender filter toggle (Male/Female/Neutral)
  - Type toggle (Profile Picture/Banner)
  - Format toggle (Image/GIF)
  - Custom query modal for refined searches
  - Save/Download with automatic image processing
  - View on Pinterest link button
- **Image Processing**:
  - Automatic aspect ratio adjustment (1:1 for PFP, 16:9 for banners)
  - Smart cropping and resizing using Canvas
  - High-quality output (512px for PFP, 960px for banners)
- **User Experience**: 
  - 5-minute interaction timeout with proper cleanup
  - User authorization checks (only command issuer can interact)
  - Both slash command and prefix command support
  - Pinterest red accent color (0xE60023) for branding

### Music Player Enhancement (October 11, 2025)
- **Fixed music player button handling**: Routed all music control buttons to dedicated handler for proper UI updates
- **Improved interaction routing**: Music buttons now use `player-controls.js` instead of simple inline handlers
- **Professional UI**: Components V2 system with orange accent bar, album artwork, queue pagination, and responsive controls
- **Enhanced playback controls**:
  - Row 1: Back (⬅), Previous (◄◄), Pause/Play (⏸/▶), Next (►►)
  - Row 2: Stop (🛑 red button)
  - Row 3: Shuffle (🔀), Volume Up (🔼), Volume Down (🔽), Boost (🔼)
  - Row 4: Loop/Repeat (🔁)
- **Real-time UI updates**: Player display refreshes when buttons are pressed
- **Track info display**: Shows track number with visual bars (|||), artist, duration, and requester
- **Queue management**: Pagination for long queues with page navigation buttons

### New Fun Commands (October 11, 2025)
- **fuck command**: Send a "fuck you" message with random variations, user mentions, reasons, and embed display
- **fuckoff command**: Tell someone to fuck off with 4 intensity levels:
  - Low: Polite fuck off
  - Medium: Regular fuck off
  - High: Aggressive fuck off
  - Nuclear: Obliterate them completely
  - Interactive buttons to count agreement ("They deserved it")
  - Animated GIFs for each intensity level

### Server Customization Documentation (October 11, 2025)
- **Created SERVER_CUSTOMIZATION_INFO.md**: Comprehensive guide explaining Discord API limitations
- **Per-server nickname**: `sname` command works perfectly per-server
- **Global avatar/banner**: `spfp` and `sbanner` change globally (Discord API limitation)
- **Workarounds documented**: Webhooks, server branding, and alternative solutions explained

### Owner Commands Enhancement
- **listservers**: Complete redesign with dropdown menus, pagination, detailed server info, and leave confirmation
- **Server Notifications**: Enhanced guild join/leave notifications with invite links, server statistics, and interactive controls
- **PFP Commands**: Fixed spfp, sbanner, sname commands to correctly handle global vs per-server settings
- **sreset Command**: New command to reset server-specific bot settings (nickname)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Framework
- **Discord.js v14**: Primary Discord API wrapper.
- **Node.js**: Runtime environment (minimum v18.0.0).
- **Module Alias System**: Path aliasing for cleaner imports (e.g., `@helpers`, `@schemas`).

### Command Architecture
- **Dual Command System**: Supports both prefix and slash commands/context menus.
- **Command Structure**: Centralized definitions in `src/commands/` organized by category.
- **Command Validation**: Built-in system for permissions, cooldowns, and arguments.
- **Context Menus**: User and message context menu support.

### Database Layer
- **MongoDB with Mongoose**: Primary data persistence.
- **Schema Design**: Separate schemas for guild settings, user data, moderation logs, giveaways, reaction roles, etc.

### Feature Modules
- **Bot Information**: Dedicated BOT category with ping, bot stats, uptime, invite links, and premium feature showcase.
- **Music System**: Lavalink-based player with modern Components V2 UI, queue management, Spotify integration, interactive controls (play/pause, skip, shuffle, loop, volume), and album artwork display.
- **Economy System**: Coin-based virtual economy with banking, daily rewards, and gambling.
- **Moderation & Auto-Moderation**: Comprehensive mod actions (warn, kick, ban) and auto-moderation for spam, links, etc.
- **Invite Tracking**: Real-time invite tracking with role rewards and fake invite detection.
- **Statistics & Leveling**: XP-based leveling, message/voice activity tracking, and leaderboards.
- **Giveaways**: Mongoose-backed giveaway manager with custom embeds.
- **Tickets**: Multi-category ticket system with dynamic channel creation and transcript generation.
- **Translation**: Flag reaction-based translation using Google Translate API.
- **Counter Channels**: Auto-updating voice channels for member/bot/user counts.
- **Greeting System**: Welcome and farewell messages with variable parsing and image support.

### Web Dashboard (Optional)
- **Express.js**: Web server framework.
- **EJS Templates**: Server-side rendering.
- **Session Management**: `express-session` with MongoDB store.
- **OAuth2 Authentication**: Discord OAuth for user authentication.
- **Guild Management Interface**: Web-based configuration for bot settings.

### Handlers & Middleware
- **Event/Command/Context Handlers**: Centralized loading and execution for events, prefix commands, and interactions.
- **Presence Handler**: Dynamic bot status updates.
- **Counter Handler**: Batch update system for counter channels.
- **Reaction Role Handler**: Automatic role assignment.
- **Stats Handler**: XP tracking with anti-spam.
- **Greeting Handler**: Welcome/farewell message processing.

### Caching Strategy
- **Configurable Cache Sizes**: Separate limits for guilds, users, and members.
- **Invite Caching**: Per-guild invite caching.
- **Cooldown Caching**: In-memory Maps for command/translation cooldowns.
- **Antispam Caching**: Temporary cache for spam detection.

### Error Handling & Logging
- **Pino Logger**: Structured logging.
- **Webhook Logging**: Optional error reporting to Discord webhook.
- **Unhandled Rejection Catching**: Global error handlers.

### Extension System
- **Discord.js Extenders**: Custom methods added to Discord.js prototypes (Message, Guild, GuildChannel).

### Configuration Management
- **Environment Variables**: Sensitive data via `.env`.
- **Config File**: Central configuration for features, embed colors, cache sizes.
- **Emoji Configuration**: Centralized emoji management via `emojis.json` with runtime reload capability.

### UI/UX Decisions
- **Components V2 System**: Bot now uses Discord's latest Components V2 with Container, Text Display, and Separator components for modern, clean message layouts.
- **ContainerBuilder Helper**: Custom helper class implementing Components V2 spec - creates containers with accent colors, text displays, separators, and action rows for consistent modern UI.
- **Container Design**: Messages use Type 17 containers with customizable accent colors (left bar), Type 10 text displays for markdown content, Type 14 separators for visual spacing.
- **Message Flags**: All container-based messages use flag `1 << 15` (IS_COMPONENTS_V2) to enable the new component system.
- **Interactive Components**: Action rows with buttons/select menus positioned below containers for clean separation of content and actions.
- **Design Patterns**: Clean containers without ASCII art, markdown headers (##), emoji integration, color-coded accent bars (Blue for info, Green for success, Red for error, Yellow for warning).
- **ModernEmbed Fallback**: Legacy ModernEmbed system maintained for backwards compatibility with existing commands not yet migrated to Components V2.
- **No ASCII Decorations**: All decorative ASCII art removed in favor of native Discord markdown and component layouts.
- **Discord.js Version**: Updated to v14.22.1 for latest Components V2 support.
- **Centralized Emoji System**: All bot emojis managed through `emojis.json` config file with owner commands to add/remove/list/reload emojis at runtime.

## External Dependencies

### Required Services
- **MongoDB**: For persistent data storage.
- **Discord Bot Token**: From Discord Developer Portal.
- **Lavalink Nodes**: For music functionality.

### Optional Services
- **Spotify API**: Client ID and secret for music integration. User dismissed Replit integration; if needed in future, ask for credentials manually.
- **Discord OAuth2**: Bot secret for dashboard authentication.
- **Error Webhook**: Discord webhook URL for error logging.

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