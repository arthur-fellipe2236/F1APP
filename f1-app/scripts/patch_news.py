import re

path = 'src/components/race-news-cards.tsx'
with open(path, 'r') as f:
    content = f.read()

old_func = 'export function RaceNewsCards({ series }: { series?: string }) {'
new_func = '''import { useAppStore } from "@/store"

export function RaceNewsCards({ series }: { series?: string }) {
  const { user } = useAppStore()
'''

if 'const { user } = useAppStore()' not in content:
    content = content.replace(old_func, new_func)

old_items_regex = r'query\.data\.data\.map\(\(item\) => \(\s*<NewsCard key=\{item\.id\} item=\{item\} />\s*\)\)'
new_items = '''(() => {
            let newsItems = query.data.data;
            if (user && (user.favorite_driver || user.favorite_team)) {
              const terms = [user.favorite_driver?.toLowerCase(), user.favorite_team?.toLowerCase()].filter(Boolean) as string[];
              const matched = [];
              const others = [];
              for (const item of newsItems) {
                const title = item.title.toLowerCase();
                const desc = (item.meta_description || '').toLowerCase();
                if (terms.some(t => title.includes(t) || desc.includes(t))) {
                  matched.push({...item, badgeLabel: "⭐️ Favorito"});
                } else {
                  others.push(item);
                }
              }
              newsItems = [...matched, ...others];
            }
            return newsItems.slice(0, 3).map((item: any) => (
              <NewsCard key={item.id} item={item} badgeLabel={item.badgeLabel} />
            ))
          })()'''

if 'const terms =' not in content:
    content = re.sub(old_items_regex, new_items, content)

with open(path, 'w') as f:
    f.write(content)
print("Patched race-news-cards.tsx")
