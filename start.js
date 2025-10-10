
const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check if Lavalink.jar exists
const fs = require('fs');
const lavalinkPath = path.join(__dirname, 'Lavalink.jar');
const hasLavalink = fs.existsSync(lavalinkPath);

let lavalinkProcess = null;
let botProcess = null;

// Function to start Lavalink
function startLavalink() {
  if (!hasLavalink) {
    log('⚠️  Lavalink.jar not found - skipping Lavalink server', colors.yellow);
    log('ℹ️  Music commands will use external Lavalink nodes', colors.cyan);
    return null;
  }

  log('🎵 Starting Lavalink server...', colors.magenta);
  
  const lavalink = spawn('java', [
    '-Djdk.tls.client.protocols=TLSv1.3,TLSv1.2',
    '-Xmx512M',
    '-jar',
    'Lavalink.jar'
  ], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  lavalink.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log(`[Lavalink] ${message}`, colors.magenta);
    }
  });

  lavalink.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log(`[Lavalink Error] ${message}`, colors.red);
    }
  });

  lavalink.on('close', (code) => {
    log(`⚠️  Lavalink process exited with code ${code}`, colors.yellow);
    if (code !== 0 && code !== null) {
      log('🔄 Attempting to restart Lavalink in 5 seconds...', colors.yellow);
      setTimeout(() => {
        lavalinkProcess = startLavalink();
      }, 5000);
    }
  });

  lavalink.on('error', (error) => {
    log(`❌ Lavalink error: ${error.message}`, colors.red);
  });

  return lavalink;
}

// Function to start Discord Bot
function startBot() {
  log('🤖 Starting Discord bot...', colors.cyan);
  
  const bot = spawn('node', ['bot.js'], {
    cwd: __dirname,
    stdio: 'pipe',
    env: { ...process.env }
  });

  bot.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log(`[Bot] ${message}`, colors.cyan);
    }
  });

  bot.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log(`[Bot Error] ${message}`, colors.red);
    }
  });

  bot.on('close', (code) => {
    log(`⚠️  Bot process exited with code ${code}`, colors.yellow);
    if (code !== 0 && code !== null) {
      log('🔄 Attempting to restart bot in 5 seconds...', colors.yellow);
      setTimeout(() => {
        botProcess = startBot();
      }, 5000);
    }
  });

  bot.on('error', (error) => {
    log(`❌ Bot error: ${error.message}`, colors.red);
  });

  return bot;
}

// Main startup sequence
async function main() {
  log('╔════════════════════════════════════════╗', colors.bright);
  log('║   Discord Bot + Lavalink Launcher     ║', colors.bright);
  log('╚════════════════════════════════════════╝', colors.bright);
  log('');

  // Start Lavalink first
  if (hasLavalink) {
    lavalinkProcess = startLavalink();
    
    // Wait for Lavalink to initialize (5 seconds)
    log('⏳ Waiting for Lavalink to initialize...', colors.yellow);
    await new Promise(resolve => setTimeout(resolve, 5000));
    log('✅ Lavalink initialization period complete', colors.green);
  }

  // Start Discord bot
  botProcess = startBot();

  log('');
  log('✅ All services started successfully!', colors.green);
  log('');
}

// Graceful shutdown handler
function shutdown() {
  log('');
  log('🛑 Shutting down services...', colors.yellow);
  
  if (botProcess) {
    log('   Stopping Discord bot...', colors.cyan);
    botProcess.kill();
  }
  
  if (lavalinkProcess) {
    log('   Stopping Lavalink server...', colors.magenta);
    lavalinkProcess.kill();
  }
  
  log('✅ Shutdown complete', colors.green);
  process.exit(0);
}

// Handle termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`❌ Uncaught Exception: ${error.message}`, colors.red);
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}`, colors.red);
  log(`   Reason: ${reason}`, colors.red);
});

// Start everything
main().catch((error) => {
  log(`❌ Startup failed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
