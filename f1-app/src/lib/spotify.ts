// Spotify Web API & PKCE Authentication Integration for Radio F1

export interface SpotifyUser {
  id: string
  display_name: string
  email?: string
  images?: { url: string; height?: number; width?: number }[]
  product?: string
  uri: string
  external_urls?: { spotify: string }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description?: string
  images?: { url: string }[]
  uri: string
  tracks?: { total: number }
  external_urls?: { spotify: string }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string; id?: string }[]
  album?: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
  uri: string
  external_urls?: { spotify: string }
}

const STORAGE_KEYS = {
  TOKEN: "f1_spotify_access_token",
  REFRESH_TOKEN: "f1_spotify_refresh_token",
  EXPIRES_AT: "f1_spotify_expires_at",
  VERIFIER: "f1_spotify_code_verifier",
  CLIENT_ID: "f1_spotify_client_id",
  ACTIVE_URI: "f1_spotify_active_uri",
}

const DEFAULT_SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
].join(" ")

export function getStoredClientId(): string {
  if (typeof window === "undefined") return ""
  const envId = (import.meta as unknown as { env?: { VITE_SPOTIFY_CLIENT_ID?: string } }).env?.VITE_SPOTIFY_CLIENT_ID
  if (envId && envId.trim()) return envId.trim()
  return localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || ""
}

export function setStoredClientId(clientId: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId.trim())
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.TOKEN)
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
}

export function getStoredActiveUri(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_URI)
}

export function setStoredActiveUri(uri: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.ACTIVE_URI, uri)
}

export function clearSpotifySession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
  localStorage.removeItem(STORAGE_KEYS.VERIFIER)
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_URI)
}

function generateRandomString(length: number = 64): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join("")
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await window.crypto.subtle.digest("SHA-256", data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

export async function initiateSpotifyLogin(customClientId?: string): Promise<void> {
  if (typeof window === "undefined") return
  const clientId = customClientId || getStoredClientId()
  if (!clientId) {
    throw new Error("Spotify Client ID não configurado")
  }

  const verifier = generateRandomString(64)
  const challenge = await generateCodeChallenge(verifier)

  localStorage.setItem(STORAGE_KEYS.VERIFIER, verifier)
  if (customClientId) {
    setStoredClientId(customClientId)
  }

  const redirectUri = `${window.location.origin}${window.location.pathname}`
  const authUrl = new URL("https://accounts.spotify.com/authorize")
  authUrl.searchParams.append("client_id", clientId)
  authUrl.searchParams.append("response_type", "code")
  authUrl.searchParams.append("redirect_uri", redirectUri)
  authUrl.searchParams.append("code_challenge_method", "S256")
  authUrl.searchParams.append("code_challenge", challenge)
  authUrl.searchParams.append("scope", DEFAULT_SCOPES)
  authUrl.searchParams.append("state", "radio_f1_spotify")

  window.location.href = authUrl.toString()
}

export async function handleSpotifyCallback(): Promise<boolean> {
  if (typeof window === "undefined") return false
  const params = new URLSearchParams(window.location.search)
  const code = params.get("code")
  const error = params.get("error")

  if (error) {
    console.error("Spotify Auth error:", error)
    window.history.replaceState({}, document.title, window.location.pathname)
    return false
  }

  if (!code) return false

  const verifier = localStorage.getItem(STORAGE_KEYS.VERIFIER)
  const clientId = getStoredClientId()

  if (!verifier || !clientId) {
    console.warn("Verifier ou Client ID ausente no retorno do Spotify")
    return false
  }

  try {
    const redirectUri = `${window.location.origin}${window.location.pathname}`
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    })

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })

    const data = await response.json()
    if (data.access_token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token)
      if (data.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)
      }
      if (data.expires_in) {
        const expiresAt = Date.now() + data.expires_in * 1000
        localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt))
      }
      localStorage.removeItem(STORAGE_KEYS.VERIFIER)

      // Clean up query param from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname)
      return true
    } else {
      console.error("Erro na resposta do token do Spotify:", data)
      return false
    }
  } catch (err) {
    console.error("Falha ao trocar código por token do Spotify:", err)
    return false
  }
}

export async function refreshSpotifyToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const refreshToken = getStoredRefreshToken()
  const clientId = getStoredClientId()

  if (!refreshToken || !clientId) return null

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })

    const data = await response.json()
    if (data.access_token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token)
      if (data.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)
      }
      if (data.expires_in) {
        const expiresAt = Date.now() + data.expires_in * 1000
        localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt))
      }
      return data.access_token
    }
  } catch (err) {
    console.error("Erro ao renovar token Spotify:", err)
  }
  return null
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = getStoredToken()
  if (!token) return null

  const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || 0)
  // If expiring in less than 2 minutes, refresh it
  if (expiresAt && Date.now() > expiresAt - 120000) {
    return await refreshSpotifyToken()
  }

  return token
}

async function spotifyApiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  let token = await getValidAccessToken()
  if (!token) return null

  const url = endpoint.startsWith("http")
    ? endpoint
    : `https://api.spotify.com/v1${endpoint.startsWith("/") ? "" : "/"}${endpoint}`

  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (res.status === 401) {
    // Try refreshing token once
    token = await refreshSpotifyToken()
    if (token) {
      res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    }
  }

  if (!res.ok || res.status === 204) {
    return null
  }

  return (await res.json()) as T
}

export async function fetchSpotifyProfile(): Promise<SpotifyUser | null> {
  return await spotifyApiFetch<SpotifyUser>("/me")
}

export async function fetchUserPlaylists(limit: number = 20): Promise<SpotifyPlaylist[]> {
  const data = await spotifyApiFetch<{ items: SpotifyPlaylist[] }>(`/me/playlists?limit=${limit}`)
  return data?.items || []
}

export async function fetchUserTopTracks(limit: number = 20): Promise<SpotifyTrack[]> {
  const data = await spotifyApiFetch<{ items: SpotifyTrack[] }>(`/me/top/tracks?limit=${limit}&time_range=medium_term`)
  return data?.items || []
}

export async function fetchUserRecentlyPlayed(limit: number = 20): Promise<SpotifyTrack[]> {
  const data = await spotifyApiFetch<{ items: { track: SpotifyTrack }[] }>(`/me/player/recently-played?limit=${limit}`)
  return data?.items?.map((item) => item.track) || []
}

export function parseSpotifyUriOrUrl(input: string): { type: "playlist" | "track" | "album" | "artist" | null; id: string | null; embedUrl: string } {
  const trimmed = input.trim()
  if (!trimmed) {
    const defaultId = "1gH4FFUMWSI98MKPeBaa8x"
    return {
      type: "playlist",
      id: defaultId,
      embedUrl: `https://open.spotify.com/embed/playlist/${defaultId}?utm_source=generator&theme=0`,
    }
  }

  // Handle spotify URI: spotify:playlist:1gH4FFUMWSI98MKPeBaa8x
  if (trimmed.startsWith("spotify:")) {
    const parts = trimmed.split(":")
    const type = parts[1] as "playlist" | "track" | "album" | "artist"
    const id = parts[2]
    return {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    }
  }

  // Handle open.spotify.com URL
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
    const segments = url.pathname.split("/").filter(Boolean)
    const typeIdx = segments.findIndex((s) => ["playlist", "track", "album", "artist"].includes(s))
    if (typeIdx !== -1 && segments[typeIdx + 1]) {
      const type = segments[typeIdx] as "playlist" | "track" | "album" | "artist"
      const id = segments[typeIdx + 1]
      return {
        type,
        id,
        embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
      }
    }
  } catch {
    // ignore parse error
  }

  // Fallback as playlist ID if it looks like an alphanumeric ID
  if (/^[a-zA-Z0-9]{16,30}$/.test(trimmed)) {
    return {
      type: "playlist",
      id: trimmed,
      embedUrl: `https://open.spotify.com/embed/playlist/${trimmed}?utm_source=generator&theme=0`,
    }
  }

  const defaultId = "1gH4FFUMWSI98MKPeBaa8x"
  return {
    type: "playlist",
    id: defaultId,
    embedUrl: `https://open.spotify.com/embed/playlist/${defaultId}?utm_source=generator&theme=0`,
  }
}
