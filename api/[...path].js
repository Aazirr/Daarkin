let app;

// Dynamically import the ESM app module
async function initializeApp() {
  if (!app) {
    const { default: expressApp } = await import("../apps/api/src/app.js");
    app = expressApp;
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    const expressApp = await initializeApp();
    // Pass the request directly to the Express app
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
