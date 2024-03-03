import MetaTrader5 as mt5
from dotenv import load_dotenv
import os
import json

load_dotenv()

login_id = int(os.getenv('MT5_LOGIN'))
password = os.getenv('MT5_PASSWORD')
server = os.getenv('MT5_SERVER')

if not mt5.initialize():
    print(json.dumps({"error": "initialize() failed", "code": mt5.last_error()}))
    quit()

if not mt5.login(login_id, password=password, server=server):
    print(json.dumps({"error": "login() failed", "code": mt5.last_error()}))
    mt5.shutdown()
    quit()
stock_symbol = "MSFT.NAS"  # Replace with your stock symbol

# Method 1: Using symbol_info_tick() to get the latest tick (bid and ask price)
tick_info = mt5.symbol_info_tick(stock_symbol)
if tick_info:
    print(f"Method 1 - symbol_info_tick:\nBid: {tick_info.bid}, Ask: {tick_info.ask}")

# Method 2: Using symbol_info() to get last price
symbol_info = mt5.symbol_info(stock_symbol)
if symbol_info:
    print(f"Method 2 - symbol_info:\nLast price: {symbol_info.ask}")

# Method 3: Using copy_rates_from_pos() to get the latest bar information
rates = mt5.copy_rates_from_pos(stock_symbol, mt5.TIMEFRAME_M1, 0, 1)
if rates:
    last_bar = rates[0]
    print(f"Method 3 - copy_rates_from_pos:\nClose price of the last bar: {last_bar['close']}")

# Shutdown MT5 connection
mt5.shutdown()