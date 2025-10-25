# Discord.js v14 Bot

## Overview
This project is a comprehensive, multipurpose Discord bot built with Discord.js v14, offering extensive functionality across administration, moderation, economy, music, giveaways, invites, statistics, tickets, auto-moderation, anime reactions, image manipulation, and general utilities. It features a modular command system supporting both prefix and slash commands. The bot is designed as a production-ready solution with optional web dashboard support, extensive configuration, and robust error handling.

**Recent Update (Oct 2025)**: Completed major system enhancements including:
- Migration of Welcome/Autorole, Automod, and Logging systems to modern interactive Discord components (buttons, modals, select menus) with centralized interaction routing
- Security fix: Separated noprefix users from developer access with automatic backward-compatible migration
- Custom command aliases system with interactive management UI and validation
- Comprehensive moderation suite: lock/unlock channels, audit log viewer, role-based mute/unmute system
- All owner-only commands now use prefix-only (slash commands disabled for security)
- Full prefix command support for greet and automod commands (supports both prefix and slash command interfaces)
- **Security Category**: Complete antinuke protection suite with 11 commands (antiban, antikick, antirole, antichannel, antibot, antiwebhook, antiemoji, antiguild-update, antieveryone, autorecovery, antinuke) - all support both prefix and slash modes
- **Server Utilities**: New `spfp` and `sname` commands for changing server icon and name with modern UI
- **Modern Giveaway UI**: Professional giveaway embeds with toggle button to switch between modern (ContainerBuilder) and classic (embed) views, featuring server icon, markdown styling, and beautiful formatting
- **PFP Command Fix**: Resolved "Expected a string primitive" error with proper string validation in PinterestScraper
- **UI Component Upgrade (Oct 25, 2025)**: Comprehensive admin UI modernization:
  - All embeds/containers now use consistent white color (0xFFFFFF) throughout the system
  - Enhanced EmojiManager with 60-second cache to prevent repeated file reads and improve performance
  - Complete rewrite of greet, automod, autorole handlers with modern string select menus for channel/role selection
  - New antinuke handler with user/channel select menus, modal configuration, and preset security profiles
  - All admin handlers now use emojis from centralized emojis.json configuration
  - Fixed slow button interactions in autorole enable/disable functionality
  - Optimized interaction handling with proper error recovery and user feedback
  - Event-based interaction routing for admin components bypassing router context for better performance

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
- **Interactive Components**: Modern UI with buttons, modals, select menus, and pagination.
- **Interaction Router**: Centralized component routing with namespaced custom IDs (format: `category:action:data`).
- **Custom Aliases**: Server-specific command aliases with interactive management (max 50 per server).

### Database Layer
- **MongoDB with Mongoose**: Primary data persistence with separate schemas for guild settings, user data, moderation logs, giveaways, reaction roles, etc.
- **Backward-Compatible Migrations**: Automatic schema migrations preserve legacy data (e.g., noprefix users from developers array).

### Feature Modules
- **Admin Systems**: 
  - **Autorole** (`/autorole` or `!autorole`): Separate bot/human autoroles with interactive management
  - **Welcome/Greet** (`/greet` or `!greet`): Multi-channel support, auto-delete, embed customization, 7 subcommands with full prefix support
  - **Automod** (`/automod` or `!automod`): Rule-based protection (antispam, antilink, antibadwords, antizalgo, anticaps) with channel whitelisting and full prefix support
  - **Logging** (7 commands): Comprehensive event logging (channels, members, messages, moderation, roles)
- **Music System**: Lavalink-based player with Euphony-style UI, queue management, Spotify integration
- **Economy**: Coin-based system with daily rewards, begging, gambling
- **Moderation**: 
  - Standard actions: Kick, ban, timeout, warn, purge with mod logs
  - Channel control: Lock/unlock channels
  - Role-based muting: Mute/unmute with automatic "Muted" role creation
  - Audit logs: Interactive audit log viewer with filters and pagination (`/audit`)
- **Security**: 
  - Complete antinuke protection suite with 11 commands
  - Configurable protection modules (ban, kick, role, channel, bot, webhook, emoji, guild settings, @everyone)
  - Whitelist system for trusted users
  - Auto-recovery for channel/role deletions
  - Punishment system (ban, kick, strip roles)
  - All commands support both prefix and slash modes
- **Tickets**: Multi-category support with transcripts
- **Giveaways**: 
  - Modern professional UI with ContainerBuilder design
  - Toggle button to switch between modern and classic views
  - Server icon integration
  - Interactive setup with modals
  - Custom reaction emoji support
- **Server Utilities**:
  - `spfp`: Change server icon with image URL or attachment
  - `sname`: Change server name with validation
- **Other Features**: Invite tracking, statistics/leveling, reaction roles, translation, counter channels

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
- **Message Flags**: Container-based interaction responses use flag `1 << 15` (IS_COMPONENTS_V2) - only for interaction responses, not channel messages.
- **Interactive Components**: Action rows with buttons/select menus are positioned below containers.
- **Design Patterns**: Clean containers, markdown headers, emoji integration, and color-coded accent bars (Blue for info, Green for success, Red for error, Yellow for warning).
- **ModernEmbed Fallback**: Maintained for commands not yet migrated to Components V2.
- **No ASCII Decorations**: Replaced with native Discord markdown and component layouts.
- **Centralized Emoji System**: All bot emojis managed through `emojis.json` config file with owner commands for runtime management.
- **Music Player UI**: Euphony-style redesign with orange accent, dark theme, professional button layouts, track numbering, dynamic volume indicators, "Queued by" attribution, queue display with ratings, pagination, history, and album artwork.
- **Giveaway UI**: Modern professional design with toggle button, supporting both modern (ContainerBuilder with markdown) and classic (embed) views, featuring server name integration and beautiful formatting.

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