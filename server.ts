import express from "express";
import path from "path";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

export async function createServerApp() {
  const app = express();
  
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Google OAuth Configuration
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️ WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from environment variables.");
  }

  const getRedirectUri = (req?: express.Request) => {
    // Priority: APP_URL (AI Studio) > NEXTAUTH_URL (Vercel) > Request Host (Fallback)
    let baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL;
    
    if (!baseUrl && req) {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      baseUrl = `${protocol}://${req.get("host")}`;
    }
    
    baseUrl = baseUrl || "http://localhost:3000";
    // We'll use /auth/google/callback as the primary, but the server will listen to both
    const uri = `${baseUrl.replace(/\/$/, "")}/auth/google/callback`;
    console.log(`🔗 OAuth Redirect URI: ${uri}`);
    return uri;
  };

  // 1. Get Google Auth URL
  app.get("/api/auth/google/url", (req, res) => {
    console.log("📥 Request for Google Auth URL");
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("❌ Missing Google OAuth credentials in environment");
      return res.status(500).json({ 
        error: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in settings." 
      });
    }

    try {
      const redirectUri = getRedirectUri(req);
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
      });
      const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log("✅ Generated Auth URL:", url);
      res.json({ url });
    } catch (err) {
      console.error("❌ Error generating Auth URL:", err);
      res.status(500).json({ error: "Failed to generate authentication URL" });
    }
  });

  // 2. Google Auth Callback
  app.get([
    "/auth/google/callback", 
    "/auth/google/callback/",
    "/api/auth/callback/google",
    "/api/auth/callback/google/"
  ], async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
      const redirectUri = getRedirectUri(req);
      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json() as any;
      
      // Get user info
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userData = await userResponse.json() as any;

      // In a real app, you'd create a session here. 
      // For this demo, we'll just pass the user data back to the client via postMessage.
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(userData)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

async function startServer() {
  const PORT = 3000;
  const app = await createServerApp();

  console.log("🛠️ Environment Check:");
  console.log("- GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? `✅ Present (${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...)` : "❌ Missing");
  console.log("- GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✅ Present (Hidden)" : "❌ Missing");
  console.log("- APP_URL:", process.env.APP_URL || "❌ Not Set (Using fallback)");
  console.log("- NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "❌ Not Set");

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("💥 Failed to start server:", err);
  process.exit(1);
});
