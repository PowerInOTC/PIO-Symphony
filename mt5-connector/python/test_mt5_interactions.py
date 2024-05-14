# test_mt5_interactions.py
from mt5_interaction import retrieve_symbol_info, retrieve_inventory_amount, get_total_open_amount, is_connected, retrieve_all_symbols, retrieve_symbol_info, manage_symbol_inventory, retrieve_max_notional_for_account_leverage, retrieve_open_positions_notionals, start_mt5, initialize_symbols, place_order, reset_account, verify_trade_openable, retrieve_latest_tick, retrieve_account_margin, retrieve_account_free_margin
from dotenv import load_dotenv
import os
import json
import pandas as pd
load_dotenv()


login_id = int(os.getenv('HEDGER1_LOGIN'))
password = os.getenv('HEDGER1_PASSWORD')
server = os.getenv('HEDGER1_SERVER')
start_mt5(login_id, password, server)

reset_account()


# call each second is_connected() // if False, call start_mt5(login_id, password, server)
# call each 1 minutes, or after each calls update_max_notional(leverage)

# FastApi
# retrieve_funding(symbol)
# bid, ask = retrieve_latest_tick(symbol)
# retrieve_all_symbols()
# get_total_open_amount(symbol)
# manage_symbol_inventory(max_notional, symbol, amount)
# reset_account()
# retrieve_max_notional()
