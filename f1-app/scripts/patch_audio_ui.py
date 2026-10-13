import re

with open('src/components/race-news-cards.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports = '''import { Newspaper, Play, Square, Volume2 } from "lucide-react"
import { useState } from "react"'''

if 'import { useState }' not in content:
    content = content.replace('import { Newspaper } from "lucide-react"', imports)

audio_button = '''
function AudioBulletinButton() {
  const { token, user } = useAppStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
      const res = await fetch("/api/v1/news/bulletin", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      
      const utterance = new SpeechSynthesisUtterance(data.script)
      utterance.lang = 'pt-BR'
      utterance.rate = 1.05
      utterance.pitch = 1.1
      
      utterance.onend = () => setIsPlaying(false)
      
      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
    } catch(err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={playAudio} disabled={isLoading} className="h-7 text-xs border-amber-500/50 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10">
      {isLoading ? <Volume2 className="w-3 h-3 mr-1 animate-pulse" /> : isPlaying ? <Square className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
      {isPlaying ? "Parar Rádio F1" : "Rádio F1 (IA)"}
    </Button>
  )
}
'''

if 'function AudioBulletinButton' not in content:
    content = content.replace('export function RaceNewsCards', audio_button + '\nexport function RaceNewsCards')

header_old = '''<h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Newspaper className="size-4" />
        Últimas notícias
      </h2>'''

header_new = '''<div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Newspaper className="size-4" />
          Últimas notícias
        </h2>
        {user && <AudioBulletinButton />}
      </div>'''

if 'AudioBulletinButton' not in header_old and 'AudioBulletinButton' not in content.replace(header_new, ''):
    content = content.replace(header_old, header_new)

with open('src/components/race-news-cards.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched UI for Audio")
