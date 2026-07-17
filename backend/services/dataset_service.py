import csv
import os

FILE_PATH = "dataset.csv"


def save_row(row: dict):
    file_exists = os.path.isfile(FILE_PATH)

    with open(FILE_PATH, mode="a", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=row.keys())

        if not file_exists:
            writer.writeheader()

        writer.writerow(row)


def generate_label(current_price, future_price):
    """
    If future price > current price → BUY
    else → SELL
    """
    if future_price > current_price:
        return "BUY"
    else:
        return "SELL"
    