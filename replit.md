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

### UI/UX Decisions
- **Modern Embed System (Components V2)**: All bot responses utilize Discord's Components V2 for a professional and consistent UI.
- **ModernEmbed Helper Class**: Simplifies creation of Components V2 embeds with standardized designs (success, error, warning, info messages).
- **Design Patterns**: Employs Headers (using `# Title`), Sections (using `### Header`), Separators for visual spacing, Footers with optional timestamps, and accent colors for different message types (Green for success, Red for error, Yellow for warning, Blurple for info).
- **Component Structure**: Embeds follow a clear hierarchy: Container, Header Section (with optional thumbnail), Separator, Content Sections, Separators, and Footer.
- **Profile Card Redesign**: `profile` command generates a premium-style Discord profile card image with dark theme, gradient banner, glowing avatar ring, status indicator, and activity display.
- **Custom Emoji Constants**: Consistent UI across commands using custom emoji constants.

## External Dependencies

### Required Services
- **MongoDB**: For persistent data storage.
- **Discord Bot Token**: From Discord Developer Portal.
- **Lavalink Nodes**: For music functionality.

### Optional Services
- **Spotify API**: Client ID and secret for music integration.
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