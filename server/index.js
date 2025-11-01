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
app.use(express.json({ limit: "64mb" }));

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

app.post("/api/get-love-score", async (req, res) => {
  try {
    const { userA, userB } = req.body || {};

    if (!userA || !userB) {
      return res.status(400).json({ error: "Missing user docs" });
    }

    const loveObj = calculateLoveScore(userA, userB);
    console.log("Got POST /api/get-love-score ✅");
    return res.json(loveObj);
  } catch (err) {
    console.error("Error Calculating Love Score:", err);
    res.status(500).json({ error: "FAILED" });
  }
});

export async function insertUser(profile, topArtists, topTracks) {
  const docRef = db.collection("users").doc(profile.id);

  const artists = topArtists.items.map((artist) => ({
    name: artist.name,
    genres: artist.genres,
  }));

  const tracks = topTracks.items.map((track) => ({
    title: track.name,
    artist: track.artists?.[0]?.name ?? "Unknown Artists",
  }));

  await docRef.set({
    username: profile.display_name,
    profileUrl: profile.external_urls.spotify,
    profilePic: profile.images[0].url,
    topArtists: artists,
    topTracks: tracks,
    topGenres: determineTopGenres(artists),
  });
}

function determineTopGenres(topArtists) {
  const genreMap = new Map();

  for (const artist of topArtists) {
    for (const genre of artist.genres) {
      if (genreMap.has(genre)) {
        genreMap.set(genre, genreMap.get(genre) + 1);
      } else {
        genreMap.set(genre, 1);
      }
    }
  }

  // Convert map to an array and sort by frequency (descending)
  const sortedGenres = Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([genre]) => genre);

  return sortedGenres;
}

async function getUser(userId) {
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

function calculateLoveScore(userA, userB) {
  const loveGenre =
    (userA?.topGenres ?? []).find((g) => (userB?.topGenres ?? []).includes(g)) ??
    "No Love Genre :(";

  const loveAnthem =
    (userA?.topTracks ?? []).find((g) => (userB?.topTracks ?? []).includes(g)) ??
    "No Love Anthem :(";

  const artistsA = new Set((userA?.topArtists ?? []).map((a) => a.name));
  const artistsB = new Set((userB?.topArtists ?? []).map((a) => a.name));

  //compute intersect
  const mutualArtists = [...artistsA].filter((name) => artistsB.has(name));

  var loveObj = {
    score: 69,
    genre: loveGenre,
    artists: mutualArtists.length > 0 ? mutualArtists.join(", ") : "No Mutual Artists :(",
    anthem: loveAnthem,
  };
  return loveObj;
}
