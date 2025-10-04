# Discord.js v14 Bot

## Overview

This is a comprehensive, multipurpose Discord bot built using Discord.js v14. The bot features a modular command system supporting both traditional prefix commands and modern slash commands/context menus. It includes extensive functionality across multiple categories: administration, moderation, economy, music, giveaways, invites tracking, statistics, tickets, auto-moderation, anime reactions, image manipulation, and various utility features.

The bot is designed as a production-ready, feature-rich solution with optional web dashboard support, extensive configuration options, and robust error handling.

## Recent Changes

**October 4, 2025**
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