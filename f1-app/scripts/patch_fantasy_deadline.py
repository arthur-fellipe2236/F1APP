import re

with open('src/pages/fantasy.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add lock logic
lock_logic = '''  const selectedRace = races.find(r => r.id === selectedRaceId)
  
  let isLocked = false
  let deadlineStr = ""
  if (selectedRace && selectedRace.date) {
    const raceDate = new Date(selectedRace.date)
    // Assume race starts at roughly 15:00 UTC. 48h before is 2 days earlier at 15:00.
    const deadline = new Date(raceDate.getTime() + 15 * 60 * 60 * 1000 - 48 * 60 * 60 * 1000)
    isLocked = new Date() > deadline
    deadlineStr = deadline.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  }
'''

if 'let isLocked = false' not in content:
    content = content.replace('const selectedRace = races.find(r => r.id === selectedRaceId)', lock_logic)

    # Disable inputs
    content = content.replace('<Select value={poleId} onValueChange={setPoleId}>', '<Select value={poleId} onValueChange={setPoleId} disabled={isLocked}>')
    content = content.replace('<Select value={winnerId} onValueChange={setWinnerId}>', '<Select value={winnerId} onValueChange={setWinnerId} disabled={isLocked}>')
    content = content.replace('<Select value={fastestId} onValueChange={setFastestId}>', '<Select value={fastestId} onValueChange={setFastestId} disabled={isLocked}>')

    # Add UI warning
    warning_ui = '''
                      {isLocked && (
                        <div className="p-3 rounded text-sm bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <p className="font-bold">⚠️ Palpites Encerrados</p>
                          <p>O prazo limite para esta corrida terminou em {deadlineStr}.</p>
                        </div>
                      )}
                      
                      {!isLocked && deadlineStr && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Prazo limite: {deadlineStr}
                        </div>
                      )}
                      
                      <Button type="submit" className="w-full" disabled={isLocked}>
                        {isLocked ? "Palpites Bloqueados" : "Salvar Palpites"}
                      </Button>
    '''
    content = re.sub(r'<Button type="submit" className="w-full">Salvar Palpites</Button>', warning_ui.strip(), content)

    with open('src/pages/fantasy.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
print("Patched fantasy.tsx for deadline")
