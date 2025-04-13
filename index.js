const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_TOKEN = process.env.INSTAGRAM_TOKEN;
const REDIRECT_URI = "https://9a74-110-226-178-105.ngrok-free.app/auth/instagram/callback";
const FRONTEND_URL = process.env.FRONTEND_URL; // Update this to your frontend URL

const usersTokenMapper = {

}


app.get("/auth/instagram", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // 👉 Handle webhook verification request from Facebook
  if (mode && token) {
    if (mode === "subscribe" && token === process.env.INSTAGRAM_TOKEN) {
      console.log("✅ Webhook verified!");
      return res.status(200).send(challenge);
    } else {
      console.log("❌ Webhook verification failed.");
      return res.sendStatus(403);
    }
  }

  // 👉 If not a webhook verification, proceed with Instagram OAuth redirect
  console.log(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const authUrl = `https://api.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;

  console.log("Redirecting to Instagram auth URL:", authUrl);
  res.redirect(authUrl);
});

// Step 2: Handle callback and exchange code for access token
app.get("/auth/instagram/callback", async (req, res) => {
  const { code } = req.query;
  console.log("debug code", code);
  try {
    const response = await axios.post('https://api.instagram.com/oauth/access_token', 
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code: code,
      }), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Ensure the content type is set to URL encoded form data
        }
      }
    );

    const { access_token, user_id } = response.data;
    usersTokenMapper[user_id] = access_token
    res.redirect(`${FRONTEND_URL}/dashboard/profile?user_id=${user_id}`);
  }
  catch(error){
    console.error("Error exchanging code for access token:", error.response ? error.response.data : error.message);
    res.status(500).send("Error during authentication");
  }
});

// 1️⃣ Get Instagram Profile Details
app.get("/instagram/profile", async (req, res) => {
  const userId = req.headers["user_id"];
  const accessToken = usersTokenMapper[userId];

  if (!accessToken) return res.status(401).json({ error: "Invalid or missing access token" });

  try {
    const response = await axios.get(`https://graph.instagram.com/me`, {
      params: {
        fields: "id,username,account_type,media_count,name,profile_picture_url,biography,website,followers_count,follows_count",
        access_token: accessToken
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching profile:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});


// 2️⃣ Get Instagram User Feeds (Media)
app.get("/instagram/feeds", async (req, res) => {
  const userId = req.headers["user_id"];
  const accessToken = usersTokenMapper[userId];

  if (!accessToken) {
    return res.status(401).json({ error: "Invalid or missing access token" });
  }

  try {
    // Step 1: Fetch user's media
    const mediaRes = await axios.get(`https://graph.instagram.com/me/media`, {
      params: {
        fields: [
          "id",
          "caption",
          "media_type",
          "media_url",
          "timestamp",
          "permalink",
          "thumbnail_url",
          "children{media_type,media_url,thumbnail_url}",
          "comments_count",
          "like_count",
          "username"
        ].join(","),
        access_token: accessToken
      }
    });

    const mediaData = mediaRes.data.data;

    // Step 2: For each media, fetch the comments
    const enrichedMedia = await Promise.all(
      mediaData.map(async (media) => {
        try {
          const commentRes = await axios.get(`https://graph.instagram.com/${media.id}/comments`, {
            params: {
              fields: "id,text,username,timestamp,like_count",
              access_token: accessToken
            }
          });
          console.log(commentRes.data, "these are the comments", commentRes.data.message);
          return {
            ...media,
            comments: commentRes.data.data || []
          };
        } catch (err) {
          console.warn(`Error fetching comments for media ID ${media.id}:`, err.response?.data || err.message);
          return {
            ...media,
            comments: []
          };
        }
      })
    );

    res.json({ data: enrichedMedia });
  } catch (error) {
    console.error("Error fetching feeds:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch user feeds with comments" });
  }
});




// 3️⃣ Post a Comment to a Feed
app.post("/instagram/comment", express.json(), async (req, res) => {
  const userId = req.headers["user_id"];
  const accessToken = usersTokenMapper[userId];
  const { mediaId, message } = req.body;

  if (!accessToken) return res.status(401).json({ error: "Invalid or missing access token" });
  if (!mediaId || !message) return res.status(400).json({ error: "Missing mediaId or message" });

  try {
    const response = await axios.post(
      `https://graph.instagram.com/v22.0/${mediaId}/comments`,
      new URLSearchParams({
        message,
        access_token: accessToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    res.json({ success: true, comment_id: response.data.id });
  } catch (error) {
    console.error("Error posting comment:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

app.post("/instagram/reply", express.json(), async (req, res) => {
  const userId = req.headers["user_id"];
  const accessToken = usersTokenMapper[userId];
  const { commentId, message } = req.body;

  if (!accessToken) return res.status(401).json({ error: "Invalid or missing access token" });
  if (!commentId || !message) return res.status(400).json({ error: "Missing commentId or message" });

  try {
    const response = await axios.post(
      `https://graph.instagram.com/v22.0/${commentId}/replies`,
      new URLSearchParams({
        message,
        access_token: accessToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    res.json({ success: true, reply_id: response.data.id });
  } catch (error) {
    console.error("Error replying to comment:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to reply to comment" });
  }
});

app.get("/instagram/authenticateSession", (req, res) => {
  const userId = req.headers["user_id"];
  const accessToken = usersTokenMapper[userId];


  if (!accessToken) return res.status(401).json({ error: "Invalid or missing access token" });
  return res.status(200).json({ message: "user Authenticated" });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
