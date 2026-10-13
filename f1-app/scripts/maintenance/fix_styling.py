import re

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "r") as f:
    content = f.read()

replacements = {
    r'Minardi: \{ url: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Minardi_F1_Team.svg[^"]*" \},':
    'Minardi: { url: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Minardi_F1_Team.svg", className: "bg-zinc-100 p-2" },',

    r'Ligier: \{ url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Logo_Ligier.svg[^"]*" \},':
    'Ligier: { url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Logo_Ligier.svg", className: "bg-zinc-100 p-2" },',

    r'Tyrrell: \{ url: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Tyrrell_Racing_logo.svg[^"]*" \},':
    'Tyrrell: { url: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Tyrrell_Racing_logo.svg", className: "bg-zinc-100 p-2" },',

    r'Larrousse: \{ url: "https://upload.wikimedia.org/wikipedia/en/f/f5/Larrousse_logo.png[^"]*" \},':
    'Larrousse: { url: "https://upload.wikimedia.org/wikipedia/en/f/f5/Larrousse_logo.png", className: "bg-zinc-100 p-2" },',

    r'AGS: \{ url: "https://upload.wikimedia.org/wikipedia/en/f/f8/Ags_logo_%28F1%29.png[^"]*" \},':
    'AGS: { url: "https://upload.wikimedia.org/wikipedia/en/f/f8/Ags_logo_%28F1%29.png", className: "bg-zinc-100 p-2" },',
    
    r'"Leyton House": \{ url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/F1_car_placeholder.svg/300px-F1_car_placeholder.svg.png" \},':
    '"Leyton House": { url: "https://upload.wikimedia.org/wikipedia/en/d/d0/Leyton_house_logo.png", className: "bg-zinc-100 p-2" },',
    
    r'Arrows: \{ url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Arrows_Grand_Prix_International_logo.svg/300px-Arrows_Grand_Prix_International_logo.svg.png" \},':
    'Arrows: { url: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Arrows_Grand_Prix_International_logo.svg", className: "bg-zinc-100 p-2" },',
    
    r'"Lotus F1": \{ url: "https://upload.wikimedia.org/wikipedia/en/thumb/6/64/Lotus_F1_Team_logo.svg/300px-Lotus_F1_Team_logo.svg.png" \},':
    '"Lotus F1": { url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Team_Lotus_Logo.svg", className: "bg-zinc-100 p-2" },',
    
    r'Lotus: \{ url: "https://upload.wikimedia.org/wikipedia/en/thumb/6/64/Lotus_F1_Team_logo.svg/300px-Lotus_F1_Team_logo.svg.png" \},':
    'Lotus: { url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Team_Lotus_Logo.svg", className: "bg-zinc-100 p-2" },',
    
    r'Onyx: \{ url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/F1_car_placeholder.svg/300px-F1_car_placeholder.svg.png" \},':
    'Onyx: { url: "https://upload.wikimedia.org/wikipedia/en/9/90/Onyx_Grand_Prix_logo.png", className: "bg-zinc-100 p-2" },',
    
    r'EuroBrun: \{ url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/F1_car_placeholder.svg/300px-F1_car_placeholder.svg.png" \},':
    'EuroBrun: { url: "https://upload.wikimedia.org/wikipedia/commons/9/91/EuroBrun_logo.png", className: "bg-zinc-100 p-2" },'
}

for pattern, repl in replacements.items():
    content = re.sub(pattern, repl, content)

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "w") as f:
    f.write(content)

print("Applied final classes to assets.ts")
