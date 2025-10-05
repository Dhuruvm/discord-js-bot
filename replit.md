# Discord.js v14 Bot

## Overview

This is a comprehensive, multipurpose Discord bot built using Discord.js v14. The bot features a modular command system supporting both traditional prefix commands and modern slash commands/context menus. It includes extensive functionality across multiple categories: administration, moderation, economy, music, giveaways, invites tracking, statistics, tickets, auto-moderation, anime reactions, image manipulation, and various utility features.

The bot is designed as a production-ready, feature-rich solution with optional web dashboard support, extensive configuration options, and robust error handling.

## Recent Changes

**October 5, 2025 - Components V2 Migration (Information Commands)**
- Converted help command to Container-based Components V2 system with interactive navigation
- Converted botinfo/botstats command to modern Container layout with system metrics
- Converted userinfo command to Components V2 with member role color accent
- Converted serverinfo/guildinfo command to professional Container format
- All information commands now use Section components with Text Display for organized content
- Replaced all manual decorations (---, ___, ╭╯, code blocks) with native Separator components
- Implemented proper spacing hierarchy with dividers for visual clarity
- Added Thumbnail accessories to display avatars and server icons in headers
- Used Discord timestamps (<t:unix:F>) for dynamic time displays
- Applied Discord Blurple (#5865F2) accent color across all Containers for brand consistency
- All commands now return MessageFlags.IsComponentsV2 for proper rendering

**October 5, 2025 - Discord Components V2 Integration (Bot Mention Handler)**
- Completely modernized bot mention handler using Discord's new Components V2 system
- Replaced old embed design with professional Container component with Discord Blurple accent bar
- Implemented Section components with Text Display for organized content layout
- Added Separator components with dividers for clean spacing (removed manual --- and ___ decorations)
- Integrated Thumbnail accessory showing bot avatar in header section
- Positioned Help Menu and Premium buttons as section accessories for better UX
- Used native markdown headers (# and ###) in Text Display for professional typography
- Added MessageFlags.IsComponentsV2 to enable the new component system
- Improved visual hierarchy with proper spacing and dividers
- Enhanced readability with structured sections: Header, Get Started, Quick Actions, Premium Features, Footer
- Bot mention response now uses cutting-edge Discord UI components for a premium experience

**October 5, 2025 - Discord.js v14 Embed Components & Button Integration**
- Implemented Discord.js v14 ActionRow and Button components for modern UI/UX
- Redesigned moderation error embeds with dark theme (#2B2D31) and user profile icons
- Error messages now show the issuer's profile icon on the left side for better context
- Added optional chaining guards to prevent crashes when issuer data is unavailable
- Fixed canvas native module rebuild issue for profile card command
- All moderation commands (ban, kick, warn, timeout) now use cleaner error format with emoji indicators

**October 4, 2025 - Profile Card Complete Redesign**
- Completely rewrote profile card generator to match premium Discord profile design
- Changed command name from "profilecard" to "profile" (aliases: pf, card)
- Implemented dark theme with Discord colors (#2B2D31 background, #1E1F22 card)
- Added stunning blue/purple gradient banner with radial wave effects
- Created glowing cyan ring around avatar with proper shadow effects
- Positioned status indicator dot next to username (green/yellow/red/gray based on status)
- Added activity display with emoji icons (Playing 🎮, Listening 🎵, etc.)
- Optimized rendering for faster processing (reduced cooldown to 3 seconds)
- Bio displays user's top 3 roles or custom text
- Removed embed wrapper for cleaner image output

**October 4, 2025 - Major UI/UX Improvements**
- Fixed critical purge command bug where amount was treated as string (purging 1 would delete 11 messages)
- Created custom emoji constants system for consistent UI across all commands
- Updated all moderation commands (ban, kick, warn, timeout, purge) with modern Discord embeds
- Added proper error messages with custom emojis matching Discord's style
- All command responses now use professional embeds with timestamps and proper formatting
- Error messages now display with ❌ emoji and styled embeds
- Success messages use ✅ emoji with green embeds
- Warning messages use ⚠️ emoji with yellow embeds

**October 4, 2025 - Replit Environment Setup**
- Successfully imported GitHub repository to Replit
- Installed all npm dependencies (472 packages)
- Configured workflow to run the Discord bot with `npm start`
- Bot is running and connected as "Cybork#2032"
- MongoDB connection established successfully
- Loaded 96 commands, 77 slash commands, and 15 events
- Dashboard is disabled by default (can be enabled in config.js)

**October 4, 2025 - Help Command Customization**
- Customized help command with new embed design (white color scheme)
- Updated help menu layout to match BlaZe HQ style
- Modified button layout: Main Module, Extra Module, Search Command
- Footer changed to "Powered by BlaZe HQ"
- Category command display changed to comma-separated format

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Framework
- **Discord.js v14**: Primary Discord API wrapper utilizing Gateway Intents and Partials for comprehensive event handling
- **Node.js**: Runtime environment (minimum v18.0.0 required)
- **Module Alias System**: Path aliasing for cleaner imports (`@root`, `@src`, `@helpers`, `@schemas`, etc.)

### Command Architecture
- **Dual Command System**: Supports both prefix-based commands and slash commands/context menus simultaneously
- **Command Structure**: Centralized command definitions in `src/commands/` organized by category (admin, economy, fun, moderation, music, etc.)
- **Command Validation**: Built-in validation system for permissions, cooldowns, arguments, and prerequisites
- **Context Menus**: User and message context menu support for quick actions
- **Category-Based Organization**: Commands grouped into logical categories (ADMIN, ANIME, ECONOMY, FUN, GIVEAWAY, IMAGE, etc.)

### Database Layer
- **MongoDB with Mongoose**: Primary data persistence layer
- **Schema Design**: Separate schemas for different entities:
  - Guild settings and configurations
  - User economy and statistics data
  - Member-specific server data
  - Moderation logs
  - Translation logs
  - Giveaways
  - Reaction roles
  - Suggestions
  - Auto-moderation logs

### Feature Modules

**Music System**:
- Lavalink-based music player using lavaclient
- Queue management with loop and shuffle support
- Spotify integration for track resolution
- Voice state management and node connection handling

**Economy System**:
- Coin-based virtual economy
- Bank operations (deposit, withdraw, transfer)
- Daily rewards with streak tracking
- Gambling mechanics

**Moderation & Auto-Moderation**:
- Comprehensive mod actions (warn, kick, ban, timeout, etc.)
- Auto-moderation for spam, links, mass mentions, ghost pings
- Configurable strike system with automatic actions
- Channel whitelisting
- Moderation logging to designated channels

**Invite Tracking**:
- Real-time invite tracking and caching
- Invite-based role rewards system
- Detection of fake invites and left members
- Vanity URL support

**Statistics & Leveling**:
- XP-based leveling system with configurable cooldowns
- Message and voice activity tracking
- Leaderboards for XP, invites, and reputation
- Custom level-up messages and channels

**Giveaways**:
- Mongoose-backed giveaway manager
- Custom embed colors and reactions
- Giveaway management (pause, resume, reroll, edit)

**Tickets**:
- Multi-category ticket system
- Dynamic channel creation with user permissions
- Ticket logging and transcript generation via sourcebin

**Translation**:
- Flag reaction-based translation using Google Translate API
- Cooldown system to prevent abuse
- Translation logging

**Counter Channels**:
- Auto-updating voice channels for member/bot/user counts
- Batch update queue system to prevent rate limiting

**Greeting System**:
- Welcome and farewell messages with variable parsing
- Image-based greetings support
- Invite information in greetings

### Web Dashboard (Optional)
- **Express.js**: Web server framework
- **EJS Templates**: Server-side rendering for dashboard views
- **Session Management**: express-session with MongoDB store (connect-mongo)
- **OAuth2 Authentication**: Discord OAuth for user authentication
- **Guild Management Interface**: Web-based configuration for bot settings per guild

### Handlers & Middleware
- **Event Handler**: Centralized event loading and registration
- **Command Handler**: Prefix command parsing, validation, and execution
- **Context Handler**: Slash command and context menu interaction handling
- **Presence Handler**: Dynamic bot status updates with variable replacement
- **Counter Handler**: Batch update system for counter channels
- **Reaction Role Handler**: Automatic role assignment based on message reactions
- **Stats Handler**: XP tracking with anti-spam cooldown
- **Greeting Handler**: Welcome/farewell message processing with template parsing

### Caching Strategy
- **Configurable Cache Sizes**: Separate limits for guilds, users, and members
- **Invite Caching**: Per-guild invite caching for accurate tracking
- **Cooldown Caching**: In-memory Maps for command and translation cooldowns
- **Reaction Role Caching**: Pre-loaded reaction role configurations
- **Antispam Caching**: Temporary cache for spam detection with automatic cleanup

### Error Handling & Logging
- **Pino Logger**: Structured logging with file output and pretty console formatting
- **Webhook Logging**: Optional error reporting to Discord webhook
- **Unhandled Rejection Catching**: Global error handlers for process stability
- **Per-Module Error Handling**: Try-catch blocks in critical async operations

### Extension System
- **Discord.js Extenders**: Custom methods added to Message, Guild, and GuildChannel prototypes
- **Safe Reply Methods**: Built-in safe messaging to prevent errors
- **Member Statistics**: Extended guild methods for bot/member counting

### Configuration Management
- **Environment Variables**: Sensitive data (tokens, secrets, DB connection) via .env
- **Config File**: Central configuration for features, embed colors, cache sizes, and module toggles
- **Validation on Startup**: Configuration validation before bot initialization

## External Dependencies

### Required Services
- **MongoDB**: Database for persistent data storage (connection string required)
- **Discord Bot Token**: From Discord Developer Portal
- **Lavalink Nodes**: For music functionality (if music module enabled)

### Optional Services
- **Spotify API**: Client ID and secret for Spotify music integration
- **Discord OAuth2**: Bot secret for dashboard authentication
- **Error Webhook**: Discord webhook URL for error logging

### Key NPM Packages
- `discord.js`: Discord API interaction
- `mongoose`: MongoDB ODM
- `lavaclient` & `@lavaclient/queue`: Music player
- `@lavaclient/spotify`: Spotify track resolution
- `discord-giveaways`: Giveaway management
- `express` & `ejs`: Web dashboard
- `express-session` & `connect-mongo`: Session management
- `@vitalets/google-translate-api`: Translation service
- `nekos.life`: Anime reactions API
- `pino` & `pino-pretty`: Logging
- `sourcebin_js`: Ticket transcript hosting
- `discord-together`: Discord Activities integration

### Development Tools
- ESLint with JSDoc plugin for code quality
- Prettier for code formatting
- Nodemon for development hot-reload

## Replit Environment Setup

### Required Environment Variables
The following environment variables must be set in Replit Secrets:
- `BOT_TOKEN`: Your Discord bot token (required)
- `MONGO_CONNECTION`: MongoDB connection string (required)
- `BOT_SECRET`: Discord OAuth2 client secret (required for dashboard)
- `SESSION_PASSWORD`: Session secret for dashboard authentication (required for dashboard)

### Optional Environment Variables
- `WEATHERSTACK_KEY`: API key for weather command functionality
- `STRANGE_API_KEY`: API key for image manipulation commands
- `SPOTIFY_CLIENT_ID`: Spotify client ID for music integration
- `SPOTIFY_CLIENT_SECRET`: Spotify client secret for music integration
- `ERROR_LOGS`: Discord webhook URL for error logging
- `JOIN_LEAVE_LOGS`: Discord webhook URL for join/leave event logging

### Running the Bot
The bot is configured to run automatically via Replit workflow:
- Workflow name: "Discord Bot"
- Command: `npm start`
- Output type: Console (no web interface, backend only)

### Current Status
- Bot is running as "Cybork#2032"
- MongoDB connection is active
- 96 commands loaded (77 slash commands)
- 15 events registered
- Dashboard is disabled (can be enabled in `config.js` by setting `DASHBOARD.enabled` to `true`)

### Enabling the Dashboard
To enable the web dashboard:
1. Set `DASHBOARD.enabled` to `true` in `config.js`
2. Configure `DASHBOARD.baseURL` and `DASHBOARD.failureURL` to match your Replit URL
3. Ensure `BOT_SECRET` and `SESSION_PASSWORD` are set in Replit Secrets
4. The dashboard will be available on port 5000

### Configuration
- Main configuration file: `config.js`
- Bot prefix: `!` (configurable per server)
- Slash commands: Disabled by default (enable in `config.js` under `INTERACTIONS.SLASH`)
- Music system: Disabled by default (requires Lavalink server setup)