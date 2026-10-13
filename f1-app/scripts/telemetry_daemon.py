import time
import subprocess
import sys
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def run_daemon():
    logging.info("Starting Live Telemetry Scraper Daemon...")
    while True:
        try:
            logging.info("Running scraper...")
            # We use the python executable from the virtual environment
            subprocess.run(["/home/arthur/Projects/f1-api/.venv/bin/python", "/home/arthur/Projects/f1-app/scripts/scrape_accurate.py"], check=True)
            logging.info("Scraper finished. Sleeping for 30 seconds...")
        except subprocess.CalledProcessError as e:
            logging.error(f"Scraper failed with exit code {e.returncode}")
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            
        time.sleep(15)

if __name__ == "__main__":
    run_daemon()
