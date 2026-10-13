import re

with open('../f1-app/src/pages/live-timing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add date_start to interface
interface_old = "    name: string;\n    state: string;\n  };\n}"
interface_new = "    name: string;\n    state: string;\n    date_start?: string;\n  };\n}"
content = content.replace(interface_old, interface_new)

# Add Countdown logic and component at the top of LiveTimingPage
top_old = "export function LiveTimingPage() {\n  const [liveData, setLiveData] = useState<LiveData | null>(null)"
top_new = '''export function LiveTimingPage() {
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [timeLeft, setTimeLeft] = useState<{hours: number, minutes: number, seconds: number} | null>(null)

  useEffect(() => {
    if (liveData?.session?.state === "scheduled" && liveData.session.date_start) {
      const interval = setInterval(() => {
        const start = new Date(liveData.session.date_start!).getTime()
        const now = new Date().getTime()
        const distance = start - now

        if (distance < 0) {
          setTimeLeft(null)
          clearInterval(interval)
        } else {
          setTimeLeft({
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          })
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [liveData])'''
content = content.replace(top_old, top_new)

# Add Video Embed and Countdown Widget
widgets_old = "{/* NATIVE WIDGETS SECTION */}"
widgets_new = '''{/* NATIVE WIDGETS SECTION */}
      
      {liveData?.session?.state === "scheduled" && timeLeft && (
        <div className="mx-auto w-full max-w-6xl">
          <Card className="border-blue-500/50 bg-blue-950/20 backdrop-blur-md shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-blue-400 flex justify-center items-center gap-2">
                <CalendarClock className="size-6 animate-pulse" />
                Sessão Começa Em:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center gap-4 text-center">
                <div className="flex flex-col">
                  <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-sm text-blue-400 font-medium uppercase tracking-widest mt-2">Horas</span>
                </div>
                <span className="text-5xl md:text-7xl font-black text-blue-500/50 mb-6">:</span>
                <div className="flex flex-col">
                  <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="text-sm text-blue-400 font-medium uppercase tracking-widest mt-2">Minutos</span>
                </div>
                <span className="text-5xl md:text-7xl font-black text-blue-500/50 mb-6">:</span>
                <div className="flex flex-col">
                  <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="text-sm text-blue-400 font-medium uppercase tracking-widest mt-2">Segundos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* COMPANION STREAM PLAYER */}
      <div className="mx-auto w-full max-w-6xl mt-4">
        <Card className="border-border/50 bg-black/60 overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 p-2 text-center text-xs font-bold border-b border-border/50 flex justify-between items-center px-4">
            <div className="flex items-center gap-2 text-red-500">
              <MonitorPlay className="size-4" />
              <span>TRANSMISSÃO AO VIVO / COMPANION STREAM</span>
            </div>
            <span className="text-muted-foreground font-normal">F1 TV Pro / YouTube</span>
          </div>
          <div className="aspect-video w-full bg-zinc-950 flex flex-col items-center justify-center relative group">
            {/* Mocked Player placeholder since we can't actually embed F1TV */}
            <div className="absolute inset-0 bg-[url('https://media.formula1.com/image/upload/f_auto,c_limit,w_1440,q_auto/f_auto/q_auto/fom-website/2023/Miscellaneous/F1TV_Devices_2023')] bg-cover bg-center opacity-20"></div>
            <MonitorPlay className="size-16 text-red-600 mb-4 opacity-80 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-xl font-bold text-white z-10 text-center px-4">A transmissão oficial começará em breve</h3>
            <p className="text-sm text-muted-foreground mt-2 z-10 text-center max-w-lg px-4">
              Conecte sua conta F1 TV ou adicione um link do YouTube (como a BandSports ou canais de reaction) para assistir sincronizado com a telemetria.
            </p>
            <div className="mt-6 z-10 flex gap-4">
               <Button className="bg-red-600 hover:bg-red-700 text-white font-bold px-8">Conectar F1 TV</Button>
               <Button variant="outline" className="bg-black/50 backdrop-blur-md border-white/20 hover:bg-white/10">Adicionar Link YouTube</Button>
            </div>
          </div>
        </Card>
      </div>'''
content = content.replace("{/* NATIVE WIDGETS SECTION */}", widgets_new)

with open('../f1-app/src/pages/live-timing.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated live-timing.tsx with Countdown and Broadcast widgets.")
