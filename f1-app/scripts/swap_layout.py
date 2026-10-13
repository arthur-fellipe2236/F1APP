import re

with open('../f1-app/src/pages/live-timing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

tower_start = "{/* LEADERBOARD / TIMING TOWER */}"
tower_end = "{/* COMPANION STREAM REMOVED AS REQUESTED */}"

widgets_start = "{liveData?.session?.state !== \"API Bloqueada\" && ("
widgets_end = "{/* EMBEDDED TFEED IFRAME FOR LIVE SESSIONS */}"

# Extract tower block
tower_block = content[content.find(tower_start):content.find(tower_end) + len(tower_end)]

# Extract widgets block
widgets_block = content[content.find(widgets_start):content.find(widgets_end)]

# Now we remove both blocks from content
content = content.replace(tower_block, "")
content = content.replace(widgets_block, "")

# Now we insert them back in the new order right before the TFEED IFRAME
insert_pos = content.find("{/* EMBEDDED TFEED IFRAME FOR LIVE SESSIONS */}")
content = content[:insert_pos] + widgets_block + "\n      " + tower_block + "\n\n      " + content[insert_pos:]

with open('../f1-app/src/pages/live-timing.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Swapped positions successfully.")
