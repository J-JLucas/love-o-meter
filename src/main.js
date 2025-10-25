import "./style.css";
import { getToken } from "./spotifyAuth.js";

const accessToken = await getToken();

const profile = await fetchProfile(accessToken);
const topArtists = await fetchTopArtists(accessToken);
const topTracks = await fetchTopTracks(accessToken);
const topGenres = getTopGenres(topArtists);

console.log(profile);
console.log(profile.id);
console.log(topArtists);
console.log(topTracks);
console.log(topGenres);

sendUserToServer(profile, topArtists, topTracks);
fetchUserFromServer(profile.id);
populateUI(profile, topArtists, topTracks);

async function fetchProfile(token) {
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return await result.json();
}

async function fetchTopArtists(token) {
  const result = await fetch(
    "https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=10&offset=0",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return await result.json();
}

async function fetchTopTracks(token) {
  const result = await fetch(
    "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10&offset=0",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return await result.json();
}

function getTopGenres(topArtists) {
  const genreMap = new Map();

  for (const artist of topArtists.items) {
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
    .slice(0, 10);

  return sortedGenres;
}

async function sendUserToServer(profile, topArtists, topTracks) {
  try {
    const res = await fetch("http://127.0.0.1:3001/api/insert-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, topArtists, topTracks }),
    });

    const data = await res.json();
    console.log("Server Response:", data);
  } catch (err) {
    console.error("Error sending user data:", err);
  }
}

async function fetchUserFromServer(userId) {
  try {
    const res = await fetch(`http://127.0.0.1:3001/api/get-user/${userId}`);
    if (!res.ok) throw new Error("User not found");
    const data = await res.json();
    console.log("User data:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

function populateUI(profile, topArtists, topTracks) {
  document.getElementById("displayName").innerText = profile.display_name;
  document.getElementById("displayName").setAttribute("href", profile.external_urls.spotify);
  if (profile.images[0]) {
    const profileImage = new Image(200, 200);
    profileImage.src = profile.images[0].url;
    document.getElementById("avatar").appendChild(profileImage);
  }

  //document.getElementById("topArtists").innerText = topArtists.
  document.getElementById("topArtists").innerHTML = topArtists.items
    .map((a) => `<li>${a.name}</li>`)
    .join("");

  document.getElementById("topTracks").innerHTML = topTracks.items
    .map((a) => `<li>${a.name}</li>`)
    .join("");

  document.getElementById("topGenres").innerHTML = topGenres
    .map(([g, _count]) => `<li>${g}</li>`)
    .join("");
}
