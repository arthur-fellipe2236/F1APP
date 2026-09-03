from ..extensions import db


class Team(db.Model):
    __tablename__ = "teams"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False, index=True)
    base_country = db.Column(db.String(80))
    engine_manufacturer = db.Column(db.String(80))
    founded_year = db.Column(db.Integer)

    drivers = db.relationship("Driver", back_populates="team", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "base_country": self.base_country,
            "engine_manufacturer": self.engine_manufacturer,
            "founded_year": self.founded_year,
        }


class Driver(db.Model):
    __tablename__ = "drivers"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False, index=True)
    code = db.Column(db.String(3), unique=True)
    permanent_number = db.Column(db.Integer)
    nationality = db.Column(db.String(80))
    headshot_url = db.Column(db.String(300))
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"))

    team = db.relationship("Team", back_populates="drivers")
    results = db.relationship(
        "RaceResult",
        back_populates="driver",
        cascade="all, delete-orphan",
        lazy="select",
    )

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "name": self.full_name,
            "code": self.code,
            "permanent_number": self.permanent_number,
            "nationality": self.nationality,
            "headshot_url": self.headshot_url,
            "team_id": self.team_id,
        }

    def to_dict_detail(self):
        data = self.to_dict()
        data["team"] = self.team.to_dict() if self.team else None
        return data


class Circuit(db.Model):
    __tablename__ = "circuits"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False, index=True)
    city = db.Column(db.String(80))
    country = db.Column(db.String(80))
    length_km = db.Column(db.Float)
    laps = db.Column(db.Integer)

    races = db.relationship("Race", back_populates="circuit", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "city": self.city,
            "country": self.country,
            "length_km": self.length_km,
            "laps": self.laps,
        }


class Race(db.Model):
    __tablename__ = "races"
    __table_args__ = (
        db.UniqueConstraint("season", "round", name="uq_race_season_round"),
    )

    id = db.Column(db.Integer, primary_key=True)
    season = db.Column(db.Integer, nullable=False, index=True)
    round = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    date = db.Column(db.Date)
    circuit_id = db.Column(db.Integer, db.ForeignKey("circuits.id"))

    circuit = db.relationship("Circuit", back_populates="races")
    results = db.relationship(
        "RaceResult",
        back_populates="race",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "season": self.season,
            "round": self.round,
            "name": self.name,
            "date": self.date.isoformat() if self.date else None,
            "circuit_id": self.circuit_id,
            "circuit_name": self.circuit.name if self.circuit else None,
            "circuit_country": self.circuit.country if self.circuit else None,
        }


class RaceResult(db.Model):
    __tablename__ = "race_results"
    __table_args__ = (
        db.UniqueConstraint("race_id", "driver_id", name="uq_race_driver"),
    )

    id = db.Column(db.Integer, primary_key=True)
    race_id = db.Column(db.Integer, db.ForeignKey("races.id"), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey("drivers.id"), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"))
    position = db.Column(db.Integer)
    points = db.Column(db.Float, default=0.0, nullable=False)
    sprint_points = db.Column(db.Float, default=0.0, nullable=False)
    grid = db.Column(db.Integer)
    laps = db.Column(db.Integer)
    status = db.Column(db.String(40), default="finished")
    fastest_lap = db.Column(db.Boolean, default=False)

    race = db.relationship("Race", back_populates="results")
    driver = db.relationship("Driver", back_populates="results")
    team = db.relationship("Team")

    def to_dict(self):
        return {
            "id": self.id,
            "race_id": self.race_id,
            "driver_id": self.driver_id,
            "driver_name": self.driver.full_name if self.driver else None,
            "driver_code": self.driver.code if self.driver else None,
            "driver_nationality": self.driver.nationality if self.driver else None,
            "team_id": self.team_id,
            "team_name": self.team.name if self.team else None,
            "position": self.position,
            "points": self.points,
            "sprint_points": self.sprint_points,
            "grid": self.grid,
            "laps": self.laps,
            "status": self.status,
            "fastest_lap": self.fastest_lap,
        }
