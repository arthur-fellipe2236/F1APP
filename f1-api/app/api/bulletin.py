import hashlib
import re
import urllib.parse
import urllib.request
from flask import Blueprint, jsonify, request, Response
from .auth import optional_token
from .news import f1site, _translate_items
from ..models import Team, Driver

bp = Blueprint('bulletin', __name__)
_audio_cache: dict[str, bytes] = {}

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

def text_to_mp3(text: str) -> bytes:
    cache_key = "tts:" + hashlib.md5(text.encode("utf-8")).hexdigest()
    if cache_key in _audio_cache:
        return _audio_cache[cache_key]

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

def generate_bulletin_script(series: str, current_user) -> str:
    if current_user:
        raw_name = getattr(current_user, 'name', None) or getattr(current_user, 'username', None) or "fã de velocidade"
        first_name = raw_name.strip().split()[0].capitalize()
    else:
        first_name = "fã de velocidade"
    username = first_name

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
            script += "Acelere fundo e até a próxima!"
            return script
        else:
            if series == 'f2':
                return f"Luz verde no pit lane! Olá {first_name}, bem-vindo ao seu giro rápido da Fórmula 2. A estrada para a glória. No momento, as equipes e as academias de pilotos estão focadas nos preparativos aerodinâmicos para a próxima rodada. Fique ligado no painel para acompanhar os talentos que em breve subirão para a categoria principal. Acelere fundo e até a próxima!"
            else:
                return f"Luz verde no pit lane! Olá {first_name}, bem-vindo ao seu giro rápido da Fórmula 3. O berço do automobilismo. O paddock da F3 amanheceu agitado com os testes dos novatos e o ajuste fino dos motores Mechachrome. Não deixe de conferir a aba de Classificação para ver quem lidera o campeonato. Acelere fundo e até a próxima!"

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
        return 'Olá! No momento não temos novidades frescas no paddock da Fórmula 1. Volte mais tarde para novas atualizações.'

    # Translate selected news
    translated = _translate_items(selected)

    script = f"Luz verde no pit lane! Olá {first_name}, bem-vindo ao seu giro rápido da Fórmula 1. "
    if priority_news:
        if team_name:
            script += f"Temos atualizações quentes da {team_name} para você! "
        else:
            script += "Temos atualizações sobre os seus favoritos! "
    else:
        script += "Aqui está o resumo do dia no paddock. "

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

    script += "Essas foram as notícias do momento. Acelere fundo e até a próxima!"
    return script

@bp.get('/news/bulletin')
@optional_token
def get_daily_bulletin(current_user):
    series = request.args.get('series', 'f1')
    script = generate_bulletin_script(series, current_user)
    return jsonify({
        'script': script,
        'audio_url': f'/api/v1/news/bulletin/audio?series={series}'
    })

@bp.get('/news/bulletin/audio')
@optional_token
def get_daily_bulletin_audio(current_user):
    series = request.args.get('series', 'f1')
    script = generate_bulletin_script(series, current_user)
    try:
        audio_data = text_to_mp3(script)
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
