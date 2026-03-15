import { createServerApp } from "../server";

let cachedApp: any;

export default async (req: any, res: any) => {
  try {
    if (!cachedApp) {
      cachedApp = await createServerApp();
    }
    return cachedApp(req, res);
  } catch (err) {
    console.error("🔥 Vercel Function Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err instanceof Error ? err.message : String(err) 
    });
  }
};
