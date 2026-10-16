from ..extensions import db

class Prediction(db.Model):
    __tablename__ = 'predictions'
    __table_args__ = (db.UniqueConstraint('user_id', 'race_id', name='uq_user_race_prediction'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    race_id = db.Column(db.Integer, db.ForeignKey('races.id', ondelete='CASCADE'), nullable=False)
    
    pole_driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id', ondelete='SET NULL'), nullable=True)
    winner_driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id', ondelete='SET NULL'), nullable=True)
    fastest_lap_driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id', ondelete='SET NULL'), nullable=True)
    
    points_earned = db.Column(db.Integer, default=0)
    
    user = db.relationship('User', backref='predictions')
    race = db.relationship('Race')
    pole_driver = db.relationship('Driver', foreign_keys=[pole_driver_id])
    winner_driver = db.relationship('Driver', foreign_keys=[winner_driver_id])
    fastest_lap_driver = db.relationship('Driver', foreign_keys=[fastest_lap_driver_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'race_id': self.race_id,
            'pole_driver_id': self.pole_driver_id,
            'winner_driver_id': self.winner_driver_id,
            'fastest_lap_driver_id': self.fastest_lap_driver_id,
            'points_earned': self.points_earned
        }
