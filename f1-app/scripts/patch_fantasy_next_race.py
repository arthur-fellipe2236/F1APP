with open('src/pages/fantasy.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the races fetch logic
old_fetch = 'api.races({ series, season: seasonParam, per_page: 30 }).then(res => setRaces(res.data))'
new_fetch = '''api.races({ series, season: seasonParam, per_page: 30 }).then(res => {
      const fetchedRaces = res.data
      setRaces(fetchedRaces)
      
      const now = new Date()
      // Encontra a proxima corrida
      const upcoming = fetchedRaces.find((r: any) => new Date(r.date) > now)
      if (upcoming) {
        setSelectedRaceId(upcoming.id)
      } else if (fetchedRaces.length > 0) {
        setSelectedRaceId(fetchedRaces[fetchedRaces.length - 1].id)
      }
    })'''

if 'const upcoming = fetchedRaces.find' not in content:
    content = content.replace(old_fetch, new_fetch)

with open('src/pages/fantasy.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched fantasy.tsx to auto-select next race")
