with open('../f1-app/src/pages/live-timing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'className="text-sm  font-medium uppercase',
    'className={`text-sm ${liveData?.session?.state === "live" ? "text-red-400" : "text-blue-400"} font-medium uppercase`}'
)

with open('../f1-app/src/pages/live-timing.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
