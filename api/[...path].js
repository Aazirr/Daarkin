let app;

// Dynamically import the ESM app module
async function initializeApp() {
  if (!app) {
    try {
      const module = await import("../apps/api/src/app.js");
      app = module.default;
    } catch (error) {
      console.error("Failed to import app:", error);
      throw error;
    }
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    const expressApp = await initializeApp();
    // Call the Express app as middleware
    expressApp(req, res);
  } catch (error) {
    console.error("Error initializing app:", error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to initialize API server",
        details: error.message,
      },
      meta: null,
    });
  }
};
