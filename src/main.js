import "./style.css";
import { getToken } from "./spotifyAuth.js";

const accessToken = await getToken();

const profile = await fetchProfile(accessToken);
const topArtists = await fetchTopArtists(accessToken);
const topTracks = await fetchTopTracks(accessToken);

console.log(profile);
console.log(topArtists);
console.log(topTracks);

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
  //document.getElementById("topGenres")
}
