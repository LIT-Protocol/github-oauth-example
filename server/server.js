import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SERVER_PORT = process.env.SERVER_PORT || 3001;

app.post("/api/github/token", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    console.error("No code provided in request");
    return res.status(400).json({ error: "Code is required" });
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Missing environment variables:", {
      clientId: !!CLIENT_ID,
      clientSecret: !!CLIENT_SECRET,
    });
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    console.log("Attempting to exchange code for token...");
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
        }),
      }
    );

    if (!response.ok) {
      console.error("GitHub API error:", {
        status: response.status,
        statusText: response.statusText,
      });
      return res.status(response.status).json({
        error: `GitHub API error: ${response.statusText}`,
      });
    }

    const data = await response.json();
    console.log("Token exchange response received", {
      hasAccessToken: !!data.access_token,
      hasError: !!data.error,
    });

    if (data.error) {
      console.error("GitHub OAuth error:", data);
      return res.status(400).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Server error during token exchange:", error);
    res.status(500).json({
      error: "Failed to exchange code for token",
      details: error.message,
    });
  }
});

app.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
  console.log("Environment check:", {
    clientIdSet: !!CLIENT_ID,
    clientSecretSet: !!CLIENT_SECRET,
  });
});
