import "./style.css";
import { getToken } from "./spotifyAuth.js";

const accessToken = await getToken();

const profile = await fetchProfile(accessToken);
const topArtists = await fetchTopArtists(accessToken, "long_term");
const topTracks = await fetchTopTracks(accessToken, "short_term");

console.log(profile);
console.log(profile.id);
console.log(topArtists);
console.log(topTracks);

await sendUserToServer(profile, topArtists, topTracks);

const userA = await fetchUserFromServer(profile.id);
var userB = undefined;

if (userA) {
  populateUser("userA", userA);
}

document.getElementById("searchBtn").addEventListener("click", async () => {
  console.log("Search User Clicked");

  // grab url from input box
  const input = document.querySelector(".search-input");
  const profileUrl = input.value.trim();

  if (!profileUrl) {
    console.warn("No Url entered");
    return;
  }

  // strip spotify id #
  const match = profileUrl.match(/user\/([a-zA-Z0-9]+)/);
  if (!match) {
    console.error("Invalid spotify URL");
    return;
  }

  // Query DB
  const userId = match[1];
  console.log("Parsed ID: ", userId);
  userB = await fetchUserFromServer(userId);

  if (!userB) {
    console.warn("User not found on server!");
    return;
  }
  populateUser("userB", userB);
  populateLoveScore();
});

async function populateLoveScore() {
  const loveObj = await getLoveScoreFromServer(userA, userB);

  const root = document.getElementById("comp-card");
  root.querySelector(".loveScore").innerText = loveObj.score;
  root.querySelector(".loveGenre").innerText = loveObj.genre;
  root.querySelector(".loveArtists").innerText = loveObj.artists;
  root.querySelector(".loveAnthem").innerText = loveObj.anthem;
  return;
}

async function fetchProfile(token) {
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return await result.json();
}

async function fetchTopArtists(token, term_length) {
  const result = await fetch(
    `https://api.spotify.com/v1/me/top/artists?time_range=${term_length}&limit=50&offset=0`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return await result.json();
}

async function fetchTopTracks(token, term_length) {
  const result = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?time_range=${term_length}&limit=10&offset=0`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return await result.json();
}

async function getLoveScoreFromServer(idA, idB) {
  try {
    const res = await fetch(`http://127.0.0.1:3001/api/get-love-score/${idA}/${idB}`);
    if (!res.ok) throw new Error("User(s)? not found");
    const data = await res.json();
    console.log("Love data:", data);
    return data;
  } catch (err) {
    console.error("Error:", err);
    return null;
  }
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
    return data;
  } catch (err) {
    console.error("Error:", err);
    return null;
  }
}

function populateUser(containerId, userDocument) {
  const root = document.getElementById(containerId);
  const nameLink = root.querySelector(".displayName");
  nameLink.innerText = userDocument.username ?? "#";
  nameLink.setAttribute("href", userDocument.profileUrl);

  if (userDocument.profilePic) {
    const profileImage = new Image(200, 200);
    profileImage.src = userDocument.profilePic;
    root.querySelector(".avatar").appendChild(profileImage);
  }

  root.querySelector(".topArtists").innerHTML = (userDocument.topArtists ?? [])
    .slice(0, 10)
    .map((a) => `<li>${a.name}</li>`)
    .join("");

  root.querySelector(".topTracks").innerHTML = (userDocument.topTracks ?? [])
    .slice(0, 10)
    .map((t) => {
      const title = t.name.length > 40 ? t.name.slice(0, 25) + "…" : t.name;
      const artist = t.artists?.[0]?.name ?? "Unknown Artist";
      return `<li>${title} - ${artist}</li>`;
    })
    .join("");

  root.querySelector(".topGenres").innerHTML = (userDocument.topGenres ?? [])
    .slice(0, 10)
    .map((g) => `<li>${g}</li>`)
    .join("");
}
