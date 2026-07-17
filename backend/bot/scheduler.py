from apscheduler.schedulers.background import BackgroundScheduler
from services.trade_monitor import monitor_open_trades

scheduler = BackgroundScheduler()

def start_bot():

    print("Bot Started")
    scheduler.add_job(
        monitor_open_trades,
        "interval",
        seconds=10
    )

    scheduler.start()