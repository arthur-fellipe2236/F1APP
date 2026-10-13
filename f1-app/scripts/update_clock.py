import re

with open('../f1-app/src/pages/live-timing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_effect = '''  useEffect(() => {
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

new_effect = '''  useEffect(() => {
    if (!liveData?.session) return;
    
    // Se for 'scheduled', conta ate o inicio. Se for 'live', conta ate o fim da sessao!
    const targetDate = liveData.session.state === "scheduled" ? liveData.session.date_start : 
                       liveData.session.state === "live" ? liveData.session.date_end : null;
                       
    if (targetDate) {
      const interval = setInterval(() => {
        const target = new Date(targetDate).getTime()
        const now = new Date().getTime()
        const distance = target - now

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
    } else {
      setTimeLeft(null)
    }
  }, [liveData])'''

if old_effect in content:
    content = content.replace(old_effect, new_effect)
else:
    print("Old effect not found!")

old_render = '''      {liveData?.session?.state === "scheduled" && timeLeft && (
        <div className="mx-auto w-full max-w-6xl">
          <Card className="border-blue-500/50 bg-blue-950/20 backdrop-blur-md shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-blue-400 flex justify-center items-center gap-2">
                <CalendarClock className="size-6 animate-pulse" />
                Sessão Começa Em:
              </CardTitle>
            </CardHeader>'''

new_render = '''      {timeLeft && (
        <div className="mx-auto w-full max-w-6xl mb-4">
          <Card className={`border-border/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700 ${liveData?.session?.state === "live" ? "bg-red-950/20 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] border-red-500/30" : "bg-blue-950/20 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] border-blue-500/50"}`}>
            <CardHeader className="text-center pb-2">
              <CardTitle className={`text-2xl flex justify-center items-center gap-2 ${liveData?.session?.state === "live" ? "text-red-400" : "text-blue-400"}`}>
                <CalendarClock className="size-6 animate-pulse" />
                {liveData?.session?.state === "live" ? "Sessão Termina Em:" : "Sessão Começa Em:"}
              </CardTitle>
            </CardHeader>'''

if old_render in content:
    content = content.replace(old_render, new_render)
    
    # We also need to change the color of the text classes depending on the state inside the CardContent
    # Let's just do a quick replace on "text-blue-400" -> dynamic inside the timeLeft block
    
    # Actually it's easier to just do it via regex
    block_pattern = re.compile(r'(<CardContent>.*?)</CardContent>', re.DOTALL)
    # Wait, there are multiple CardContents. Let's find the one right after new_render.
    
    # Let's just write the whole block to be safe.

else:
    print("Old render not found!")

with open('../f1-app/src/pages/live-timing.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated frontend clock logic.")
