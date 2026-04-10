function formatDetails(details) {
  if (details === undefined || details === null || details === "") {
    return "";
  }

  if (typeof details === "string") {
    return ` ${details}`;
  }

  return ` ${JSON.stringify(details)}`;
}

function write(level, scope, message, details) {
  const timestamp = new Date().toISOString();
  const suffix = formatDetails(details);

  console[level](`[${timestamp}] [${scope}] ${message}${suffix}`);
}

export function createLogger(scope) {
  return {
    info(message, details) {
      write("log", scope, message, details);
    },
    warn(message, details) {
      write("warn", scope, message, details);
    },
    error(message, details) {
      write("error", scope, message, details);
    },
  };
}