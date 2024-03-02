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
# attempt to enable the display of the EURJPY symbol in MarketWatch
selected=mt5.symbol_select("EURJPY",True)
if not selected:
    print("Failed to select EURJPY")
    mt5.shutdown()
    quit()
 
# display EURJPY symbol properties
symbol_info=mt5.symbol_info("EURJPY")
if symbol_info!=None:
    # display the terminal data 'as is'    
    print(symbol_info)
    print("EURJPY: spread =",symbol_info.spread,"  digits =",symbol_info.digits)
    # display symbol properties as a list
    print("Show symbol_info(\"EURJPY\")._asdict():")
    symbol_info_dict = mt5.symbol_info("EURJPY")._asdict()
    for prop in symbol_info_dict:
        print("  {}={}".format(prop, symbol_info_dict[prop]))
 
# shut down connection to the MetaTrader 5 terminal
mt5.shutdown()