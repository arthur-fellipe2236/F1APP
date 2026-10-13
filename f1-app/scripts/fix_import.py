with open('../f1-app/src/components/race-news-cards.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = 'import { useAppStore } from "@/store"\n' + content

with open('../f1-app/src/components/race-news-cards.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
