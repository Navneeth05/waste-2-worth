import time
from utils import expire_food

print("⏳ Scheduler started...")

while True:
    expire_food()
    time.sleep(300)  # every 5 minutes