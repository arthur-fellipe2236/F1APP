import { useState, useEffect, useRef, useCallback } from "react"
import { Radio, Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [scriptSummary, setScriptSummary] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
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
      f1: "Boletim Diário: Paddock e Equipes",
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

      // 2. Play high-quality MP3 stream via HTML5 Audio element
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
            playRadioChirp("end")
            setIsPlaying(false)
          }
          utterance.onerror = () => {
            setIsPlaying(false)
          }
          window.speechSynthesis.speak(utterance)
          setIsLoading(false)
          setIsPlaying(true)
        } else {
          setErrorMessage("Erro ao reproduzir áudio")
          setTimeout(() => setErrorMessage(null), 4000)
          setIsLoading(false)
          setIsPlaying(false)
        }
      }

      await audio.play()
    } catch (err) {
      console.error("Erro na Rádio F1:", err)
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
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <div
        className={cn(
          "bg-black/85 backdrop-blur-md border rounded-xl shadow-2xl flex items-center p-3 gap-4 transition-all duration-500",
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

        <div className="flex flex-col min-w-[170px] max-w-[240px]">
          <span className="font-f1 text-sm font-bold text-white tracking-wide flex items-center gap-2">
            {radioName}
            {isPlaying && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-red-400 bg-red-950/60 border border-red-500/40 px-1.5 py-0.5 rounded-full">
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

        <div className="flex items-center gap-2 border-l border-white/10 pl-3 shrink-0">
          <button
            onClick={toggleMute}
            className="p-2 text-white/60 hover:text-[hsl(var(--primary))] transition-colors rounded-lg hover:bg-white/5"
            title={isMuted ? "Ativar som" : "Mutar áudio"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            onClick={playAudio}
            disabled={isLoading}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-md hover:bg-white/90 disabled:opacity-50"
            title={isPlaying ? "Pausar rádio" : "Ouvir boletim da rádio"}
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
    </div>
  )
}
