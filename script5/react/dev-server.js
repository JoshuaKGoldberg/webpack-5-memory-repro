const {
  startChildProcess,
  stopAllChildProcesses,
  formatStdout,
  formatStderr,
  COLORS,
} = require("./utilities");

const yargs = require("yargs");

/**
 * Note: this is a temporary set up for running or SSR set up locally.
 * We've opted for a fairly simple solution that should be replaced by a more
 * complete solution at the earliest conveneince.
 *
 * If you have plans to add to this, please consider a solution to move toward a single
 * webpack process and single point of entry at the server level.
 */

const DEFAULT_OPTIONS = {
  // Pipes messages to parent so we can show the message's origin.
  stdio: "pipe",
  silent: true,
};

const { argv } = yargs(process.argv.slice(2)).options({
  inlineStyles: {
    type: "boolean",
    description:
      "Will switch from extracted stylesheets to inline-injected styles. This produces much faster and more consistent hot-reloading results for styles, but is less accurate compared to prod.",
  },
  hotOnly: {
    type: "boolean",
    description:
      "This will only apply hot module replacement (HMR) and NEVER refresh the page when code changes.",
  },
  forceRefresh: {
    type: "boolean",
    description: "This will ALWAYS refresh the page when code changes (i.e. HMR is disabled)",
  },
});

console.log(COLORS.info, " Starting Dev Server: ");
console.log(COLORS.info, " Use --help to view options ");

const env = {
  NODE_ENV: "development",
  DEV_SERVER: true,
  DEV_SERVER_HOST: "http://localhost:3808",
};

if (argv.inlineStyles) {
  console.log(
    "🖌️  Running in react-refresh compatibility mode. (Will inject styles inline instead of extracting) 🖌️"
  );
  env.USE_INLINE_STYLES = true;
}

// Print hot-reloading mode (hot, hot-only, or forceRefresh)
if (argv.forceRefresh) {
  console.log(
    "🔥 Running webpack-dev-server in 'force refresh' mode. (Will NOT try HMR and ALWAYS refresh page) 🔥"
  );
} else if (argv.hotOnly) {
  console.log(
    "🔥 Running webpack-dev-server in 'hot-only' mode. (Will try HMR and NOT refresh page) 🔥"
  );
} else {
  console.log(
    "🔥 Running webpack-dev-server in 'hot' mode. (Will try HMR and refresh on failure) 🔥"
  );
}

const getWebpackDevServerHMRArg = () => {
  if (argv.forceRefresh) {
    return undefined; // webpack-dev-server defaults to refresh on change.
  } else if (argv.hotOnly) {
    return "--hot-only";
  } else {
    return "--hot";
  }
};

const bundlers = {
  client: {
    id: "client",
    name: "Client Bundle",
    path: "./script5/react/app-bundler.js",
    args: ["--config=./script5/webpack/app.config.js", getWebpackDevServerHMRArg()],
    options: {
      env,
      ...DEFAULT_OPTIONS,
    },
    color: COLORS.purple,
    logErrors: true,
  },
};

const activeProcesses = {};

// Clean up child processes on interruption and propagate a default SIGTERM to let webpack clean up after itself.
process.on("exit", (code) => {
  console.log("Stopping active processes...");
  stopAllChildProcesses(activeProcesses);
});
process.on("SIGINT", () => {
  console.log("\nExiting...");
  process.exit(0);
});

const startBundler = (bundler) => {
  const logger = formatStdout(bundler);
  const errorLogger = formatStderr(bundler);
  const task = startChildProcess(bundler, {
    execArgv: ["--max-old-space-size=4096"],
  });
  logger("Starting...");

  if (task.stdout) {
    task.stdout.on("data", logger);
  }
  if (task.stderr) {
    task.stderr.on("data", errorLogger);
  }

  // Restart express after server bundler has recompiled
  task.on("message", ({ type }) => {
    // Only the SSR bundle process sends this message
    if (type === "recompile") {
      if (activeProcesses.express) {
        activeProcesses.express.logger("Restarting");
        activeProcesses.express.task.kill();
      }
      startBundler(bundlers.express);
    }
  });

  activeProcesses[bundler.id] = {
    task,
    logger,
    errorLogger,
  };
};

startBundler(bundlers.client);
