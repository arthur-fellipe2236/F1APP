from flasgger import Swagger

DRIVER_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "integer", "example": 1},
        "first_name": {"type": "string", "example": "Max"},
        "last_name": {"type": "string", "example": "Verstappen"},
        "name": {"type": "string", "example": "Max Verstappen"},
        "code": {"type": "string", "nullable": True, "example": "VER"},
        "permanent_number": {"type": "integer", "nullable": True, "example": 1},
        "nationality": {"type": "string", "example": "Neerlandes"},
        "headshot_url": {
            "type": "string",
            "nullable": True,
            "example": "https://www.formula1.com/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png",
        },
        "team_id": {"type": "integer", "nullable": True, "example": 1},
    },
}

DRIVER_DETAIL_SCHEMA = {
    "allOf": [
        DRIVER_SCHEMA,
        {
            "type": "object",
            "properties": {
                "team": {"nullable": True, "$ref": "#/components/schemas/Team"}
            },
        },
    ]
}

DRIVER_INPUT_SCHEMA = {
    "type": "object",
    "required": ["first_name", "last_name"],
    "properties": {
        "first_name": {"type": "string", "example": "Gabriel"},
        "last_name": {"type": "string", "example": "Bortoleto"},
        "code": {"type": "string", "maxLength": 3, "example": "BOR"},
        "permanent_number": {"type": "integer", "minimum": 1, "example": 5},
        "nationality": {"type": "string", "example": "Brasileiro"},
        "team_id": {"type": "integer", "example": 1},
    },
}

TEAM_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "integer", "example": 1},
        "name": {"type": "string", "example": "Red Bull Racing"},
        "base_country": {"type": "string", "example": "Austria"},
        "engine_manufacturer": {"type": "string", "example": "Honda RBPT"},
        "founded_year": {"type": "integer", "example": 2005},
    },
}

TEAM_INPUT_SCHEMA = {
    "type": "object",
    "required": ["name"],
    "properties": {
        "name": {"type": "string", "example": "Carlin Racing"},
        "base_country": {"type": "string", "example": "Reino Unido"},
        "engine_manufacturer": {"type": "string", "example": "Mercedes"},
        "founded_year": {"type": "integer", "example": 2026},
    },
}

CIRCUIT_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "integer", "example": 1},
        "name": {"type": "string", "example": "Bahrain International Circuit"},
        "city": {"type": "string", "example": "Sakhir"},
        "country": {"type": "string", "example": "Bahrein"},
        "length_km": {"type": "number", "example": 5.412},
        "laps": {"type": "integer", "example": 57},
        "round": {
            "type": "integer",
            "nullable": True,
            "description": "Somente na listagem com season",
            "example": 1,
        },
        "winner": {
            "type": "object",
            "nullable": True,
            "description": "Vencedor da corrida mais recente do circuito",
            "properties": {
                "name": {"type": "string", "example": "Max Verstappen"},
                "code": {"type": "string", "nullable": True, "example": "VER"},
                "nationality": {
                    "type": "string",
                    "nullable": True,
                    "example": "Neerlandês",
                },
            },
        },
    },
}

CIRCUIT_INPUT_SCHEMA = {
    "type": "object",
    "required": ["name"],
    "properties": {
        "name": {"type": "string", "example": "Circuit de Madrid"},
        "city": {"type": "string", "example": "Madrid"},
        "country": {"type": "string", "example": "Espanha"},
        "length_km": {"type": "number", "example": 4.7},
        "laps": {"type": "integer", "example": 70},
    },
}

RACE_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "integer", "example": 1},
        "season": {"type": "integer", "example": 2024},
        "round": {"type": "integer", "example": 1},
        "name": {"type": "string", "example": "Bahrain Grand Prix"},
        "date": {"type": "string", "format": "date", "example": "2024-03-02"},
        "circuit_id": {"type": "integer", "example": 1},
        "circuit_name": {"type": "string", "example": "Bahrain International Circuit"},
        "circuit_country": {"type": "string", "example": "Bahrein"},
    },
}

RACE_RESULT_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "integer", "example": 1},
        "race_id": {"type": "integer", "example": 1},
        "driver_id": {"type": "integer", "example": 1},
        "driver_name": {"type": "string", "example": "Max Verstappen"},
        "driver_code": {"type": "string", "example": "VER"},
        "driver_nationality": {"type": "string", "nullable": True, "example": "Neerlandês"},
        "position": {"type": "integer", "example": 1},
        "points": {"type": "number", "example": 25},
        "sprint_points": {"type": "number", "example": 0},
        "team_id": {"type": "integer", "nullable": True, "example": 3},
        "team_name": {"type": "string", "nullable": True, "example": "McLaren"},
        "grid": {"type": "integer", "example": 3},
        "laps": {"type": "integer", "example": 57},
        "status": {"type": "string", "example": "finished"},
        "fastest_lap": {"type": "boolean", "example": True},
    },
}

DRIVER_STANDING_SCHEMA = {
    "type": "object",
    "properties": {
        "driver_id": {"type": "integer", "example": 1},
        "driver_name": {"type": "string", "example": "Max Verstappen"},
        "driver_code": {"type": "string", "example": "VER"},
        "nationality": {"type": "string", "nullable": True, "example": "Neerlandês"},
        "headshot_url": {"type": "string", "nullable": True},
        "team_name": {"type": "string", "nullable": True, "example": "Red Bull Racing"},
        "points": {"type": "number", "example": 354},
        "wins": {"type": "integer", "example": 9},
        "podiums": {"type": "integer", "example": 19},
        "races": {"type": "integer", "example": 24},
    },
}

TEAM_STANDING_SCHEMA = {
    "type": "object",
    "properties": {
        "team_id": {"type": "integer", "example": 3},
        "team_name": {"type": "string", "example": "McLaren"},
        "points": {"type": "number", "example": 666},
        "wins": {"type": "integer", "example": 6},
        "podiums": {"type": "integer", "example": 17},
        "races": {"type": "integer", "example": 24},
    },
}

META_SCHEMA = {
    "type": "object",
    "properties": {
        "page": {"type": "integer", "example": 1},
        "per_page": {"type": "integer", "example": 10},
        "total": {"type": "integer", "example": 20},
        "pages": {"type": "integer", "example": 2},
    },
}

ERROR_SCHEMA = {
    "type": "object",
    "properties": {
        "error": {"type": "string", "example": "Campos obrigatorios ausentes"},
        "details": {"type": "object"},
    },
}

SCHEMAS = {
    "Driver": DRIVER_SCHEMA,
    "DriverDetail": DRIVER_DETAIL_SCHEMA,
    "DriverInput": DRIVER_INPUT_SCHEMA,
    "Team": TEAM_SCHEMA,
    "TeamInput": TEAM_INPUT_SCHEMA,
    "Circuit": CIRCUIT_SCHEMA,
    "CircuitInput": CIRCUIT_INPUT_SCHEMA,
    "Race": RACE_SCHEMA,
    "RaceResult": RACE_RESULT_SCHEMA,
    "DriverStanding": DRIVER_STANDING_SCHEMA,
    "TeamStanding": TEAM_STANDING_SCHEMA,
    "Meta": META_SCHEMA,
    "Error": ERROR_SCHEMA,
}


TEMPLATE = {
    "openapi": "3.0.3",
    "info": {
        "title": "API Formula 1",
        "description": (
            "API REST de Formula 1 construida com Flask + SQLAlchemy, seguindo "
            "o padrao OpenAPI 3. Fonte de dados: OpenF1 (2023+) e Jolpica/Ergast "
            "(2022 e anteriores). Veja https://openf1.org e https://api.jolpi.ca."
        ),
        "version": "1.0.0",
        "contact": {"name": "Equipe F1 API"},
    },
    "servers": [{"url": "http://localhost:5000", "description": "Servidor local"}],
    "tags": [
        {"name": "Health", "description": "Status do servico"},
        {"name": "Drivers", "description": "Pilotos"},
        {"name": "Teams", "description": "Equipes (construtores)"},
        {"name": "Circuits", "description": "Circuitos"},
        {"name": "Races", "description": "Corridas e resultados"},
        {"name": "Standings", "description": "Classificacoes do campeonato"},
        {"name": "Sync", "description": "Sincronizacao de dados com a OpenF1"},
        {"name": "News", "description": "Noticias do site oficial formula1.com"},
        {"name": "Live", "description": "Live timing (torre de tempos da OpenF1)"},
        {"name": "Media", "description": "Proxy de imagens otimizadas (WebP/Blob)"},
    ],
    "components": {"schemas": SCHEMAS},
}


def init_swagger(app):
    app.config["SWAGGER"] = {
        "title": "API Formula 1",
        "version": "1.0.0",
        "openapi": "3.0.3",
        "uiversion": 3,
        "specs_route": "/apidocs/",
    }
    Swagger(app, template=TEMPLATE)
