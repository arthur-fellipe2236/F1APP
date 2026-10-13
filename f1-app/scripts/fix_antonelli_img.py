from app import create_app, db
from app.models import Driver

app = create_app()
with app.app_context():
    # Antonelli headshot
    antonelli = Driver.query.get(238)
    if antonelli:
        antonelli.headshot_url = "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ANDANT01_Andrea_Kimi_Antonelli/andant01.png.transform/1col/image.png"
        db.session.commit()
        print("Updated Antonelli headshot.")
