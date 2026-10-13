from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    favorite_driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=True)
    favorite_team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=True)

    driver = db.relationship('Driver', backref='fans')
    team = db.relationship('Team', backref='fans')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'is_admin': self.is_admin,
            'favorite_driver_id': self.favorite_driver_id,
            'favorite_team_id': self.favorite_team_id,
            'favorite_driver': self.driver.full_name if self.driver else None,
            'favorite_team': self.team.name if self.team else None
        }
