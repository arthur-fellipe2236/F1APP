import re

with open('../f1-app/src/pages/live-timing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# First, let's make sure the LiveData interface includes `drivers`
interface_old = "    date_start?: string;\n  };\n}"
interface_new = '''    date_start?: string;\n  };
  drivers: Array<{
    driver_number: number;
    name: string;
    code: string;
    team: string;
    team_colour: string;
    position: number | null;
    gap_to_leader: number | null;
    interval: number | null;
    lap_number: number | null;
    compound: string | null;
    stops: number | null;
    last_lap: number | null;
  }>;
}'''
if interface_old in content:
    content = content.replace(interface_old, interface_new)

# Now, we replace the COMPANION STREAM block with the Timing Tower!
stream_start = "{/* COMPANION STREAM PLAYER */}"
stream_end = "{liveData?.session?.state !== \"API Bloqueada\" && ("

tower_block = '''{/* LEADERBOARD / TIMING TOWER */}
      {liveData && liveData.drivers && liveData.drivers.length > 0 && (
        <div className="mx-auto w-full max-w-6xl mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card className="border-border/50 bg-black/60 overflow-hidden backdrop-blur-sm">
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 p-3 text-left text-sm font-bold border-b border-border/50 text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MonitorPlay className="size-4 text-red-500" />
                TIMING TOWER
              </span>
              <span className="text-xs font-normal text-muted-foreground uppercase">{liveData.session.name}</span>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-white/5 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-12 text-center">Pos</th>
                    <th className="px-4 py-3 font-semibold">Piloto</th>
                    <th className="px-4 py-3 font-semibold text-center">Pneu</th>
                    <th className="px-4 py-3 font-semibold text-right">Gap</th>
                    <th className="px-4 py-3 font-semibold text-right">Intervalo</th>
                    <th className="px-4 py-3 font-semibold text-center w-16">Volta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {liveData.drivers.map((d, i) => (
                    <tr key={d.driver_number} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-2 font-mono text-center text-muted-foreground">
                        {d.position || "-"}
                      </td>
                      <td className="px-4 py-2 font-medium">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-1 h-5 rounded-sm" 
                            style={{ backgroundColor: `#${d.team_colour || '888'}` }}
                          />
                          <span className="font-bold">{d.code}</span>
                          <span className="text-muted-foreground hidden sm:inline">{d.name.split(' ').slice(1).join(' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {d.compound ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            d.compound.toUpperCase() === 'SOFT' ? 'bg-red-500/20 text-red-400' :
                            d.compound.toUpperCase() === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                            d.compound.toUpperCase() === 'HARD' ? 'bg-white/20 text-white' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {d.compound[0].toUpperCase()}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                        {d.gap_to_leader !== null ? (d.gap_to_leader === 0 ? 'LEADER' : `+${d.gap_to_leader.toFixed(3)}`) : '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                        {d.interval !== null ? `+${d.interval.toFixed(3)}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-center font-mono">
                        {d.lap_number || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* COMPANION STREAM REMOVED AS REQUESTED */}
      
      '''

# I will use a simple split and join to replace the block to be safe
part1 = content.split(stream_start)[0]
part2 = content.split(stream_end)[1]

content = part1 + tower_block + stream_end + part2

with open('../f1-app/src/pages/live-timing.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed Companion Stream and added Live Timing Tower.")
