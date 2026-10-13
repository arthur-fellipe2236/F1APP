import re

with open('../f1-app/src/pages/live-timing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the HTML table with an iframe to formula1dashboard.com
table_start = '<div className="w-full overflow-x-auto">'
table_end = '</div>\n          </Card>'

# Find the block
start_idx = content.find(table_start)
end_idx = content.find(table_end) + len(table_end)

if start_idx != -1 and end_idx != -1:
    iframe_block = '''<div className="w-full bg-zinc-950">
              <iframe 
                src="https://app.formula1dashboard.com/live-timing/" 
                className="w-full h-[800px] border-none"
                title="F1 Live Timing"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </Card>'''
          
    content = content[:start_idx] + iframe_block + content[end_idx:]
    with open('../f1-app/src/pages/live-timing.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced native table with formula1dashboard iframe.")
else:
    print("Table block not found.")
