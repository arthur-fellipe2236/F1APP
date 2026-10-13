with open('../f1-app/src/pages/live-timing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'className={`text-sm ${liveData?.session?.state === "live" ? "text-red-400" : "text-blue-400"} font-medium uppercase`} tracking-widest mt-2"',
    'className={`text-sm ${liveData?.session?.state === "live" ? "text-red-400" : "text-blue-400"} font-medium uppercase tracking-widest mt-2`}'
)

content = content.replace(
    'className="text-5xl md:text-7xl font-black text-blue-500/50 mb-6"',
    'className={`text-5xl md:text-7xl font-black mb-6 ${liveData?.session?.state === "live" ? "text-red-500/50" : "text-blue-500/50"}`}'
)

with open('../f1-app/src/pages/live-timing.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
