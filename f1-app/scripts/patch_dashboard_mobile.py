import re

with open('src/pages/dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the F1DataTable call for driverStandings
old_f1_driver = '''<F1DataTable
              columns={getDriverColumns(seasonParam)}
              data={driverStandingsData}
              pagination
              paginationPerPage={15}
            />'''

new_f1_driver = '''<F1DataTable
              columns={getDriverColumns(seasonParam)}
              data={driverStandingsData}
              pagination
              paginationPerPage={15}
              renderMobileCard={(row: any) => (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-black text-muted-foreground/30 tabular-nums">
                        {row.position}º
                      </span>
                      <span className="font-bold text-lg leading-tight">{row.driver_name}</span>
                    </div>
                    <span className="font-bold text-lg tabular-nums">
                      {row.points} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-sm text-muted-foreground truncate">{row.team_name}</span>
                    <div className="flex gap-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded">V: {row.wins}</span>
                      {row.poles !== undefined && <span className="text-xs bg-muted px-2 py-1 rounded">P: {row.poles}</span>}
                    </div>
                  </div>
                </div>
              )}
            />'''

if 'renderMobileCard={(row: any)' not in old_f1_driver:
    content = content.replace(old_f1_driver, new_f1_driver)

# Replace the F1DataTable call for constructorStandings
old_f1_team = '''<F1DataTable
              columns={teamColumns}
              data={teamStandingsData}
              pagination
              paginationPerPage={10}
            />'''

new_f1_team = '''<F1DataTable
              columns={teamColumns}
              data={teamStandingsData}
              pagination
              paginationPerPage={10}
              renderMobileCard={(row: any) => (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-black text-muted-foreground/30 tabular-nums">
                        {row.position}º
                      </span>
                      <span className="font-bold text-lg leading-tight">{row.team_name}</span>
                    </div>
                    <span className="font-bold text-lg tabular-nums">
                      {row.points} pts
                    </span>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-border/50">
                    <span className="text-xs bg-muted px-2 py-1 rounded">Vitórias: {row.wins}</span>
                  </div>
                </div>
              )}
            />'''

if 'renderMobileCard={(row: any)' not in old_f1_team:
    content = content.replace(old_f1_team, new_f1_team)

with open('src/pages/dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched dashboard.tsx with mobile cards")
