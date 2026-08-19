export const logger = {
  info: (message: string, data?: any) => {
    console.error(
      `[INFO] ${new Date().toISOString()} - ${message}`,
      data !== undefined ? JSON.stringify(data) : ""
    );
  },
  error: (message: string, error?: any) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error !== undefined ? (error instanceof Error ? error.message : error) : ""
    );
  },
  warn: (message: string, data?: any) => {
    console.error(
      `[WARN] ${new Date().toISOString()} - ${message}`,
      data !== undefined ? JSON.stringify(data) : ""
    );
  },
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG === "true") {
      console.error(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        data !== undefined ? JSON.stringify(data) : ""
      );
    }
  },
};
