const { spawn } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

const fs = require('fs');
const lavalinkPath = path.join(__dirname, 'Lavalink.jar');
const hasLavalink = fs.existsSync(lavalinkPath);

let lavalinkProcess = null;
let botProcess = null;
let lavalinkReady = false;

async function checkLavalinkRunning() {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    exec('lsof -i:2010 || netstat -an | grep 2010', (error, stdout) => {
      resolve(stdout && stdout.trim().length > 0);
    });
  });
}

async function startLavalink() {
  if (!hasLavalink) {
    log('Lavalink.jar not found - music commands will use external nodes', colors.yellow);
    return null;
  }

  const isRunning = await checkLavalinkRunning();
  if (isRunning) {
    log('Lavalink already running on port 2010 - using existing instance', colors.cyan);
    lavalinkReady = true;
    return null;
  }

  log('Starting Lavalink music server...', colors.magenta);
  
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
      if (message.includes('Lavalink is ready to accept connections')) {
        lavalinkReady = true;
        log('Lavalink is ready to accept connections ✓', colors.green);
      } else {
        log(`${message}`, colors.dim);
      }
    }
  });

  lavalink.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message && !message.includes('Picked up JAVA_TOOL_OPTIONS')) {
      log(`${message}`, colors.red);
    }
  });

  lavalink.on('close', (code) => {
    lavalinkReady = false;
    log(`Lavalink process exited with code ${code}`, colors.yellow);
    if (code !== 0 && code !== null) {
      log('Attempting to restart Lavalink in 10 seconds...', colors.yellow);
      setTimeout(() => {
        lavalinkProcess = startLavalink();
      }, 10000);
    }
  });

  lavalink.on('error', (error) => {
    log(`Lavalink error: ${error.message}`, colors.red);
  });

  return lavalink;
}

function startBot() {
  log('Starting Discord bot...', colors.cyan);
  
  const bot = spawn('node', ['bot.js'], {
    cwd: __dirname,
    stdio: 'pipe',
    env: { ...process.env }
  });

  bot.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      if (message.includes('Logged in as')) {
        log(`${message} ✓`, colors.green);
      } else if (message.includes('ERROR') || message.includes('error')) {
        log(`${message}`, colors.red);
      } else if (message.includes('WARN')) {
        log(`${message}`, colors.yellow);
      } else {
        log(`${message}`, colors.cyan);
      }
    }
  });

  bot.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message && !message.includes('DeprecationWarning')) {
      log(`${message}`, colors.red);
    }
  });

  bot.on('close', (code) => {
    log(`Bot process exited with code ${code}`, colors.yellow);
    if (code !== 0 && code !== null) {
      log('Attempting to restart bot in 5 seconds...', colors.yellow);
      setTimeout(() => {
        botProcess = startBot();
      }, 5000);
    }
  });

  bot.on('error', (error) => {
    log(`Bot error: ${error.message}`, colors.red);
  });

  return bot;
}

async function main() {
  console.log('\n' + colors.bright + colors.cyan + '╔════════════════════════════════════════════════════╗' + colors.reset);
  console.log(colors.bright + colors.cyan + '║                                                    ║' + colors.reset);
  console.log(colors.bright + colors.cyan + '║       Discord Bot + Lavalink Music System         ║' + colors.reset);
  console.log(colors.bright + colors.cyan + '║              Professional Launcher                 ║' + colors.reset);
  console.log(colors.bright + colors.cyan + '║                                                    ║' + colors.reset);
  console.log(colors.bright + colors.cyan + '╚════════════════════════════════════════════════════╝' + colors.reset + '\n');

  if (hasLavalink) {
    lavalinkProcess = await startLavalink();
    
    if (lavalinkProcess) {
      log('Waiting for Lavalink to fully initialize...', colors.yellow);
      
      let waitTime = 0;
      const maxWait = 30000;
      while (!lavalinkReady && waitTime < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        waitTime += 1000;
        if (waitTime % 5000 === 0) {
          log(`Still waiting for Lavalink... (${waitTime/1000}s)`, colors.dim);
        }
      }
      
      if (lavalinkReady) {
        log('Lavalink initialization complete!', colors.green);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        log('Lavalink taking longer than expected, starting bot anyway...', colors.yellow);
      }
    }
  } else {
    log('No local Lavalink server configured', colors.yellow);
  }

  botProcess = startBot();

  log('All services started successfully!', colors.green);
  log('Bot is now running and ready to use', colors.bright);
  console.log('');
}

function shutdown() {
  console.log('');
  log('Shutting down all services...', colors.yellow);
  
  if (botProcess) {
    log('Stopping Discord bot...', colors.cyan);
    botProcess.kill();
  }
  
  if (lavalinkProcess) {
    log('Stopping Lavalink server...', colors.magenta);
    lavalinkProcess.kill();
  }
  
  log('Shutdown complete', colors.green);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, colors.red);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Promise Rejection`, colors.red);
  console.error('Reason:', reason);
});

main().catch((error) => {
  log(`Startup failed: ${error.message}`, colors.red);
  console.error(error.stack);
  process.exit(1);
});
