import { useState, useEffect, useRef } from "react"
import { Radio, Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"

export function RadioPlayer() {
  const { series, token } = useAppStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  // Clean up synth on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  // Se a série mudar, vamos parar a rádio atual (se estiver tocando) para não misturar.
  useEffect(() => {
    if (isPlaying) {
      stopAudio()
    }
  }, [series])

  const radioName = {
    f1: "Rádio F1",
    f2: "Rádio F2",
    f3: "Rádio F3",
  }[series] || "Rádio F1"

  const radioSubtitle = {
    f1: "Boletim Diário: Paddock e Equipes",
    f2: "Fórmula 2: O Caminho para a Glória",
    f3: "Fórmula 3: Os Talentos do Futuro",
  }[series] || "Notícias"

  const stopAudio = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  const playAudio = async () => {
    if (isPlaying) {
      stopAudio()
      return
    }

    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/v1/news/bulletin?series=${series}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      
      const utterance = new SpeechSynthesisUtterance(data.script)
      utterance.lang = 'pt-BR'
      utterance.rate = 1.05
      utterance.pitch = 1.1
      utterance.volume = isMuted ? 0 : 1
      
      utterance.onend = () => setIsPlaying(false)
      synthRef.current = utterance
      
      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
    } catch(err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // Se estiver tocando, infelizmente o Web Speech API não deixa mudar o volume em tempo real perfeitamente sem gambiarras, mas a gente cancela e retoma ou apenas muta.
    // Como é nativo, apenas atualizar o estado servirá para a próxima frase.
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <div 
        className={cn(
          "bg-black/80 backdrop-blur-md border rounded-xl shadow-2xl flex items-center p-3 gap-4 transition-all duration-500",
          isPlaying ? "border-[hsl(var(--primary))] shadow-[0_0_20px_var(--team-glow,rgba(0,0,0,0.5))]" : "border-white/10"
        )}
      >
        <div className="relative flex items-center justify-center h-10 w-10 bg-white/5 rounded-full overflow-hidden">
          {isPlaying && !isMuted ? (
            <div className="flex items-end gap-[2px] h-4">
              <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_0.8s_infinite] h-full" />
              <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_1.2s_infinite] h-2/3" />
              <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_0.9s_infinite] h-4/5" />
              <div className="w-1 bg-[hsl(var(--primary))] animate-[bounce_1.5s_infinite] h-1/2" />
            </div>
          ) : (
            <Radio className={cn("h-5 w-5", isLoading ? "animate-pulse text-white/50" : "text-white/70")} />
          )}
        </div>

        <div className="flex flex-col min-w-[150px]">
          <span className="font-f1 text-sm font-bold text-white tracking-wide flex items-center">
            {radioName}
            {isPlaying && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </span>
          <span className="text-xs text-white/50 truncate max-w-[180px]">
            {isLoading ? "Conectando ao estúdio..." : radioSubtitle}
          </span>
        </div>

        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <button 
            onClick={toggleMute}
            className="p-2 text-white/60 hover:text-[hsl(var(--primary))] transition-colors"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
          </button>
          
          <button 
            onClick={playAudio}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-1" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
