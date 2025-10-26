import "./style.css";
import { getToken } from "./spotifyAuth.js";

const accessToken = await getToken();

const profile = await fetchProfile(accessToken);
const topArtists = await fetchTopArtists(accessToken);
const topTracks = await fetchTopTracks(accessToken);

console.log(profile);
console.log(profile.id);
console.log(topArtists);
console.log(topTracks);

await sendUserToServer(profile, topArtists, topTracks);
const userDoc = await fetchUserFromServer(profile.id);

if (userDoc) {
  populateUser("userA", userDoc);
  populateUser("userB", userDoc);
}

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
    .map((a) => `<li>${a.name}</li>`)
    .join("");

  root.querySelector(".topTracks").innerHTML = (userDocument.topTracks ?? [])
    .map((t) => `<li>${t.name}</li>`)
    .join("");

  root.querySelector(".topGenres").innerHTML = (userDocument.topGenres ?? [])
    .map((g) => `<li>${g}</li>`)
    .join("");
}
