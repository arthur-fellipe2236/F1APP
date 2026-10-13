from app.api.live import detect_session
from datetime import datetime, timezone
import traceback
try:
    print(detect_session(datetime.now(timezone.utc)))
except Exception as e:
    print('ERROR:', e)
    traceback.print_exc()
