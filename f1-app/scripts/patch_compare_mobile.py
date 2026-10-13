import re

with open('src/pages/compare.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add a CSS media query check or just render two charts, hiding one via css
new_chart_section = '''
            <div className="h-96 w-full hidden md:block">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px'}} />
                  <Legend />
                  <Bar dataKey={statsA.driver.name} fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={statsB.driver.name} fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-[500px] w-full md:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px'}} />
                  <Legend verticalAlign="top" />
                  <Bar dataKey={statsA.driver.name} fill="var(--primary)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey={statsB.driver.name} fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
'''

if 'layout="vertical"' not in content:
    content = re.sub(
        r'<div className="h-96 w-full">.*?</ResponsiveContainer>\s*</div>',
        new_chart_section.strip(),
        content,
        flags=re.DOTALL
    )
    with open('src/pages/compare.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
print("Patched compare.tsx for mobile")
