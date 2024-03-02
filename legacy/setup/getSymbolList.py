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

symbols = mt5.symbols_get()

valid_symbols_data = []

for symbol in symbols:
    rates = mt5.copy_rates_from_pos(symbol.name, mt5.TIMEFRAME_M1, 0, 1)
    if rates is not None and len(rates) > 0:
        last_bar = rates[0]
        if last_bar['close'] > 0:  # Checking for valid close price
            symbol_data = {
                "MT5Symbol": symbol.name,
                "Symbol": symbol.name.split('.')[0] if '.' in symbol.name else symbol.name,
                "TradeContractSize": 1.0
            }
            print(symbol_data)
            valid_symbols_data.append(symbol_data)

stocks_data = [symbol for symbol in valid_symbols_data if '.' in symbol["MT5Symbol"]]
fx_data = [symbol for symbol in valid_symbols_data if '.' not in symbol["MT5Symbol"]]

with open('stock_symbols.json', 'w') as file:
    json.dump({"Stocks": stocks_data}, file)

with open('fx_symbols.json', 'w') as file:
    json.dump({"FX": fx_data}, file)

mt5.shutdown()
