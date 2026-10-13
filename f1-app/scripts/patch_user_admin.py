import re

with open('../f1-api/app/models/user.py', 'r') as f:
    content = f.read()

if 'is_admin = db.Column(db.Boolean' not in content:
    content = content.replace('password_hash = db.Column(db.String(128), nullable=False)', 'password_hash = db.Column(db.String(128), nullable=False)\n    is_admin = db.Column(db.Boolean, default=False)')
    
    # Update to_dict
    content = content.replace("'username': self.username,", "'username': self.username,\n            'is_admin': self.is_admin,")

    with open('../f1-api/app/models/user.py', 'w') as f:
        f.write(content)
print("Added is_admin to User model")
