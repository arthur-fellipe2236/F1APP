import hashlib
import io
import json
import os
import re
import urllib.parse
import urllib.request
from flask import Blueprint, jsonify, request, Response, redirect
from .auth import optional_token
from .news import f1site, _translate_items
from ..models import Team, Driver

bp = Blueprint('bulletin', __name__)
_audio_cache: dict[str, bytes] = {}

VOICE_PROFILES = {
    "thalita": {
        "model": "pt-BR-FranciscaNeural",
        "rate": "+3%",
        "pitch": "+0Hz",
    },
    "locutora": {
        "model": "pt-BR-FranciscaNeural",
        "rate": "+3%",
        "pitch": "+0Hz",
    },
    "senna": {
        "model": "pt-BR-AntonioNeural",
        "rate": "-4%",
        "pitch": "-2Hz",
    },
    "piquet": {
        "model": "pt-BR-AntonioNeural",
        "rate": "+4%",
        "pitch": "-4Hz",
    },
    "fittipaldi": {
        "model": "pt-BR-AntonioNeural",
        "rate": "-6%",
        "pitch": "-8Hz",
    },
    "barrichello": {
        "model": "pt-BR-AntonioNeural",
        "rate": "+5%",
        "pitch": "+3Hz",
    },
    "massa": {
        "model": "pt-BR-AntonioNeural",
        "rate": "+8%",
        "pitch": "+5Hz",
    },
    "burti": {
        "model": "pt-BR-AntonioNeural",
        "rate": "+1%",
        "pitch": "-1Hz",
    },
}

DRIVER_PERSONAS = {
    "senna": {
        "intro": "Luz verde no pit lane! Olá {name}, bem-vindo ao nosso giro rápido da Fórmula 1. Como eu sempre digo, o importante é dar sempre o seu máximo e buscar o limite. Vamos ver o que está acontecendo nas pistas hoje... ",
        "outro": "Dedicação e foco na vitória! Até a próxima volta, {name}!",
    },
    "piquet": {
        "intro": "Luz verde no pit lane! Fala {name}! Direto ao ponto, sem historinha: olha só o que esses caras estão aprontando nas equipes hoje... ",
        "outro": "É isso aí, {name}. Quem tiver o melhor carro leva a taça. Falou, até mais!",
    },
    "fittipaldi": {
        "intro": "Luz verde no pit lane! Olá, {name}, um grande abraço a você e a todos os amigos da velocidade! A emoção da Fórmula 1 começa agora com o nosso boletim... ",
        "outro": "Muita velocidade com segurança, {name}. Até breve!",
    },
    "barrichello": {
        "intro": "Luz verde no pit lane! Fala {name}, meu amigo! Que beleza ter você aqui com a gente na Rádio F1! Sabe como é o paddock, né? Ninguém dorme no ponto. Olha só o que está rolando... ",
        "outro": "Valeu demais, {name}! Acelera com tudo e nos vemos na pista!",
    },
    "massa": {
        "intro": "Luz verde no pit lane! E aí, {name}, tudo bem? O paddock amanheceu fervendo e os mecânicos já estão acelerando tudo nas garagens! Deixa eu te contar os destaques... ",
        "outro": "Tamo junto, {name}! Pé embaixo e até a próxima!",
    },
    "burti": {
        "intro": "Luz verde no pit lane! Olá, {name}, tudo bem? Aqui é o Luciano Burti na nossa Rádio F1. Vamos analisar o acerto dos carros, o desgaste de pneus e as novidades aerodinâmicas de hoje... ",
        "outro": "Grande abraço, {name}, e fique de olho na telemetria!",
    },
    "thalita": {
        "intro": "Luz verde no pit lane! Olá {name}, que alegria enorme estar aqui com você na nossa rádio Fórmula Um ponto br! O paddock não para um segundo e o dia hoje tá movimentadíssimo nas garagens. Vamos aos destaques... ",
        "outro": "Fica ligado aqui na nossa cobertura completa, pé cravado no acelerador e até a próxima volta, {name}!",
    },
    "locutora": {
        "intro": "Luz verde no pit lane! Olá {name}, que alegria enorme estar aqui com você na nossa rádio Fórmula Um ponto br! O paddock não para um segundo e o dia hoje tá movimentadíssimo nas garagens. Vamos aos destaques... ",
        "outro": "Fica ligado aqui na nossa cobertura completa, pé cravado no acelerador e até a próxima volta, {name}!",
    },
}

def chunk_text(text: str, max_chars: int = 150) -> list[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_acc = ""

    for s in sentences:
        s = s.strip()
        if not s:
            continue

        if len(current_acc) + len(s) + 1 <= max_chars:
            current_acc = (current_acc + " " + s).strip()
            continue

        if current_acc:
            chunks.append(current_acc)
            current_acc = ""

        if len(s) <= max_chars:
            current_acc = s
            continue

        parts = re.split(r'(?<=[,;:\-–—])\s+', s)
        p_acc = ""
        for p in parts:
            p = p.strip()
            if not p:
                continue
            if len(p_acc) + len(p) + 1 <= max_chars:
                p_acc = (p_acc + " " + p).strip()
            else:
                if p_acc:
                    chunks.append(p_acc)
                    p_acc = ""
                if len(p) <= max_chars:
                    p_acc = p
                else:
                    words = p.split()
                    w_acc = ""
                    for w in words:
                        if len(w_acc) + len(w) + 1 <= max_chars:
                            w_acc = (w_acc + " " + w).strip()
                        else:
                            if w_acc:
                                chunks.append(w_acc)
                            w_acc = w
                    p_acc = w_acc
        if p_acc:
            current_acc = p_acc

    if current_acc:
        chunks.append(current_acc)

    return chunks

def text_to_mp3(text: str, voice: str = "thalita") -> bytes:
    voice = (voice or "thalita").lower().strip()
    cache_key = f"tts:{voice}:" + hashlib.md5(text.encode("utf-8")).hexdigest()
    if cache_key in _audio_cache:
        return _audio_cache[cache_key]

    profile = VOICE_PROFILES.get(voice, VOICE_PROFILES["thalita"])

    # 1. Try high fidelity neural Edge-TTS synthesis
    try:
        import asyncio
        import concurrent.futures
        import edge_tts

        async def _synth():
            comm = edge_tts.Communicate(
                text,
                profile["model"],
                rate=profile.get("rate", "+0%"),
                pitch=profile.get("pitch", "+0Hz")
            )
            bio = io.BytesIO()
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    bio.write(chunk["data"])
            return bio.getvalue()

        def _run_coro(coro):
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            if loop.is_running():
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    return executor.submit(asyncio.run, coro).result(timeout=25)
            else:
                return loop.run_until_complete(coro)

        audio_bytes = _run_coro(_synth())
        if audio_bytes and len(audio_bytes) > 200:
            _audio_cache[cache_key] = audio_bytes
            return audio_bytes
    except Exception as e:
        print(f"Edge-TTS failed ({e}), falling back to Google TTS")

    # 2. Fallback to Google TTS chunks
    chunks = chunk_text(text, 150)
    audio_bytes = bytearray()
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    for chunk in chunks:
        q = urllib.parse.quote(chunk)
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q={q}"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            audio_bytes.extend(resp.read())

    res = bytes(audio_bytes)
    _audio_cache[cache_key] = res
    return res

def generate_bulletin_script(series: str, current_user, voice: str = "thalita") -> str:
    voice = (voice or "thalita").lower().strip()
    persona = DRIVER_PERSONAS.get(voice, DRIVER_PERSONAS["thalita"])

    if current_user:
        raw_name = getattr(current_user, 'name', None) or getattr(current_user, 'username', None) or "fã de velocidade"
        first_name = raw_name.strip().split()[0].capitalize()
    else:
        first_name = "fã de velocidade"

    if series in ('f2', 'f3'):
        try:
            from .news import fetch_rss_news
            rss_items = fetch_rss_news(series, limit=2)
        except Exception:
            rss_items = []

        series_name = "Fórmula 2" if series == "f2" else "Fórmula 3"
        script = f"Luz verde no pit lane! Olá {first_name}, bem-vindo ao seu giro rápido da {series_name}. "

        if rss_items:
            script += "Aqui estão as principais notícias da categoria. "
            for i, it in enumerate(rss_items):
                title = (it.get('title') or '').strip().rstrip('.')
                desc = (it.get('meta_description') or '').strip().rstrip('.')
                desc = re.sub(r'[\.…]+$', '', desc).strip()
                if desc.lower() == title.lower():
                    desc = ""

                if i == 0:
                    script += f"Primeiro destaque: {title}. "
                    if desc:
                        script += f"{desc}. "
                else:
                    script += f"Outra novidade: {title}. "
                    if desc:
                        script += f"{desc}. "
            script += persona["outro"].format(name=first_name)
            return script
        else:
            if series == 'f2':
                return f"Luz verde no pit lane! Olá {first_name}, bem-vindo ao seu giro rápido da Fórmula 2. A estrada para a glória. No momento, as equipes e as academias de pilotos estão focadas nos preparativos aerodinâmicos para a próxima rodada. Fique ligado no painel para acompanhar os talentos que em breve subirão para a categoria principal. {persona['outro'].format(name=first_name)}"
            else:
                return f"Luz verde no pit lane! Olá {first_name}, bem-vindo ao seu giro rápido da Fórmula 3. O berço do automobilismo. O paddock da F3 amanheceu agitado com os testes dos novatos e o ajuste fino dos motores Mechachrome. Não deixe de conferir a aba de Classificação para ver quem lidera o campeonato. {persona['outro'].format(name=first_name)}"

    # Fetch latest F1 news
    try:
        articles = f1site.fetch_news(limit=15)
    except Exception:
        articles = []

    team_name = None
    driver_name = None
    if current_user:
        if current_user.favorite_team_id:
            team = Team.query.get(current_user.favorite_team_id)
            if team:
                team_name = team.name

        if current_user.favorite_driver_id:
            driver = Driver.query.get(current_user.favorite_driver_id)
            if driver:
                driver_name = driver.last_name

    # Filter news based on favorites
    priority_news = []
    other_news = []

    for a in articles:
        text = (a['title'] + ' ' + a.get('meta_description', '')).lower()
        if (team_name and team_name.lower() in text) or (driver_name and driver_name.lower() in text):
            priority_news.append(a)
        else:
            other_news.append(a)

    # Select top 3 news to read
    selected = priority_news[:2] + other_news[:(3 - min(2, len(priority_news)))]

    if not selected:
        return f"Luz verde no pit lane! Olá {first_name}. No momento não temos novidades frescas no paddock da Fórmula 1. Volte mais tarde para novas atualizações da pista."

    # Translate selected news
    translated = _translate_items(selected)

    # Build persona script
    script = persona["intro"].format(name=first_name)
    if priority_news:
        if team_name:
            script += f"Temos atualizações quentes da {team_name} para você! "
        else:
            script += "Temos atualizações sobre os seus favoritos! "

    for i, a in enumerate(translated):
        title = (a.get('title') or '').strip().rstrip('.')
        desc = (a.get('meta_description') or '').strip().rstrip('.')
        desc = re.sub(r'[\.…]+$', '', desc).strip()
        if desc.lower() == title.lower():
            desc = ""

        if i == 0:
            script += f"O principal destaque do dia: {title}. "
            if desc:
                script += f"{desc}. "
        elif i == 1:
            script += f"Outra novidade importante: {title}. "
            if desc:
                script += f"{desc}. "
        else:
            script += f"E fechando o boletim: {title}. "
            if desc:
                script += f"{desc}. "

    script += persona["outro"].format(name=first_name)
    return script

@bp.get('/news/bulletin')
@optional_token
def get_daily_bulletin(current_user):
    series = request.args.get('series', 'f1')
    voice = request.args.get('voice', 'thalita').lower()
    script = generate_bulletin_script(series, current_user, voice=voice)
    hybrid_drivers = {'senna', 'piquet', 'fittipaldi', 'emerson', 'barrichello', 'massa', 'burti', 'thalita', 'locutora'}
    driver_folder = 'fittipaldi' if voice == 'emerson' else voice
    audio_url = f'/audio/{driver_folder}/hibrido.mp3' if voice in hybrid_drivers else f'/api/v1/news/bulletin/audio?series={series}&voice={voice}'
    return jsonify({
        'script': script,
        'voice': voice,
        'audio_url': audio_url
    })

@bp.get('/news/bulletin/audio')
@optional_token
def get_daily_bulletin_audio(current_user):
    series = request.args.get('series', 'f1')
    voice = request.args.get('voice', 'thalita').lower()
    hybrid_drivers = {'senna', 'piquet', 'fittipaldi', 'emerson', 'barrichello', 'massa', 'burti', 'thalita', 'locutora'}
    if voice in hybrid_drivers:
        driver_folder = 'fittipaldi' if voice == 'emerson' else voice
        return redirect(f'/audio/{driver_folder}/hibrido.mp3', code=302)
    script = generate_bulletin_script(series, current_user, voice=voice)
    try:
        audio_data = text_to_mp3(script, voice=voice)
        return Response(
            audio_data,
            mimetype="audio/mpeg",
            headers={
                "Content-Type": "audio/mpeg",
                "Content-Length": str(len(audio_data)),
                "Cache-Control": "public, max-age=180",
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.get('/news/bulletin/voices')
def get_bulletin_voices():
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'audio', 'drivers_audio_dataset.json')
    if os.path.exists(dataset_path):
        try:
            with open(dataset_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return jsonify(data)
        except Exception:
            pass
    return jsonify({
        "drivers": [
            {"id": "thalita", "name": "Thalita", "title": "Estúdio Oficial", "avatar": "/radio/thalita.svg"},
            {"id": "senna", "name": "Ayrton Senna", "title": "Tricampeão Mundial", "avatar": "/radio/senna.jpg"},
            {"id": "piquet", "name": "Nelson Piquet", "title": "Tricampeão Mundial", "avatar": "/radio/piquet.jpg"},
            {"id": "fittipaldi", "name": "Emerson Fittipaldi", "title": "Bicampeão Mundial", "avatar": "/radio/fittipaldi.jpg"},
            {"id": "barrichello", "name": "Rubens Barrichello", "title": "Recordista & Vice", "avatar": "/radio/barrichello.jpg"},
            {"id": "massa", "name": "Felipe Massa", "title": "Vice-campeão Mundial", "avatar": "/radio/massa.jpg"},
            {"id": "burti", "name": "Luciano Burti", "title": "Comentarista Técnico", "avatar": "/radio/burti.jpg"},
        ]
    })
