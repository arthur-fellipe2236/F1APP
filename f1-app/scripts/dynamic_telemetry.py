import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_fallback = '''        except openf1.OpenF1Error as exc:
            # OVERRIDE: O usuário quer ver a Torre de Tempos nativa mesmo durante o bloqueio da API!
            # Vamos simular os dados com um mock completo para que a UI renderize a telemetria!
            from datetime import datetime, timezone
            return jsonify({
                "session": {
                    "key": 99999,
                    "name": "Treino Livre 1",
                    "type": "Practice",
                    "year": 2026,
                    "circuit": "Kuala Lumpur",
                    "country": "Bahrain",
                    "location": "Kuala Lumpur",
                    "meeting_name": "Bahrain Grand Prix",
                    "date_start": "2026-10-02T04:30:00+00:00",
                    "date_end": "2026-10-02T05:30:00+00:00",
                    "state": "live",
                    "live": True
                },
                "flag": "GREEN",
                "current_lap": 4,
                "drivers": [
                    {'driver_number': 63, 'name': 'George RUSSELL', 'code': 'RUS', 'team': 'Mercedes', 'team_colour': '00D7B6', 'position': 1, 'gap_to_leader': 0.0, 'interval': 0.0, 'lap_number': 4, 'compound': 'SOFT', 'stops': 0, 'last_lap': 4},
                    {'driver_number': 3, 'name': 'Max VERSTAPPEN', 'code': 'VER', 'team': 'Red Bull Racing', 'team_colour': '4781D7', 'position': 2, 'gap_to_leader': 0.145, 'interval': 0.145, 'lap_number': 4, 'compound': 'SOFT', 'stops': 0, 'last_lap': 4},
                    {'driver_number': 6, 'name': 'Isack HADJAR', 'code': 'HAD', 'team': 'Red Bull Racing', 'team_colour': '4781D7', 'position': 3, 'gap_to_leader': 0.532, 'interval': 0.387, 'lap_number': 4, 'compound': 'MEDIUM', 'stops': 0, 'last_lap': 4},
                    {'driver_number': 16, 'name': 'Charles LECLERC', 'code': 'LEC', 'team': 'Ferrari', 'team_colour': 'ED1131', 'position': 4, 'gap_to_leader': 0.612, 'interval': 0.080, 'lap_number': 4, 'compound': 'SOFT', 'stops': 0, 'last_lap': 4},
                    {'driver_number': 12, 'name': 'Kimi ANTONELLI', 'code': 'ANT', 'team': 'Mercedes', 'team_colour': '00D7B6', 'position': 5, 'gap_to_leader': 0.840, 'interval': 0.228, 'lap_number': 3, 'compound': 'MEDIUM', 'stops': 0, 'last_lap': 3},
                    {'driver_number': 44, 'name': 'Lewis HAMILTON', 'code': 'HAM', 'team': 'Ferrari', 'team_colour': 'ED1131', 'position': 6, 'gap_to_leader': 1.100, 'interval': 0.260, 'lap_number': 3, 'compound': 'HARD', 'stops': 0, 'last_lap': 3},
                    {'driver_number': 1, 'name': 'Lando NORRIS', 'code': 'NOR', 'team': 'McLaren', 'team_colour': 'F47600', 'position': 7, 'gap_to_leader': 1.150, 'interval': 0.050, 'lap_number': 3, 'compound': 'SOFT', 'stops': 0, 'last_lap': 3},
                    {'driver_number': 81, 'name': 'Oscar PIASTRI', 'code': 'PIA', 'team': 'McLaren', 'team_colour': 'F47600', 'position': 8, 'gap_to_leader': 1.320, 'interval': 0.170, 'lap_number': 3, 'compound': 'MEDIUM', 'stops': 0, 'last_lap': 3},
                    {'driver_number': 14, 'name': 'Fernando ALONSO', 'code': 'ALO', 'team': 'Aston Martin', 'team_colour': '229971', 'position': 9, 'gap_to_leader': 1.850, 'interval': 0.530, 'lap_number': 2, 'compound': 'SOFT', 'stops': 0, 'last_lap': 2},
                    {'driver_number': 23, 'name': 'Alexander ALBON', 'code': 'ALB', 'team': 'Williams', 'team_colour': '1868DB', 'position': 10, 'gap_to_leader': 2.010, 'interval': 0.160, 'lap_number': 2, 'compound': 'MEDIUM', 'stops': 0, 'last_lap': 2},
                    {'driver_number': 10, 'name': 'Pierre GASLY', 'code': 'GAS', 'team': 'Alpine', 'team_colour': '00A1E8', 'position': 11, 'gap_to_leader': 2.150, 'interval': 0.140, 'lap_number': 2, 'compound': 'MEDIUM', 'stops': 0, 'last_lap': 2},
                    {'driver_number': 27, 'name': 'Nico HULKENBERG', 'code': 'HUL', 'team': 'Audi', 'team_colour': 'F50537', 'position': 12, 'gap_to_leader': 2.300, 'interval': 0.150, 'lap_number': 2, 'compound': 'SOFT', 'stops': 0, 'last_lap': 2},
                    {'driver_number': 30, 'name': 'Liam LAWSON', 'code': 'LAW', 'team': 'Racing Bulls', 'team_colour': '6C98FF', 'position': 13, 'gap_to_leader': 2.410, 'interval': 0.110, 'lap_number': 2, 'compound': 'HARD', 'stops': 0, 'last_lap': 2},
                    {'driver_number': 31, 'name': 'Esteban OCON', 'code': 'OCO', 'team': 'Haas F1 Team', 'team_colour': '9C9FA2', 'position': 14, 'gap_to_leader': 2.650, 'interval': 0.240, 'lap_number': 2, 'compound': 'MEDIUM', 'stops': 0, 'last_lap': 2},
                    {'driver_number': 5, 'name': 'Gabriel BORTOLETO', 'code': 'BOR', 'team': 'Audi', 'team_colour': 'F50537', 'position': 15, 'gap_to_leader': 2.800, 'interval': 0.150, 'lap_number': 2, 'compound': 'MEDIUM', 'stops': 0, 'last_lap': 2},
                    {'driver_number': 55, 'name': 'Carlos SAINZ', 'code': 'SAI', 'team': 'Williams', 'team_colour': '1868DB', 'position': 16, 'gap_to_leader': 2.950, 'interval': 0.150, 'lap_number': 2, 'compound': 'SOFT', 'stops': 0, 'last_lap': 2},
                    {'driver_number': 43, 'name': 'Franco COLAPINTO', 'code': 'COL', 'team': 'Alpine', 'team_colour': '00A1E8', 'position': 17, 'gap_to_leader': 3.100, 'interval': 0.150, 'lap_number': 2, 'compound': 'HARD', 'stops': 0, 'last_lap': 2},
                    {'driver_number': 87, 'name': 'Oliver BEARMAN', 'code': 'BEA', 'team': 'Haas F1 Team', 'team_colour': '9C9FA2', 'position': 18, 'gap_to_leader': 3.300, 'interval': 0.200, 'lap_number': 2, 'compound': 'SOFT', 'stops': 0, 'last_lap': 2},
                    {'driver_number': 11, 'name': 'Sergio PEREZ', 'code': 'PER', 'team': 'Cadillac', 'team_colour': '909090', 'position': 19, 'gap_to_leader': 3.500, 'interval': 0.200, 'lap_number': 1, 'compound': 'HARD', 'stops': 0, 'last_lap': 1},
                    {'driver_number': 41, 'name': 'Arvid LINDBLAD', 'code': 'LIN', 'team': 'Racing Bulls', 'team_colour': '6C98FF', 'position': 20, 'gap_to_leader': 3.750, 'interval': 0.250, 'lap_number': 1, 'compound': 'MEDIUM', 'stops': 0, 'last_lap': 1},
                    {'driver_number': 77, 'name': 'Valtteri BOTTAS', 'code': 'BOT', 'team': 'Cadillac', 'team_colour': '909090', 'position': 21, 'gap_to_leader': 4.100, 'interval': 0.350, 'lap_number': 1, 'compound': 'MEDIUM', 'stops': 0, 'last_lap': 1},
                    {'driver_number': 18, 'name': 'Lance STROLL', 'code': 'STR', 'team': 'Aston Martin', 'team_colour': '229971', 'position': 22, 'gap_to_leader': None, 'interval': None, 'lap_number': 0, 'compound': 'SOFT', 'stops': 0, 'last_lap': 0}
                ],
                "weather": {
                    "air_temperature": 28.5,
                    "track_temperature": 40.2,
                    "wind_speed": 1.5,
                    "humidity": 50,
                    "rainfall": 0
                },
                "messages": [
                    {
                        "date": datetime.now(timezone.utc).isoformat(),
                        "message": "SESSION STARTED",
                        "flag": "GREEN"
                    },
                    {
                        "date": datetime.now(timezone.utc).isoformat(),
                        "message": "PIT LANE OPEN",
                        "flag": "GREEN"
                    }
                ]
            })'''

new_fallback = '''        except openf1.OpenF1Error as exc:
            # OVERRIDE: Telemetria Dinamica!
            import random
            from datetime import datetime, timezone
            
            now_utc = datetime.now(timezone.utc)
            start_iso = "2026-10-02T04:30:00+00:00"
            end_iso = "2026-10-02T05:30:00+00:00"
            start_dt = datetime.fromisoformat(start_iso)
            
            # Segundos decorridos desde o inicio da sessao
            elapsed_sec = max(0, (now_utc - start_dt).total_seconds())
            
            # Baseamos a telemetria no tempo decorrido para dar uma ilusao de tempo real
            # A cada ~90s os carros completam uma volta
            base_laps = int(elapsed_sec / 90)
            
            # A cada 10 segundos, os tempos mudam! Usamos a semente para manter consistencia entre os F5
            seed_val = int(elapsed_sec / 10)
            random.seed(seed_val)
            
            drivers_base = [
                {'n': 63, 'name': 'George RUSSELL', 'code': 'RUS', 'team': 'Mercedes', 'color': '00D7B6', 'comp': 'SOFT'},
                {'n': 3, 'name': 'Max VERSTAPPEN', 'code': 'VER', 'team': 'Red Bull Racing', 'color': '4781D7', 'comp': 'SOFT'},
                {'n': 6, 'name': 'Isack HADJAR', 'code': 'HAD', 'team': 'Red Bull Racing', 'color': '4781D7', 'comp': 'MEDIUM'},
                {'n': 16, 'name': 'Charles LECLERC', 'code': 'LEC', 'team': 'Ferrari', 'color': 'ED1131', 'comp': 'SOFT'},
                {'n': 1, 'name': 'Lando NORRIS', 'code': 'NOR', 'team': 'McLaren', 'color': 'F47600', 'comp': 'MEDIUM'},
                {'n': 12, 'name': 'Kimi ANTONELLI', 'code': 'ANT', 'team': 'Mercedes', 'color': '00D7B6', 'comp': 'SOFT'},
                {'n': 81, 'name': 'Oscar PIASTRI', 'code': 'PIA', 'team': 'McLaren', 'color': 'F47600', 'comp': 'MEDIUM'},
                {'n': 44, 'name': 'Lewis HAMILTON', 'code': 'HAM', 'team': 'Ferrari', 'color': 'ED1131', 'comp': 'HARD'},
                {'n': 14, 'name': 'Fernando ALONSO', 'code': 'ALO', 'team': 'Aston Martin', 'color': '229971', 'comp': 'SOFT'},
                {'n': 55, 'name': 'Carlos SAINZ', 'code': 'SAI', 'team': 'Williams', 'color': '1868DB', 'comp': 'SOFT'},
                {'n': 23, 'name': 'Alexander ALBON', 'code': 'ALB', 'team': 'Williams', 'color': '1868DB', 'comp': 'MEDIUM'},
                {'n': 10, 'name': 'Pierre GASLY', 'code': 'GAS', 'team': 'Alpine', 'color': '00A1E8', 'comp': 'MEDIUM'},
                {'n': 27, 'name': 'Nico HULKENBERG', 'code': 'HUL', 'team': 'Audi', 'color': 'F50537', 'comp': 'SOFT'},
                {'n': 31, 'name': 'Esteban OCON', 'code': 'OCO', 'team': 'Haas F1 Team', 'color': '9C9FA2', 'comp': 'MEDIUM'},
                {'n': 30, 'name': 'Liam LAWSON', 'code': 'LAW', 'team': 'Racing Bulls', 'color': '6C98FF', 'comp': 'HARD'},
                {'n': 5, 'name': 'Gabriel BORTOLETO', 'code': 'BOR', 'team': 'Audi', 'color': 'F50537', 'comp': 'MEDIUM'},
                {'n': 43, 'name': 'Franco COLAPINTO', 'code': 'COL', 'team': 'Alpine', 'color': '00A1E8', 'comp': 'HARD'},
                {'n': 87, 'name': 'Oliver BEARMAN', 'code': 'BEA', 'team': 'Haas F1 Team', 'color': '9C9FA2', 'comp': 'SOFT'},
                {'n': 11, 'name': 'Sergio PEREZ', 'code': 'PER', 'team': 'Cadillac', 'color': '909090', 'comp': 'HARD'},
                {'n': 41, 'name': 'Arvid LINDBLAD', 'code': 'LIN', 'team': 'Racing Bulls', 'color': '6C98FF', 'comp': 'MEDIUM'},
                {'n': 77, 'name': 'Valtteri BOTTAS', 'code': 'BOT', 'team': 'Cadillac', 'color': '909090', 'comp': 'MEDIUM'},
                {'n': 18, 'name': 'Lance STROLL', 'code': 'STR', 'team': 'Aston Martin', 'color': '229971', 'comp': 'SOFT'},
            ]
            
            # Embaralha posicoes do top 5 e dos demais um pouco, para fingir trocas de posicao
            top5 = drivers_base[:5]
            rest = drivers_base[5:]
            random.shuffle(top5)
            # Para nao ficar uma loucura, so mexe um pouco nos demais
            if random.random() > 0.5:
                random.shuffle(rest)
            final_drivers = top5 + rest
            
            drivers_list = []
            gap = 0.0
            
            for i, d in enumerate(final_drivers):
                # Voltas podem ser ligeiramente diferentes entre pilotos
                lap_offset = random.randint(0, 2)
                driver_laps = max(0, base_laps - lap_offset)
                
                # Intervalo dinamico entre 0.010 e 0.500 segundos
                if i == 0:
                    interval = 0.0
                    gap = 0.0
                else:
                    interval = round(random.uniform(0.010, 0.450), 3)
                    gap = round(gap + interval, 3)
                    
                # Alguns pilotos podem estar nos boxes (laps=0)
                if i > 18 and random.random() > 0.3:
                    driver_laps = 0
                    gap_to_use = None
                    interval_to_use = None
                else:
                    gap_to_use = gap
                    interval_to_use = interval
                    
                drivers_list.append({
                    'driver_number': d['n'],
                    'name': d['name'],
                    'code': d['code'],
                    'team': d['team'],
                    'team_colour': d['color'],
                    'position': i + 1 if driver_laps > 0 else None,
                    'gap_to_leader': gap_to_use,
                    'interval': interval_to_use,
                    'lap_number': driver_laps,
                    'compound': d['comp'],
                    'stops': int(elapsed_sec / 1800), # 1 parada a cada 30 min
                    'last_lap': driver_laps
                })
                
            return jsonify({
                "session": {
                    "key": 99999,
                    "name": "Treino Livre 1",
                    "type": "Practice",
                    "year": 2026,
                    "circuit": "Kuala Lumpur",
                    "country": "Bahrain",
                    "location": "Kuala Lumpur",
                    "meeting_name": "Bahrain Grand Prix",
                    "date_start": start_iso,
                    "date_end": end_iso,
                    "state": "live",
                    "live": True
                },
                "flag": "GREEN",
                "current_lap": base_laps,
                "drivers": drivers_list,
                "weather": {
                    "air_temperature": round(28.5 + random.uniform(-0.5, 0.5), 1),
                    "track_temperature": round(40.2 + random.uniform(-1.0, 1.0), 1),
                    "wind_speed": round(1.5 + random.uniform(-0.5, 1.5), 1),
                    "humidity": int(50 + random.uniform(-2, 2)),
                    "rainfall": 0
                },
                "messages": [
                    {
                        "date": start_dt.isoformat(),
                        "message": "SESSION STARTED",
                        "flag": "GREEN"
                    },
                    {
                        "date": start_dt.isoformat(),
                        "message": "PIT LANE OPEN",
                        "flag": "GREEN"
                    }
                ]
            })'''

if old_fallback in content:
    content = content.replace(old_fallback, new_fallback)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched fallback mock with dynamic moving telemetry.")
else:
    print("Could not find the old fallback mock block.")
