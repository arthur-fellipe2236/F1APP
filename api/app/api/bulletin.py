from flask import Blueprint, jsonify, request
from .auth import token_required
from .news import f1site, _translate_items
from ..models import Team, Driver

bp = Blueprint('bulletin', __name__)

@bp.get('/news/bulletin')
@token_required
def get_daily_bulletin(current_user):
    series = request.args.get('series', 'f1')
    
    if series == 'f2':
        script = f"Olá {current_user.username}, bem-vindo à Rádio Fórmula 2. A estrada para a glória. "
        script += "No momento, as equipes e as academias de pilotos estão focadas nos preparativos aerodinâmicos para a próxima rodada. "
        script += "Fique ligado no painel para acompanhar os talentos que em breve subirão para a categoria principal. Acelere fundo e até a próxima!"
        return jsonify({'script': script})
        
    elif series == 'f3':
        script = f"Olá {current_user.username}, você está na Rádio Fórmula 3. O berço do automobilismo. "
        script += "O paddock da F3 amanheceu agitado com os testes dos novatos e o ajuste fino dos motores Mechachrome. "
        script += "Não deixe de conferir a aba de Classificação para ver quem lidera o campeonato. Acelere fundo e até a próxima!"
        return jsonify({'script': script})
        
    # Fetch latest F1 news
    try:
        articles = f1site.fetch_news(limit=15)
    except Exception:
        articles = []
        
    team_name = None
    if current_user.favorite_team_id:
        team = Team.query.get(current_user.favorite_team_id)
        if team:
            team_name = team.name
            
    driver_name = None
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
        return jsonify({'script': 'Olá! No momento não temos novidades frescas no paddock da Fórmula 1. Volte mais tarde para novas atualizações.'})
        
    # Translate selected news
    translated = _translate_items(selected)
    
    script = f"Olá {current_user.username}, aqui é a sua Rádio F1. "
    if priority_news:
        if team_name:
            script += f"Temos atualizações quentes da {team_name} para você! "
        else:
            script += "Temos atualizações sobre os seus favoritos! "
    else:
        script += "Aqui está o resumo do dia no paddock. "
        
    for i, a in enumerate(translated):
        if i == 0:
            script += f"O principal destaque: {a['title']}. "
        elif i == 1:
            script += f"Outra novidade é que {a['title']}. "
        else:
            script += f"Por fim, {a['title']}. "
            
    script += "Essas foram as notícias do momento. Acelere fundo e até a próxima!"
    
    return jsonify({'script': script})
