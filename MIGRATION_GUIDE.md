# Migration Guide: Interaction Components Modernization

## Overview

This guide provides step-by-step instructions and code patches for migrating to the centralized interaction component architecture.

## Phase 1: Setup Infrastructure (No Breaking Changes)

### Step 1.1: Add Interaction Router to Client

**File:** `src/structures/BotClient.js`

```diff
+ const InteractionRouter = require("@handlers/interactionRouter");

  class BotClient extends Client {
    constructor() {
      // ... existing code ...
+     
+     // Initialize interaction router
+     this.interactionRouter = new InteractionRouter(this);
    }
  }
```

### Step 1.2: Initialize Router in Bot Startup

**File:** `bot.js`

```diff
  client.loadCommands("src/commands");
  client.loadContexts("src/contexts");
  client.loadEvents("src/events");
+ 
+ // Initialize interaction router
+ client.interactionRouter.initialize();
```

### Step 1.3: Create Interaction Event Handler

**File:** `src/events/interactions/interactionCreate.js`

```javascript
const { Events } = require("discord.js");

/**
 * @param {import('@src/structures').BotClient} client
 */
module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // Handle component interactions (buttons, select menus)
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      // Check if customId uses new namespaced format (contains ':')
      if (interaction.customId.includes(':')) {
        return client.interactionRouter.routeComponent(interaction);
      }
      // Legacy interactions are handled by command files
      return;
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      if (interaction.customId.includes(':')) {
        return client.interactionRouter.routeModal(interaction);
      }
      return;
    }

    // Handle slash commands (existing code)
    if (interaction.isCommand()) {
      // ... existing slash command handling ...
    }
  },
};
```

## Phase 2: Migrate Individual Commands

### Example 1: Migrate Embed Command

#### Before (Current Code)

**File:** `src/commands/admin/embed.js` (lines 68-76)

```javascript
async function embedSetup(channel, member) {
  const sentMsg = await channel.send({
    content: "Click the button below to get started",
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("EMBED_ADD").setLabel("Create Embed").setStyle(ButtonStyle.Primary)
      ),
    ],
  });
```

#### After (Namespaced IDs)

```diff
  async function embedSetup(channel, member) {
    const sentMsg = await channel.send({
      content: "Click the button below to get started",
      components: [
        new ActionRowBuilder().addComponents(
-         new ButtonBuilder().setCustomId("EMBED_ADD").setLabel("Create Embed").setStyle(ButtonStyle.Primary)
+         new ButtonBuilder()
+           .setCustomId(`embed:add:${channel.id}`)
+           .setLabel("Create Embed")
+           .setStyle(ButtonStyle.Primary)
        ),
      ],
    });
```

#### Register Handlers

**File:** `src/handlers/interactionRouter.js`

```diff
+ const embedHandlers = require("@src/components/embed/handlers");

  registerEmbedHandlers() {
-   // Placeholder
+   this.registerComponent("embed", "add", embedHandlers.handleEmbedAdd);
+   this.registerModal("embed", "modal", embedHandlers.handleEmbedModal);
+   this.registerComponent("embed", "field:add", embedHandlers.handleFieldAdd);
+   this.registerModal("embed", "field:modal", embedHandlers.handleFieldModal);
+   this.registerComponent("embed", "field:remove", embedHandlers.handleFieldRemove);
+   this.registerComponent("embed", "done", embedHandlers.handleEmbedDone);
  }
```

#### Remove Inline Collector Logic

**File:** `src/commands/admin/embed.js` (lines 173-261)

```diff
- const collector = channel.createMessageComponentCollector({
-   componentType: ComponentType.Button,
-   filter: (i) => i.member.id === member.id,
-   message: sentMsg,
-   idle: 5 * 60 * 1000,
- });
- 
- collector.on("collect", async (interaction) => {
-   // ... hundreds of lines of handler logic ...
- });

+ // Collector is now handled by centralized router
+ // Handlers registered in interactionRouter.js
```

### Example 2: Add Deferral to Unban Command

#### Before

**File:** `src/commands/moderation/unban.js` (lines 51-58)

```javascript
async interactionRun(interaction) {
  const match = interaction.options.getString("name");
  const reason = interaction.options.getString("reason");

  const response = await getMatchingBans(interaction.guild, match);
  const sent = await interaction.followUp(response);
  if (typeof response !== "string") await waitForBan(interaction.member, reason, sent);
},
```

#### After (With Deferral)

```diff
  async interactionRun(interaction) {
+   // Defer immediately since fetching bans can be slow
+   await interaction.deferReply({ ephemeral: true });
+   
    const match = interaction.options.getString("name");
    const reason = interaction.options.getString("reason");

    const response = await getMatchingBans(interaction.guild, match);
-   const sent = await interaction.followUp(response);
+   const sent = await interaction.editReply(response);
    if (typeof response !== "string") await waitForBan(interaction.member, reason, sent);
  },
```

### Example 3: Improve Help Command Timeouts

#### Before

**File:** `src/commands/utility/help.js` (line 175)

```javascript
const collector = msg.channel.createMessageComponentCollector({
  filter: (reactor) => reactor.user.id === userId && msg.id === reactor.message.id,
  idle: IDLE_TIMEOUT * 1000,
  dispose: true,
  time: 10 * 60 * 1000,
});
```

#### After (Longer Timeout)

```diff
+ const IDLE_TIMEOUT = 180; // Increase from 120 to 180 seconds (3 minutes)

  const collector = msg.channel.createMessageComponentCollector({
    filter: (reactor) => reactor.user.id === userId && msg.id === reactor.message.id,
    idle: IDLE_TIMEOUT * 1000,
    dispose: true,
    time: 10 * 60 * 1000,
  });
```

### Example 4: Use Shared Pagination Component

#### Before (Custom Pagination)

**File:** `src/commands/owner/listservers.js` (lines 48-127)

```javascript
// 80+ lines of custom pagination logic
let currentPage = 1;
const buildEmbed = () => { /* ... */ };
const collector = channel.createMessageComponentCollector({ /* ... */ });
collector.on("collect", async (response) => { /* ... */ });
```

#### After (Using Shared Component)

```diff
+ const PaginationHandler = require("@src/components/shared/pagination");

  async messageRun(message, args) {
    const { client, channel, member } = message;
    
    // ... build servers list ...
    
-   // 80+ lines of pagination code...
+   await PaginationHandler.create({
+     interaction: message,
+     items: servers,
+     buildEmbed: (page, pageServers, totalPages, totalItems) => {
+       return new EmbedBuilder()
+         .setColor(client.config.EMBED_COLORS.BOT_EMBED)
+         .setAuthor({ name: "List of servers" })
+         .setFooter({ text: `${match ? "Matched" : "Total"} Servers: ${totalItems} • Page ${page} of ${totalPages}` })
+         .addFields(
+           pageServers.map(server => ({
+             name: server.name,
+             value: server.id,
+             inline: true,
+           }))
+         );
+     },
+     itemsPerPage: 10,
+     timeout: 120000,
+   });
  }
```

## Phase 3: Add Error Boundaries

### Improved Error Handling Pattern

#### Before

```javascript
.catch((ex) => {})  // Silent failure ❌
```

#### After

```diff
- .catch((ex) => {})
+ .catch((ex) => {
+   client.logger.error("Component Interaction Error", ex);
+   
+   // Try to inform user
+   const errorMsg = "An error occurred while processing your request. Please try again.";
+   
+   if (!interaction.replied && !interaction.deferred) {
+     interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
+   } else if (interaction.deferred) {
+     interaction.editReply({ content: errorMsg }).catch(() => {});
+   } else {
+     interaction.followUp({ content: errorMsg, ephemeral: true }).catch(() => {});
+   }
+ })
```

### Add Try-Catch Blocks

**File:** `src/commands/giveaways/giveaway.js` (modal submit handling)

```diff
  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 1 * 60 * 1000,
      filter: (m) => m.customId === "giveaway-modalSetup" && m.member.id === member.id && m.message.id === sentMsg.id,
    })
-   .catch((ex) => {});
+   .catch((ex) => {
+     client.logger.error("Giveaway Modal Timeout", ex);
+     return null;
+   });

  if (!modal) {
+   await sentMsg.edit({ 
+     content: "⏱️ No response received within 1 minute. Please try again.", 
+     components: [] 
+   }).catch(() => {});
    return;
  }
```

## Phase 4: Add Tests

### Install Testing Dependencies

```bash
npm install --save-dev jest @types/jest
```

### Add Test Scripts

**File:** `package.json`

```diff
  "scripts": {
    "dev": "nodemon .",
    "start": "node .",
    "format": "prettier --write src",
+   "test": "jest",
+   "test:watch": "jest --watch",
+   "test:coverage": "jest --coverage"
  },
```

### Create Jest Config

**File:** `jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  moduleNameMapper: {
    '^@root/(.*)$': '<rootDir>/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@handlers/(.*)$': '<rootDir>/src/handlers/$1',
    '^@helpers/(.*)$': '<rootDir>/src/helpers/$1',
    '^@schemas/(.*)$': '<rootDir>/src/database/schemas/$1',
    '^@structures/(.*)$': '<rootDir>/src/structures/$1',
  },
};
```

## Phase 5: Update Documentation

### Update Command Usage Docs

Create developer documentation for using the new architecture:

**File:** `docs/COMPONENT_ARCHITECTURE.md`

```markdown
# Component Architecture Guide

## Creating a New Interactive Command

### 1. Define Custom IDs with Namespace

Format: `category:action:data`

Example: `ticket:create:userId` or `embed:field:add:messageId`

### 2. Create Component Handlers

Place handlers in `src/components/{category}/handlers.js`

### 3. Register with Router

In `src/handlers/interactionRouter.js`:

\`\`\`javascript
registerTicketHandlers() {
  const ticketHandlers = require("@src/components/ticket/handlers");
  
  this.registerComponent("ticket", "create", ticketHandlers.handleCreate);
  this.registerModal("ticket", "modal", ticketHandlers.handleModal);
}
\`\`\`

### 4. Use in Commands

\`\`\`javascript
const button = new ButtonBuilder()
  .setCustomId(`ticket:create:${userId}`)
  .setLabel("Create Ticket")
  .setStyle(ButtonStyle.Success);
\`\`\`
```

## Testing Checklist

After migration, verify:

- [ ] All buttons respond within 3 seconds
- [ ] All modals submit successfully
- [ ] All select menus work correctly
- [ ] Collectors timeout gracefully
- [ ] Error messages are user-friendly
- [ ] Ephemeral settings are correct
- [ ] All interactions are logged
- [ ] Tests pass
- [ ] No regression in existing functionality

## Rollback Plan

If issues occur:

1. **Quick Rollback:** Comment out router initialization
2. **Partial Rollback:** Revert specific command changes
3. **Full Rollback:** Git revert to previous commit

### Emergency Disable

**File:** `src/events/interactions/interactionCreate.js`

```diff
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
+   // EMERGENCY: Disable router
+   if (false) {  // Change to true to disable
      if (interaction.customId.includes(':')) {
        return client.interactionRouter.routeComponent(interaction);
      }
+   }
  }
```

## Performance Monitoring

### Add Metrics

```javascript
// In interactionRouter.js
async routeComponent(interaction) {
  const startTime = Date.now();
  
  try {
    // ... existing code ...
    
    const duration = Date.now() - startTime;
    this.client.logger.debug(`Component routed in ${duration}ms: ${interaction.customId}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    this.client.logger.error(`Component failed after ${duration}ms: ${interaction.customId}`, error);
  }
}
```

## Summary of Changes

### Files Created
- `src/handlers/interactionRouter.js` - Centralized router
- `src/components/embed/handlers.js` - Embed handlers
- `src/components/shared/pagination.js` - Reusable pagination
- `src/components/shared/confirmation.js` - Confirmation dialogs
- `tests/interactions/*.test.js` - Test suites
- `tests/helpers/mockInteractions.js` - Test utilities

### Files Modified
- `src/commands/admin/embed.js` - Namespaced custom IDs
- `src/commands/moderation/unban.js` - Added deferral
- `src/commands/utility/help.js` - Increased timeouts
- `src/commands/owner/listservers.js` - Use shared pagination
- `src/structures/BotClient.js` - Initialize router
- `bot.js` - Router setup
- `package.json` - Test scripts

### Breaking Changes
None - all changes are backwards compatible during migration.

## Support

For questions or issues during migration:
1. Check the audit report in `INTERACTION_AUDIT.md`
2. Review test examples in `tests/`
3. Consult Discord.js v14 documentation
