import { useState, useEffect, useRef, useCallback } from "react"
import {
  Radio,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Disc3,
  LogIn,
  LogOut,
  Settings,
  ListMusic,
  Flame,
  Link as LinkIcon,
  Check,
  Copy,
  X,
  Eye,
  EyeOff,
} from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"
import type {
  SpotifyUser,
  SpotifyPlaylist,
  SpotifyTrack,
} from "@/lib/spotify"
import {
  getStoredClientId,
  setStoredClientId,
  getStoredToken,
  getStoredActiveUri,
  setStoredActiveUri,
  clearSpotifySession,
  initiateSpotifyLogin,
  handleSpotifyCallback,
  fetchSpotifyProfile,
  fetchUserPlaylists,
  fetchUserTopTracks,
  parseSpotifyUriOrUrl,
  bindSpotifySessionOwner,
  getSpotifyPrivacyMode,
  setSpotifyPrivacyMode,
} from "@/lib/spotify"

const OFFICIAL_F1_PLAYLIST_ID = "1gH4FFUMWSI98MKPeBaa8x"
const DEFAULT_EMBED_URL = `https://open.spotify.com/embed/playlist/${OFFICIAL_F1_PLAYLIST_ID}?utm_source=generator&theme=0`

export interface RadioVoice {
  id: string
  name: string
  shortName: string
  title: string
  tag: string
  avatar: string
  badgeColor: string
  flag: string
  quote: string
}

export const RADIO_VOICES: RadioVoice[] = [
  {
    id: "thalita",
    name: "Mariana",
    shortName: "Mariana",
    title: "Locutora Oficial da Rádio F1",
    tag: "Voz Oficial",
    avatar: "/radio/logo.png",
    badgeColor: "#E10600",
    flag: "🎙️",
    quote: "A voz humana e oficial do paddock: calor, dinamismo e velocidade.",
  },
]

function SpotifyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.216.353-.675.467-1.028.25-2.817-1.722-6.363-2.112-10.54-1.157-.403.092-.806-.157-.898-.56-.092-.403.157-.806.56-.898 4.568-1.044 8.487-.6 11.656 1.337.353.217.467.675.25 1.028zm1.468-3.262c-.272.443-.852.584-1.295.312-3.225-1.982-8.142-2.556-11.957-1.398-.499.151-1.031-.133-1.182-.632-.151-.499.133-1.031.632-1.182 4.364-1.325 9.789-.684 13.49 1.593.443.272.584.852.312 1.307zm.126-3.411C15.234 8.358 8.878 8.147 5.167 9.274c-.604.183-1.246-.168-1.429-.772-.183-.604.168-1.246.772-1.429 4.264-1.295 11.282-1.054 15.733 1.59.544.323.725 1.028.402 1.572-.323.544-1.028.725-1.572.402z" />
    </svg>
  )
}

function playRadioChirp(type: "start" | "end" = "start") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    if (type === "start") {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.setValueAtTime(1175, now + 0.07)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.18)
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(650, now)
      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.1)
    }
  } catch {
    // Ignore audio context autoplay policy blocks
  }
}

export function RadioPlayer() {
  const { series, token, user: appUser } = useAppStore()
  const [mode, setMode] = useState<"news" | "music">("news")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [scriptSummary, setScriptSummary] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMusicExpanded, setIsMusicExpanded] = useState(false)
  const selectedVoice = "thalita"

  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768
    }
    return false
  })
  const [bgMusicEnabled, setBgMusicEnabled] = useState(true)
  const [bgMusicVolume, setBgMusicVolume] = useState(0.035)

  // Spotify state
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null)
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([])
  const [spotifyTopTracks, setSpotifyTopTracks] = useState<SpotifyTrack[]>([])
  const [isSpotifyLoading, setIsSpotifyLoading] = useState(false)
  const [spotifyPrivate, setSpotifyPrivate] = useState<boolean>(() => getSpotifyPrivacyMode())
  const spotifyDisplayName = spotifyPrivate ? "Spotify Privado" : spotifyUser?.display_name || "Spotify"
  const toggleSpotifyPrivacy = () => {
    setSpotifyPrivate((prev) => {
      setSpotifyPrivacyMode(!prev)
      return !prev
    })
  }
  const [musicSubTab, setMusicSubTab] = useState<"playlists" | "top" | "official" | "custom">("official")
  const [activeMediaTitle, setActiveMediaTitle] = useState<string>("F1 Tracks 2026")
  const [activeMediaSubtitle, setActiveMediaSubtitle] = useState<string>("Playlist oficial da F1")
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string>(() => {
    const saved = getStoredActiveUri()
    if (saved) {
      return parseSpotifyUriOrUrl(saved).embedUrl
    }
    return DEFAULT_EMBED_URL
  })
  const [customUrlInput, setCustomUrlInput] = useState("")

  // Client ID Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [clientIdInput, setClientIdInput] = useState("")
  const [copiedRedirect, setCopiedRedirect] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null)

  const currentVoice = RADIO_VOICES.find((v) => v.id === selectedVoice) || RADIO_VOICES[0]

  // Load Spotify user profile and playlists
  const loadSpotifyUserData = useCallback(async () => {
    const token = getStoredToken()
    if (!token) return
    setIsSpotifyLoading(true)
    try {
      const user = await fetchSpotifyProfile()
      if (user) {
        setSpotifyUser(user)
        setMusicSubTab("playlists")
        const [playlists, topTracks] = await Promise.all([
          fetchUserPlaylists(15),
          fetchUserTopTracks(15),
        ])
        setSpotifyPlaylists(playlists)
        setSpotifyTopTracks(topTracks)
      } else {
        setSpotifyUser(null)
      }
    } catch (err) {
      console.warn("Falha ao carregar dados do Spotify:", err)
    } finally {
      setIsSpotifyLoading(false)
    }
  }, [])

  // Isola a sessao do Spotify por usuario do app: se outra conta logar
  // neste navegador, a sessao anterior e descartada imediatamente.
  const ownerId = appUser?.id != null ? `user:${appUser.id}` : "guest"
  useEffect(() => {
    if (bindSpotifySessionOwner(ownerId)) {
      setSpotifyUser(null)
      setSpotifyPlaylists([])
      setSpotifyTopTracks([])
      setMusicSubTab("official")
    }
  }, [ownerId])

  // Check OAuth callback or existing token on mount
  useEffect(() => {
    const initSpotify = async () => {
      if (typeof window === "undefined") return
      const params = new URLSearchParams(window.location.search)
      if (params.get("code")) {
        setIsSpotifyLoading(true)
        setMode("music")
        setIsMusicExpanded(true)
        const ok = await handleSpotifyCallback()
        if (ok) {
          await loadSpotifyUserData()
        }
        setIsSpotifyLoading(false)
      } else if (getStoredToken()) {
        loadSpotifyUserData()
      }
    }
    initSpotify()
  }, [loadSpotifyUserData])

  const handleBgVolumeChange = (newVolume: number) => {
    setBgMusicVolume(newVolume)
    if (bgAudioRef.current && !isMuted) {
      bgAudioRef.current.volume = newVolume
    }
  }

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (bgAudioRef.current) {
      bgAudioRef.current.pause()
      bgAudioRef.current.currentTime = 0
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  useEffect(() => {
    stopAudio()
    setScriptSummary("")
  }, [series, stopAudio])

  const radioName =
    {
      f1: "Rádio F1",
      f2: "Rádio F2",
      f3: "Rádio F3",
    }[series] || "Rádio F1"

  const radioSubtitle =
    {
      f1: "Boletim Oficial do Paddock",
      f2: "Fórmula 2: O Caminho para a Glória",
      f3: "Fórmula 3: Os Talentos do Futuro",
    }[series] || "Notícias"

  const playAudio = async (overrideVoice?: string) => {
    const voiceToUse = overrideVoice || selectedVoice

    if (isPlaying && !overrideVoice) {
      stopAudio()
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setIsLoading(true)
    setErrorMessage(null)
    playRadioChirp("start")

    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      let script = ""
      let serverAudioUrl = ""
      try {
        const res = await fetch(`/api/v1/news/bulletin?series=${series}&voice=${voiceToUse}`, { headers })
        if (res.ok) {
          const data = await res.json()
          script = data?.script || ""
          serverAudioUrl = data?.audio_url || ""
          if (script) {
            setScriptSummary(script)
          }
        }
      } catch (err) {
        console.warn("Não foi possível pré-carregar texto:", err)
      }

      if (serverAudioUrl) {
        const audio = new Audio(serverAudioUrl)
        audioRef.current = audio
        audio.volume = isMuted ? 0 : 1

        audio.onended = () => {
          if (bgAudioRef.current) {
            bgAudioRef.current.pause()
            bgAudioRef.current.currentTime = 0
          }
          playRadioChirp("end")
          setIsPlaying(false)
        }

        audio.onerror = () => {
          fallbackSpeech(script)
        }

        if (bgMusicEnabled) {
          if (!bgAudioRef.current) {
            bgAudioRef.current = new Audio("/radio/f1_theme.mp3")
            bgAudioRef.current.loop = true
          }
          bgAudioRef.current.volume = isMuted ? 0 : bgMusicVolume
          bgAudioRef.current.play().catch(() => {})
        }

        await audio.play()
        setIsLoading(false)
        setIsPlaying(true)
      } else {
        fallbackSpeech(script)
      }
    } catch (err) {
      console.error("Erro na Rádio F1:", err)
      if (bgAudioRef.current) {
        bgAudioRef.current.pause()
      }
      setErrorMessage("Erro ao reproduzir rádio")
      setTimeout(() => setErrorMessage(null), 4000)
      setIsLoading(false)
      setIsPlaying(false)
    }
  }

  const fallbackSpeech = (script: string) => {
    if (script && typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(script)
      utterance.lang = "pt-BR"
      utterance.volume = isMuted ? 0 : 1
      utterance.onend = () => {
        if (bgAudioRef.current) {
          bgAudioRef.current.pause()
          bgAudioRef.current.currentTime = 0
        }
        playRadioChirp("end")
        setIsPlaying(false)
      }
      utterance.onerror = () => {
        if (bgAudioRef.current) {
          bgAudioRef.current.pause()
        }
        setIsPlaying(false)
      }
      window.speechSynthesis.speak(utterance)
      setIsLoading(false)
      setIsPlaying(true)
    } else {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause()
      }
      setErrorMessage("Erro ao reproduzir áudio")
      setTimeout(() => setErrorMessage(null), 4000)
      setIsLoading(false)
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    if (audioRef.current) {
      audioRef.current.muted = nextMuted
      audioRef.current.volume = nextMuted ? 0 : 1
    }
    if (bgAudioRef.current) {
      bgAudioRef.current.muted = nextMuted
      bgAudioRef.current.volume = nextMuted ? 0 : bgMusicVolume
    }
  }

  const toggleBgMusic = () => {
    const next = !bgMusicEnabled
    setBgMusicEnabled(next)
    if (bgAudioRef.current) {
      if (next && isPlaying) {
        bgAudioRef.current.volume = isMuted ? 0 : bgMusicVolume
        bgAudioRef.current.play().catch(() => {})
      } else {
        bgAudioRef.current.pause()
      }
    }
  }

  // Spotify Handlers
  const handleConnectSpotify = async () => {
    const currentId = getStoredClientId()
    if (!currentId) {
      setClientIdInput("")
      setIsConfigModalOpen(true)
      return
    }
    try {
      await initiateSpotifyLogin(currentId)
    } catch (err) {
      console.error("Erro ao iniciar login Spotify:", err)
      setIsConfigModalOpen(true)
    }
  }

  const handleSaveClientIdAndLogin = async () => {
    if (!clientIdInput.trim()) return
    setStoredClientId(clientIdInput.trim())
    setIsConfigModalOpen(false)
    await initiateSpotifyLogin(clientIdInput.trim())
  }

  const handleDisconnectSpotify = () => {
    clearSpotifySession()
    setSpotifyUser(null)
    setSpotifyPlaylists([])
    setSpotifyTopTracks([])
    setMusicSubTab("official")
    setCurrentEmbedUrl(DEFAULT_EMBED_URL)
    setActiveMediaTitle("F1 Tracks 2026")
    setActiveMediaSubtitle("Playlist oficial da F1")
  }

  const handleSelectPlaylist = (playlist: SpotifyPlaylist) => {
    const { embedUrl } = parseSpotifyUriOrUrl(playlist.uri || playlist.id)
    setCurrentEmbedUrl(embedUrl)
    setStoredActiveUri(playlist.uri)
    setActiveMediaTitle(playlist.name)
    setActiveMediaSubtitle(`${playlist.tracks?.total || 0} faixas · Playlist pessoal`)
  }

  const handleSelectTrack = (track: SpotifyTrack) => {
    const { embedUrl } = parseSpotifyUriOrUrl(track.uri || track.id)
    setCurrentEmbedUrl(embedUrl)
    setStoredActiveUri(track.uri)
    setActiveMediaTitle(track.name)
    setActiveMediaSubtitle(track.artists.map((a) => a.name).join(", "))
  }

  const handlePlayOfficialF1 = () => {
    setCurrentEmbedUrl(DEFAULT_EMBED_URL)
    setStoredActiveUri(`spotify:playlist:${OFFICIAL_F1_PLAYLIST_ID}`)
    setActiveMediaTitle("F1 Tracks 2026")
    setActiveMediaSubtitle("Playlist oficial do paddock")
  }

  const handlePlayCustomUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!customUrlInput.trim()) return
    const { embedUrl, type } = parseSpotifyUriOrUrl(customUrlInput.trim())
    setCurrentEmbedUrl(embedUrl)
    setStoredActiveUri(customUrlInput.trim())
    setActiveMediaTitle("Mídia personalizada")
    setActiveMediaSubtitle(type ? `Spotify ${type}` : "Spotify")
    setCustomUrlInput("")
  }

  const copyRedirectUri = () => {
    if (typeof window === "undefined") return
    const uri = `${window.location.origin}${window.location.pathname}`
    navigator.clipboard.writeText(uri)
    setCopiedRedirect(true)
    setTimeout(() => setCopiedRedirect(false), 2500)
  }

  // Minimized pill button
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 bg-black/90 backdrop-blur-md border border-white/20 rounded-full shadow-2xl hover:scale-105 transition-all text-white hover:border-[hsl(var(--primary))]"
          title="Abrir Rádio F1"
        >
          {mode === "music" ? (
            <SpotifyIcon className="h-4 w-4 text-[#1DB954]" />
          ) : (
            <div className="relative">
              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/40 shadow-sm flex items-center justify-center">
                <img
                  src={currentVoice.avatar}
                  alt={currentVoice.shortName}
                  onError={(e) => {
                    e.currentTarget.src = "/radio/logo.svg"
                  }}
                  className="w-full h-full object-cover scale-[1.32]"
                />
              </div>
              {isPlaying && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
          )}
          <span className="font-f1 text-xs font-bold tracking-wide">
            {mode === "music" ? "Spotify F1" : `${radioName} (${currentVoice.shortName})`}
          </span>
          {isPlaying && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 max-w-[95vw] sm:max-w-[460px]">
        {/* Top Mode & Switcher Bar */}
        <div className="flex items-center justify-between w-full bg-black/90 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-xl shadow-lg gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode("news")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                mode === "news"
                  ? "bg-white/15 text-white shadow-sm border border-white/15"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Radio className="h-3 w-3" />
              Boletim
            </button>

            <button
              onClick={() => setMode("music")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                mode === "music"
                  ? "bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40 shadow-sm font-semibold"
                  : "text-white/60 hover:text-[#1DB954] hover:bg-white/5"
              )}
            >
              <SpotifyIcon className="h-3.5 w-3.5" />
              Spotify {spotifyUser ? "Conectado" : "F1 Tracks"}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {mode === "news" && (
              <div
                className="px-2 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 border border-white/10 bg-white/5 text-white/90 shrink-0"
                title="Mariana · Locutora Oficial da Rádio F1"
              >
                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-white/40 shadow-sm flex items-center justify-center">
                  <img
                    src={currentVoice.avatar}
                    alt={currentVoice.shortName}
                    onError={(e) => {
                      e.currentTarget.src = "/radio/logo.svg"
                    }}
                    className="w-full h-full object-cover scale-[1.32]"
                  />
                </div>
                <span className="font-semibold">{currentVoice.shortName}</span>
                <span className="text-[10px] text-red-400 font-mono">Oficial</span>
              </div>
            )}

            {mode === "music" && spotifyUser && (
              <div
                className="px-2 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 border border-[#1DB954]/30 bg-[#1DB954]/10 text-white shrink-0"
                title={spotifyPrivate ? "Spotify conectado (modo privado)" : `Spotify Conectado: ${spotifyUser.display_name}`}
              >
                {!spotifyPrivate && spotifyUser.images?.[0]?.url ? (
                  <img
                    src={spotifyUser.images[0].url}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <SpotifyIcon className="w-3.5 h-3.5 text-[#1DB954]" />
                )}
                <span className="font-semibold text-xs max-w-[80px] truncate">
                  {spotifyPrivate ? "Privado" : spotifyUser.display_name.split(" ")[0]}
                </span>
                <button
                  type="button"
                  onClick={toggleSpotifyPrivacy}
                  className="text-white/50 hover:text-white"
                  title={spotifyPrivate ? "Mostrar meus dados (só você vê)" : "Ocultar meus dados"}
                  aria-label={spotifyPrivate ? "Mostrar dados do Spotify" : "Ocultar dados do Spotify"}
                >
                  {spotifyPrivate ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMinimized(true)}
              className="text-white/40 hover:text-white p-1 rounded-md text-xs hover:bg-white/5 transition-colors"
              title="Minimizar Rádio"
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODE 1: NOTÍCIAS / BOLETIM DA RÁDIO */}
        {mode === "news" && (
          <div
            className={cn(
              "bg-black/90 backdrop-blur-md border rounded-xl shadow-2xl flex items-center p-3 gap-3 sm:gap-4 transition-all duration-500 w-full",
              isPlaying
                ? "border-[hsl(var(--primary))] shadow-[0_0_20px_var(--team-glow,rgba(225,6,0,0.4))]"
                : "border-white/10 hover:border-white/20"
            )}
          >
            <div
              className="relative flex items-center justify-center h-12 w-12 rounded-full overflow-hidden shrink-0 ring-2 ring-red-500/50 shadow-[0_0_12px_rgba(225,6,0,0.3)] bg-black/80 transition-all hover:scale-105 duration-300"
              title={`Rádio F1 · Locutora Oficial: ${currentVoice.name}`}
            >
              <img
                src={currentVoice.avatar}
                alt={currentVoice.name}
                onError={(e) => {
                  e.currentTarget.src = "/radio/logo.svg"
                }}
                className="h-full w-full object-cover scale-[1.32]"
              />
              {isPlaying && !isMuted && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-[2px]">
                  <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_0.8s_infinite] h-4 rounded-full" />
                  <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_1.2s_infinite] h-3 rounded-full" />
                  <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_0.9s_infinite] h-5 rounded-full" />
                </div>
              )}
              <span className="absolute bottom-0 right-0 text-[10px] bg-black/80 rounded-full px-0.5 border border-white/20">
                {currentVoice.flag}
              </span>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-f1 text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>{radioName}</span>
                <span className="text-white/40 font-normal">·</span>
                <span className="text-xs font-semibold text-amber-300 truncate font-sans">
                  {currentVoice.shortName}
                </span>
                {isPlaying && (
                  <span className="flex items-center gap-1 text-[9px] uppercase font-mono tracking-wider text-red-400 bg-red-950/60 border border-red-500/40 px-1.5 py-0.2 rounded-full shrink-0 ml-auto">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    No ar
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-xs truncate transition-colors",
                  errorMessage
                    ? "text-red-400 font-medium"
                    : isPlaying
                    ? "text-white/90 italic"
                    : "text-white/50"
                )}
                title={scriptSummary || currentVoice.quote || radioSubtitle}
              >
                {errorMessage
                  ? errorMessage
                  : isLoading
                  ? "Sintonizando transmissão..."
                  : isPlaying && scriptSummary
                  ? scriptSummary
                  : currentVoice.quote || radioSubtitle}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-white/10 pl-3 shrink-0">
              <div className="relative flex items-center group/theme">
                <button
                  onClick={toggleBgMusic}
                  className={cn(
                    "p-1.5 sm:p-2 transition-colors rounded-lg hover:bg-white/5",
                    bgMusicEnabled
                      ? "text-red-500 hover:text-red-400"
                      : "text-white/30 hover:text-white/60"
                  )}
                  title={
                    bgMusicEnabled
                      ? `Tema oficial da F1 ativado (${Math.round(bgMusicVolume * 100)}% de volume). Clique para desativar.`
                      : "Tema oficial da F1 desativado. Clique para ativar."
                  }
                >
                  <Disc3
                    className={cn(
                      "h-4 w-4",
                      bgMusicEnabled && isPlaying ? "animate-spin" : ""
                    )}
                  />
                </button>

                {bgMusicEnabled && (
                  <div className="hidden group-hover/theme:flex pointer-events-auto absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-md border border-white/20 p-2 rounded-xl shadow-2xl flex-col items-center gap-1.5 z-50 min-w-[110px]">
                    <div className="flex items-center justify-between w-full text-[10px] text-white/70 font-mono">
                      <span>Trilha F1</span>
                      <span className="text-red-400 font-semibold">{Math.round(bgMusicVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.10"
                      step="0.005"
                      value={bgMusicVolume}
                      onChange={(e) => handleBgVolumeChange(parseFloat(e.target.value))}
                      className="w-20 h-1.5 accent-red-500 cursor-pointer bg-white/20 rounded-lg appearance-none"
                      title={`Volume da trilha: ${Math.round(bgMusicVolume * 100)}%`}
                    />
                    <span className="text-[9px] text-white/40">Fundo suave</span>
                  </div>
                )}
              </div>

              <button
                onClick={toggleMute}
                className="p-1.5 sm:p-2 text-white/60 hover:text-[hsl(var(--primary))] transition-colors rounded-lg hover:bg-white/5"
                title={isMuted ? "Ativar som" : "Mutar áudio"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-red-400" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={() => playAudio()}
                disabled={isLoading}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-md hover:bg-white/90 disabled:opacity-50"
                title={isPlaying ? "Pausar rádio" : `Ouvir com ${currentVoice.name}`}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: SPOTIFY NA RÁDIO F1 */}
        {mode === "music" && (
          <div className="w-full bg-black/95 backdrop-blur-md border border-[#1DB954]/30 rounded-2xl shadow-2xl p-3 flex flex-col gap-3 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center shrink-0">
                  <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-f1 text-xs font-bold text-white flex items-center gap-1.5 truncate">
                    {activeMediaTitle}
                    <span className="text-[10px] text-[#1DB954] bg-[#1DB954]/15 px-1.5 py-0.2 rounded font-sans font-semibold shrink-0">
                      Spotify
                    </span>
                  </h4>
                  <p className="text-[11px] text-white/50 truncate">
                    {activeMediaSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {spotifyUser ? (
                  <button
                    onClick={handleDisconnectSpotify}
                    className="p-1.5 text-white/50 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors"
                    title="Desconectar Spotify"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="p-1.5 text-white/50 hover:text-[#1DB954] rounded-lg hover:bg-white/10 transition-colors"
                    title="Configurar Client ID do Spotify"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() => setIsMusicExpanded(!isMusicExpanded)}
                  className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title={isMusicExpanded ? "Modo compacto" : "Expandir player"}
                >
                  {isMusicExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>

                <a
                  href={`https://open.spotify.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-white/60 hover:text-[#1DB954] rounded-lg hover:bg-white/10 transition-colors"
                  title="Abrir Spotify Web"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* If NOT logged in: Prompt & Quick Login Banner */}
            {!spotifyUser && (
              <div className="bg-gradient-to-r from-[#1DB954]/10 via-black to-black border border-[#1DB954]/30 rounded-xl p-3 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#1DB954]" />
                      Conecte seu Spotify pessoal
                    </span>
                    <p className="text-[11px] text-white/60 leading-tight mt-0.5">
                      Ouça suas playlists e músicas favoritas diretamente na Rádio F1 durante os treinos e corridas sem precisar abrir o app!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConnectSpotify}
                    disabled={isSpotifyLoading}
                    className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSpotifyLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <SpotifyIcon className="w-4 h-4 text-black" />
                        <span>Entrar com Spotify</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="text-[11px] text-white/60 hover:text-white px-2 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors flex items-center gap-1 shrink-0"
                    title="Configurar credenciais"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Config</span>
                  </button>
                </div>
              </div>
            )}

            {/* If logged in: Subtabs (Minhas Playlists, Mais Tocadas, F1 Oficial, Link) */}
            {spotifyUser && (
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg text-xs overflow-x-auto">
                <button
                  onClick={() => setMusicSubTab("playlists")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 shrink-0",
                    musicSubTab === "playlists"
                      ? "bg-[#1DB954] text-black font-semibold shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <ListMusic className="w-3 h-3" />
                  Playlists ({spotifyPlaylists.length})
                </button>

                <button
                  onClick={() => setMusicSubTab("top")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 shrink-0",
                    musicSubTab === "top"
                      ? "bg-[#1DB954] text-black font-semibold shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Flame className="w-3 h-3" />
                  Mais Tocadas
                </button>

                <button
                  onClick={() => {
                    setMusicSubTab("official")
                    handlePlayOfficialF1()
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 shrink-0",
                    musicSubTab === "official"
                      ? "bg-[#1DB954] text-black font-semibold shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Disc3 className="w-3 h-3" />
                  F1 Oficial
                </button>

                <button
                  onClick={() => setMusicSubTab("custom")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 shrink-0",
                    musicSubTab === "custom"
                      ? "bg-[#1DB954] text-black font-semibold shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <LinkIcon className="w-3 h-3" />
                  Colar Link
                </button>
              </div>
            )}

            {/* Subtab Content: Playlists */}
            {spotifyUser && musicSubTab === "playlists" && (
              <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                {spotifyPlaylists.length === 0 ? (
                  <p className="text-[11px] text-white/50 text-center py-3">
                    Nenhuma playlist encontrada na sua conta.
                  </p>
                ) : (
                  spotifyPlaylists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => handleSelectPlaylist(pl)}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/10 text-left transition-colors group w-full"
                    >
                      {pl.images?.[0]?.url ? (
                        <img
                          src={pl.images[0].url}
                          alt={pl.name}
                          className="w-8 h-8 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4 text-white/50" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-medium text-white truncate group-hover:text-[#1DB954] transition-colors">
                          {pl.name}
                        </span>
                        <span className="text-[10px] text-white/40 truncate">
                          {pl.tracks?.total || 0} músicas
                        </span>
                      </div>
                      <Play className="w-3.5 h-3.5 text-white/40 group-hover:text-[#1DB954] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Subtab Content: Top Tracks */}
            {spotifyUser && musicSubTab === "top" && (
              <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                {spotifyTopTracks.length === 0 ? (
                  <p className="text-[11px] text-white/50 text-center py-3">
                    Nenhuma faixa encontrada no momento.
                  </p>
                ) : (
                  spotifyTopTracks.map((tr) => (
                    <button
                      key={tr.id}
                      onClick={() => handleSelectTrack(tr)}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/10 text-left transition-colors group w-full"
                    >
                      {tr.album?.images?.[0]?.url ? (
                        <img
                          src={tr.album.images[0].url}
                          alt={tr.name}
                          className="w-8 h-8 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4 text-white/50" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-medium text-white truncate group-hover:text-[#1DB954] transition-colors">
                          {tr.name}
                        </span>
                        <span className="text-[10px] text-white/40 truncate">
                          {tr.artists.map((a) => a.name).join(", ")}
                        </span>
                      </div>
                      <Play className="w-3.5 h-3.5 text-white/40 group-hover:text-[#1DB954] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Subtab Content: Colar Link Personalizado */}
            {((spotifyUser && musicSubTab === "custom") || (!spotifyUser && isMusicExpanded)) && (
              <form onSubmit={handlePlayCustomUrl} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Cole link de playlist ou música do Spotify..."
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/15 focus:border-[#1DB954] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  Tocar
                </button>
              </form>
            )}

            {/* Official Spotify Embed Player */}
            <div className="w-full rounded-xl overflow-hidden bg-black/60 border border-white/5 shadow-inner">
              <iframe
                title="Spotify Rádio F1"
                src={currentEmbedUrl}
                width="100%"
                height={isMusicExpanded ? "352" : "152"}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="w-full transition-all duration-300"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
              <span className="flex items-center gap-1 truncate">
                <Sparkles className="w-3 h-3 text-[#1DB954] shrink-0" />
                {spotifyUser ? `Conectado como ${spotifyDisplayName}` : "Player Oficial Integrado"}
              </span>
              <button
                onClick={handlePlayOfficialF1}
                className="hover:text-[#1DB954] transition-colors shrink-0"
              >
                Resetar p/ F1 Oficial
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spotify Client ID Configuration Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#1DB954]/40 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4 text-white relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsConfigModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/50 flex items-center justify-center shrink-0">
                <SpotifyIcon className="w-6 h-6 text-[#1DB954]" />
              </div>
              <div>
                <h3 className="font-f1 text-sm font-bold">Conectar Spotify à Rádio F1</h3>
                <p className="text-xs text-white/60">OAuth 2.0 PKCE seguro direto com o Spotify</p>
              </div>
            </div>

            <div className="text-xs text-white/80 space-y-2 bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="font-semibold text-[#1DB954]">Como funciona (rápido e grátis):</p>
              <ol className="list-decimal list-inside space-y-1 text-white/70 leading-relaxed">
                <li>
                  Acesse o{" "}
                  <a
                    href="https://developer.spotify.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1DB954] underline hover:text-[#1ed760] font-medium"
                  >
                    Spotify Developer Dashboard
                  </a>{" "}
                  e faça login.
                </li>
                <li>Clique em <strong>Create app</strong> (Ex: Nome: <em>Rádio F1</em>).</li>
                <li>
                  Em <strong>Redirect URIs</strong>, adicione a URL abaixo:
                  <div className="flex items-center justify-between gap-2 mt-1 bg-black/60 p-2 rounded border border-white/10 font-mono text-[11px] text-white/90">
                    <span className="truncate">
                      {typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={copyRedirectUri}
                      className="text-xs bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 transition-colors"
                    >
                      {copiedRedirect ? (
                        <>
                          <Check className="w-3 h-3 text-[#1DB954]" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                </li>
                <li>Salve e copie o <strong>Client ID</strong> gerado.</li>
              </ol>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/90">
                Seu Client ID do Spotify:
              </label>
              <input
                type="text"
                placeholder="Cole aqui o Client ID (ex: 3a7f8b9...)"
                defaultValue={getStoredClientId()}
                onChange={(e) => setClientIdInput(e.target.value)}
                className="bg-black border border-white/20 focus:border-[#1DB954] rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none transition-colors font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-xs text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveClientIdAndLogin}
                className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-lg transition-all"
              >
                <LogIn className="w-4 h-4" />
                Salvar e Conectar com Spotify
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
