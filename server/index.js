import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "node:module";

dotenv.config();
const require = createRequire(import.meta.url);
const serviceAccount = require("../keys/serviceAccountKey.json");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

app.post("/api/insert-user", async (req, res) => {
  try {
    const { profile, topArtists, topTracks } = req.body;
    await insertUser(profile, topArtists, topTracks);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert user" });
  }
});

app.get("/api/get-user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const data = await getUser(userId);

    if (!data) return res.status(404).json({ error: "User not found" });

    res.json(data);
  } catch (err) {
    console.error("Error getting user:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

export async function insertUser(profile, topArtists, topTracks) {
  const docRef = db.collection("users").doc(profile.id);
  await docRef.set({
    username: profile.display_name,
    profileUrl: profile.external_urls.spotify,
    profilePic: profile.images[0].url,
    topArtists: topArtists.items,
    topTracks: topTracks.items,
  });
}

export async function getUser(userId) {
  const userRef = db.collection("users").doc(userId);
  const doc = await userRef.get();
  if (!doc.exists) {
    console.log("User Does Not Exist!");
    return null;
  } else {
    console.log("User Found!");
    return doc.data();
  }
}
