# Discord.js v14 Bot

## Overview
This project is a comprehensive, multipurpose Discord bot built with Discord.js v14. It features a modular command system supporting both prefix and slash commands, offering extensive functionality across administration, moderation, economy, music, giveaways, invites, statistics, tickets, auto-moderation, anime reactions, image manipulation, and general utilities. The bot is designed as a production-ready solution with optional web dashboard support, extensive configuration, and robust error handling.

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
- **Music System**: Lavalink-based player with queue management and Spotify integration.
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