
import MetaTrader5 as mt5
from dotenv import load_dotenv
import os
import json
import pandas as pd

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


class MT5:
    def __init__(self):
        pass

    def balance():
        account = mt5.account_info()
        return account.balance

    def leverage():
        account = mt5.account_info()
        return account.leverage
    
    def hedging_ir_cost(asset):
        symbols=mt5.symbols_get(asset)
        return s.swap_rollover3days

    def broker_minimal_notional(asset):
        symbol_info = mt5.symbol_info(asset)
        return symbol_info.volume_min * symbol_info.trade_contract_size

    def broker_fee(asset):
        return 0.0001
        
    def broker_spread(asset):
        return 0.0001
    
    def is_market_open():
        return True
 
mt6 = MT5()
balance = mt5.account_info()
print(balance.balance, "balance")

def get_symbol_info(symbol):
    symbol_info = mt5.symbol_info(symbol)
    if symbol_info is not None:
        print(symbol_info)
        print(symbol_info.swap_rollover3days)
        print(symbol_info.trade_contract_size)
        print(symbol_info.volume_min)
        print(symbol_info.swap_long)
        print(symbol_info.swap_short)
    else:
        print("Failed to get symbol_info for ", symbol)

    


symbol = "CHFJPY"
get_symbol_info(symbol)

lot = 0.1
point = mt5.symbol_info(symbol).point
price = mt5.symbol_info_tick(symbol).bid
deviation = 20
order_type= mt5.ORDER_TYPE_BUY

margin=mt5.order_calc_margin(mt5.ORDER_TYPE_BUY, symbol, lot, price)
print("margin :", margin)

request = {
            'action': mt5.TRADE_ACTION_DEAL,
            'symbol': symbol,
            'volume': lot,
            'type': order_type,
            'price': price,
            'type_time': mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }


# send a trading request
result=mt5.order_send(request)
if result is not None and result.retcode != mt5.TRADE_RETCODE_DONE:
    print(f"Failed to open position for {symbol}. Error code: {result.retcode}, Comment: {result.comment}")
elif result is not None:
    print(f"Opened position for {symbol}: {result.comment}")
else:
    print(f"Failed to open position for {symbol}. The order_send function returned None.")

print(result)

positions = mt5.positions_get(symbol=symbol)
print(positions)


# shut down connection to the MetaTrader 5 terminal
mt5.shutdown()