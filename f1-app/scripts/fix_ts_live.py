import re

with open('../f1-app/src/pages/live-timing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const openCenteredPopup = (url: string, title: string) => {", "const openCenteredPopup = (url: string) => {")
content = content.replace("openCenteredPopup(\"https://www.fiaformula2.com/livetiming/index.html\", \"F2LiveTiming\")", "openCenteredPopup(\"https://www.fiaformula2.com/livetiming/index.html\")")
content = content.replace("openCenteredPopup(\"https://www.fiaformula3.com/livetiming/index.html\", \"F3LiveTiming\")", "openCenteredPopup(\"https://www.fiaformula3.com/livetiming/index.html\")")
content = content.replace("const getFlagColor = (flag: string | null) => {", "const getFlagColor = (flag?: string | null) => {")

with open('../f1-app/src/pages/live-timing.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
