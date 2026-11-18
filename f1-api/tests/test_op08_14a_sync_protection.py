from app.extensions import db
from app.models import Circuit, Driver, Race, RaceResult
from app import sync


def _reset_sync_tables():
    RaceResult.query.delete()
    Race.query.delete()
    Driver.query.delete()
    Circuit.query.delete()
    db.session.commit()


def test_circuit_matches_equivalent_names_and_preserves_id(app):
    with app.app_context():
        _reset_sync_tables()
        monza = Circuit(name="Autodromo Nazionale di Monza", city="Monza", country="Italy", laps=53)
        db.session.add(monza)
        db.session.commit()
        original_id = monza.id

        reused = sync._upsert_circuit(
            {
                "circuit_short_name": "Autodromo Nazionale Monza",
                "location": "Monza",
                "country_name": "Italia",
            },
            laps=53,
        )
        assert reused.id == original_id
        assert reused.name == "Autodromo Nazionale di Monza"
        assert reused.country == "Italy"
        assert Circuit.query.filter(Circuit.name.ilike("%Monza%")).count() == 1


def test_circuit_matches_known_aliases_and_protects_city_from_country_placeholder(app):
    with app.app_context():
        _reset_sync_tables()
        albert = Circuit(name="Albert Park Grand Prix Circuit", city="Melbourne", country="Australia", laps=58)
        suzuka = Circuit(name="Suzuka Circuit", city="Suzuka", country="Japan", laps=53)
        gilles = Circuit(name="Circuit Gilles Villeneuve", city="Montreal", country="Canada", laps=70)
        zandvoort = Circuit(name="Circuit Park Zandvoort", city="Zandvoort", country="Netherlands", laps=72)
        miami = Circuit(name="Miami", city="Miami Gardens", country="United States", laps=57)
        mexico = Circuit(name="Autódromo Hermanos Rodríguez", city="Mexico City", country="Mexico", laps=71)
        db.session.add_all([albert, suzuka, gilles, zandvoort, miami, mexico])
        db.session.commit()

        cases = [
            (albert.id, "Melbourne", "Australia", {"circuit_short_name": "Melbourne Grand Prix Circuit", "location": "Austrália", "country_name": "Austrália"}),
            (suzuka.id, "Suzuka", "Japan", {"circuit_short_name": "Suzuka International Racing Course", "location": "Japão", "country_name": "Japão"}),
            (gilles.id, "Montreal", "Canada", {"circuit_short_name": "Circuit Gilles-Villeneuve", "location": "Canadá", "country_name": "Canadá"}),
            (zandvoort.id, "Zandvoort", "Netherlands", {"circuit_short_name": "Circuit Zandvoort", "location": "Holanda", "country_name": "Holanda"}),
            (miami.id, "Miami Gardens", "United States", {"circuit_short_name": "Miami International Autodrome", "location": "Miami", "country_name": "Estados Unidos"}),
            (mexico.id, "Mexico City", "Mexico", {"circuit_short_name": "Autodromo Hermanos Rodriguez", "location": "City", "country_name": "México"}),
        ]
        for expected_id, expected_city, expected_country, payload in cases:
            c1 = sync._upsert_circuit(payload, laps=50)
            c2 = sync._upsert_circuit(payload, laps=50)
            assert c1.id == expected_id
            assert c2.id == expected_id
            assert c1.city == expected_city
            assert c1.country == expected_country


def test_circuit_meeting_1308_reuses_sepang_and_never_creates_kuala_lumpur_bahrain(app):
    with app.app_context():
        _reset_sync_tables()
        sepang = Circuit(name="Circuito Internacional de Sepang", city="Sepang", country="Malásia", laps=56)
        bahrain = Circuit(name="Bahrain International Circuit", city="Sakhir", country="Bahrain", laps=57)
        db.session.add_all([sepang, bahrain])
        db.session.commit()

        meeting = {
            "meeting_key": 1308,
            "meeting_name": "Bahrain Grand Prix",
            "location": "Kuala Lumpur",
            "country_name": "Bahrain",
            "circuit_short_name": "Kuala Lumpur",
        }
        snapshot = dict(meeting)
        res1 = sync._upsert_circuit(meeting, laps=55)
        res2 = sync._upsert_circuit(meeting, laps=55)

        assert meeting == snapshot  # nao muta dict de entrada
        assert res1.id == sepang.id
        assert res2.id == sepang.id
        assert Circuit.query.filter_by(name="Kuala Lumpur").first() is None


def test_circuit_does_not_merge_distinct_circuits_in_same_country_or_city(app):
    with app.app_context():
        _reset_sync_tables()
        barcelona = Circuit(name="Circuit de Barcelona-Catalunya", city="Barcelona", country="Spain", laps=66)
        db.session.add(barcelona)
        db.session.commit()

        madrid = sync._upsert_circuit(
            {
                "circuit_short_name": "Madrid Street Circuit",
                "location": "Espanha",
                "country_name": "Espanha",
            },
            laps=50,
        )
        assert madrid.id != barcelona.id

        # Dois circuitos distintos na mesma cidade nao devem ser fundidos por cidade
        barcelona_old = Circuit(name="Montjuïc", city="Barcelona", country="Spain", laps=75)
        db.session.add(barcelona_old)
        db.session.commit()

        third = sync._upsert_circuit(
            {
                "circuit_short_name": "Pedralbes Circuit",
                "location": "Barcelona",
                "country_name": "Spain",
            },
            laps=40,
        )
        assert third.id not in (barcelona.id, barcelona_old.id)


def test_driver_protects_name_variations_and_preserves_canonical_fields(app):
    with app.app_context():
        _reset_sync_tables()
        antonelli = Driver(
            first_name="Andrea",
            last_name="Kimi Antonelli",
            code="ANT",
            nationality="Italiano",
            permanent_number=12,
            series="f1",
        )
        db.session.add(antonelli)
        db.session.commit()
        canon_id = antonelli.id

        # 1. Variacao de nome com codigo confiavel
        d1 = sync._upsert_driver(
            {
                "first_name": "Kimi",
                "last_name": "Antonelli",
                "name_acronym": "ANT",
                "country_code": None,
                "driver_number": 12,
            }
        )
        # 2. Variacao de nome sem codigo e com campos incompletos
        d2 = sync._upsert_driver(
            {
                "first_name": "Kimi",
                "last_name": "Antonelli",
                "name_acronym": None,
                "country_code": None,
            }
        )
        assert d1.id == canon_id
        assert d2.id == canon_id
        assert d1.first_name == "Andrea"
        assert d1.last_name == "Kimi Antonelli"
        assert d1.nationality == "Italiano"
        assert Driver.query.filter(Driver.last_name.ilike("%Antonelli%")).count() == 1


def test_driver_does_not_merge_similar_names_or_incompatible_codes(app):
    with app.app_context():
        _reset_sync_tables()
        michael = Driver(first_name="Michael", last_name="Schumacher", code="MSC", nationality="Alemão", series="f1")
        max_v = Driver(first_name="Max", last_name="Verstappen", code="VER", nationality="Holandês", series="f1")
        db.session.add_all([michael, max_v])
        db.session.commit()

        ralf = sync._upsert_driver(
            {"first_name": "Ralf", "last_name": "Schumacher", "name_acronym": "RSC", "country_code": "GER"}
        )
        vergne = sync._upsert_driver(
            {"first_name": "Jean-Éric", "last_name": "Vergne", "name_acronym": "VER", "country_code": "FRA"}
        )

        assert ralf.id != michael.id
        assert vergne.id != max_v.id


def test_driver_ambiguous_existing_duplicates_are_not_auto_merged(app):
    with app.app_context():
        _reset_sync_tables()
        d_canon = Driver(first_name="Andrea", last_name="Kimi Antonelli", code="ANT", nationality="Italiano", series="f1")
        d_dup = Driver(first_name="Kimi", last_name="Antonelli", code=None, nationality=None, series="f1")
        db.session.add_all([d_canon, d_dup])
        db.session.commit()

        # Se ambos ja existem, nao apaga nem funde registros existentes automaticamente
        res_exact = sync._upsert_driver({"first_name": "Kimi", "last_name": "Antonelli", "name_acronym": None})
        assert res_exact.id == d_dup.id
        assert Driver.query.filter(Driver.last_name.ilike("%Antonelli%")).count() == 2


def test_jolpica_sync_reuses_canonical_circuit_and_driver(app):
    with app.app_context():
        _reset_sync_tables()
        monza = Circuit(name="Autodromo Nazionale di Monza", city="Monza", country="Italy", laps=80)
        db.session.add(monza)
        db.session.commit()

        entry = {
            "raceName": "Italian Grand Prix",
            "date": "1950-09-03",
            "Circuit": {
                "circuitName": "Autodromo Nazionale Monza",
                "Location": {"locality": "Monza", "country": "Italy"},
            },
            "Results": [
                {
                    "position": "1",
                    "points": "8",
                    "grid": "3",
                    "laps": "80",
                    "status": "Finished",
                    "Driver": {"givenName": "Nino", "familyName": "Farina", "nationality": "Italian"},
                    "Constructor": {"name": "Alfa Romeo"},
                }
            ],
        }
        sync._sync_jolpica_race(entry, season=1950, round_=7)
        sync._sync_jolpica_race(entry, season=1950, round_=7)
        race = Race.query.filter_by(season=1950, round=7).first()
        assert race is not None
        assert race.circuit_id == monza.id
        assert Circuit.query.filter(Circuit.name.ilike("%Monza%")).count() == 1
