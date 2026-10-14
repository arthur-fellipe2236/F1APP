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
  ChevronUp,
  ChevronDown,
  Sparkles,
  Disc3,
} from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"

const SPOTIFY_PLAYLIST_ID = "1gH4FFUMWSI98MKPeBaa8x"
const SPOTIFY_PLAYLIST_URL = `https://open.spotify.com/playlist/${SPOTIFY_PLAYLIST_ID}`
const SPOTIFY_EMBED_URL = `https://open.spotify.com/embed/playlist/${SPOTIFY_PLAYLIST_ID}?utm_source=generator&theme=0`

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
  const { series, token } = useAppStore()
  const [mode, setMode] = useState<"news" | "music">("news")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [scriptSummary, setScriptSummary] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMusicExpanded, setIsMusicExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768
    }
    return false
  })
  const [bgMusicEnabled, setBgMusicEnabled] = useState(true)
  const [bgMusicVolume, setBgMusicVolume] = useState(0.035) // Discreet volume (~3.5%) so voice is dominant

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null)

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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  // Cancel audio if series changes
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

  const playAudio = async () => {
    if (isPlaying) {
      stopAudio()
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    // Play intro F1 radio chime
    playRadioChirp("start")

    try {
      // 1. Fetch bulletin text for subtitle display
      const headers: Record<string, string> = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      let script = ""
      try {
        const res = await fetch(`/api/v1/news/bulletin?series=${series}`, { headers })
        if (res.ok) {
          const data = await res.json()
          script = data?.script || ""
          if (script) {
            setScriptSummary(script)
          }
        }
      } catch (err) {
        console.warn("Não foi possível pré-carregar texto:", err)
      }

      // 2. Start background official F1 theme music
      if (bgMusicEnabled) {
        try {
          const bgAudio = bgAudioRef.current || new Audio()
          bgAudio.src = "/f1-theme.webm"
          bgAudio.loop = true
          bgAudio.muted = isMuted
          bgAudio.volume = isMuted ? 0 : bgMusicVolume // Discreet level so narrator voice is prominent
          bgAudio.currentTime = 0
          bgAudioRef.current = bgAudio
          bgAudio.play().catch(() => {
            // Fallback to m4a if browser does not prefer webm
            bgAudio.src = "/f1-theme.m4a"
            bgAudio.play().catch((e) => console.warn("Background music autoplay prevented:", e))
          })
        } catch (e) {
          console.warn("Erro ao iniciar trilha de fundo:", e)
        }
      }

      // 3. Play high-quality MP3 voice stream via HTML5 Audio element
      const audioUrl = `/api/v1/news/bulletin/audio?series=${series}${token ? `&token=${token}` : ""}`
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.muted = isMuted
      audio.volume = isMuted ? 0 : 1

      audio.onplay = () => {
        setIsLoading(false)
        setIsPlaying(true)
      }

      audio.onended = () => {
        if (bgAudioRef.current) {
          bgAudioRef.current.pause()
          bgAudioRef.current.currentTime = 0
        }
        playRadioChirp("end")
        setIsPlaying(false)
      }

      audio.onerror = (e) => {
        console.warn("Audio stream error, falling back to TTS:", e)
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

      await audio.play()
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
            <Disc3 className="h-4 w-4 text-[#1DB954] animate-spin" />
          ) : isPlaying ? (
            <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          ) : (
            <Radio className="h-4 w-4 text-white/80" />
          )}
          <span className="font-f1 text-xs font-bold tracking-wide">
            {mode === "music" ? "F1 Tracks" : radioName}
          </span>
          {isPlaying && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 max-w-[95vw] sm:max-w-[420px]">
      {/* Top Mode Switcher Bar */}
      <div className="flex items-center justify-between w-full bg-black/90 backdrop-blur-md border border-white/10 px-2 py-1 rounded-xl shadow-lg gap-2">
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
            <Music className="h-3 w-3" />
            F1 Tracks 2026
          </button>
        </div>

        <button
          onClick={() => setIsMinimized(true)}
          className="text-white/40 hover:text-white p-1 rounded-md text-xs hover:bg-white/5 transition-colors"
          title="Minimizar Rádio"
        >
          ✕
        </button>
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
          <div className="relative flex items-center justify-center h-10 w-10 bg-white/5 rounded-full overflow-hidden shrink-0">
            {isPlaying && !isMuted ? (
              <div className="flex items-end gap-[3px] h-4">
                <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_0.8s_infinite] h-full rounded-full" />
                <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_1.2s_infinite] h-2/3 rounded-full" />
                <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_0.9s_infinite] h-4/5 rounded-full" />
                <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_1.5s_infinite] h-1/2 rounded-full" />
              </div>
            ) : (
              <Radio
                className={cn(
                  "h-5 w-5 transition-colors",
                  isLoading ? "animate-pulse text-white/50" : "text-white/70"
                )}
              />
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-f1 text-sm font-bold text-white tracking-wide flex items-center gap-2">
              {radioName}
              {isPlaying && (
                <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-red-400 bg-red-950/60 border border-red-500/40 px-1.5 py-0.5 rounded-full shrink-0">
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
              title={scriptSummary || radioSubtitle}
            >
              {errorMessage
                ? errorMessage
                : isLoading
                ? "Sintonizando transmissão..."
                : isPlaying && scriptSummary
                ? scriptSummary
                : radioSubtitle}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-white/10 pl-3 shrink-0">
            {/* Background F1 Theme Music Toggle & Volume */}
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
              onClick={playAudio}
              disabled={isLoading}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-md hover:bg-white/90 disabled:opacity-50"
              title={isPlaying ? "Pausar rádio" : "Ouvir boletim completo"}
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

      {/* MODE 2: MÚSICAS MAIS TOCADAS (SPOTIFY F1 TRACKS) */}
      {mode === "music" && (
        <div className="w-full bg-black/95 backdrop-blur-md border border-[#1DB954]/30 rounded-2xl shadow-2xl p-3 flex flex-col gap-3 transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center">
                <Music className="w-4 h-4 text-[#1DB954]" />
              </div>
              <div>
                <h4 className="font-f1 text-xs font-bold text-white flex items-center gap-1.5">
                  F1 Tracks 2026
                  <span className="text-[10px] text-[#1DB954] bg-[#1DB954]/10 px-1.5 py-0.2 rounded font-sans font-semibold">
                    Spotify
                  </span>
                </h4>
                <p className="text-[11px] text-white/50">
                  As músicas mais tocadas do ano no paddock
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMusicExpanded(!isMusicExpanded)}
                className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title={isMusicExpanded ? "Modo compacto" : "Expandir playlist"}
              >
                {isMusicExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>

              <a
                href={SPOTIFY_PLAYLIST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-white/60 hover:text-[#1DB954] rounded-lg hover:bg-white/10 transition-colors"
                title="Abrir no Spotify"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Spotify Official Embed Player */}
          <div className="w-full rounded-xl overflow-hidden bg-black/60 border border-white/5 shadow-inner">
            <iframe
              title="Spotify F1 Tracks"
              src={SPOTIFY_EMBED_URL}
              width="100%"
              height={isMusicExpanded ? "352" : "152"}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full transition-all duration-300"
            />
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#1DB954]" />
              Playlist oficial da Fórmula 1
            </span>
            <span>100+ faixas</span>
          </div>
        </div>
      )}
    </div>
  )
}
