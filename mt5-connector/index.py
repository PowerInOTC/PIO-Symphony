'''
index.py
python -m uvicorn index:app --reload
'''
from fastapi import FastAPI, HTTPException, BackgroundTasks
from python.mt5_interaction import (retrieve_inventory_amount, get_total_open_amount, is_connected, 
                             retrieve_all_symbols, retrieve_symbol_info, manage_symbol_inventory, 
                             retrieve_max_notional_for_account_leverage, retrieve_open_positions_notionals, 
                             start_mt5, reset_account, verify_trade_openable, 
                             retrieve_latest_tick, retrieve_account_free_margin, min_amount_symbol, shutdown_mt5)
from dotenv import load_dotenv
import os
import json
import pandas as pd
import asyncio
load_dotenv()
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware


login_id = int(os.getenv('HEDGER1_LOGIN'))
password = os.getenv('HEDGER1_PASSWORD')
server = os.getenv('HEDGER1_SERVER')


start_mt5(login_id, password, server)

max_notional = 0
leverage = 100

async def update_max_notional_task():
    global max_notional
    while True:
        max_notional = retrieve_account_free_margin()
        print(max_notional)
        await asyncio.sleep(60)

async def stay_connected_task():
    while True:
        if is_connected():
            print("MT5 is connected")
        else:
            print("MT5 is not connected. Reconnecting...")
            start_mt5(login_id, password, server)
        await asyncio.sleep(1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(update_max_notional_task())
    asyncio.create_task(stay_connected_task())
    yield
    shutdown_mt5()

app = FastAPI(lifespan=lifespan)

@app.get("/retrieve_funding/{symbol}")
async def retrieve_funding(symbol: str):
    funding = {}
    return funding

@app.get("/retrieve_latest_tick/{symbol}")
async def retrieve_latest_tick_endpoint(symbol: str):
    bid, ask = retrieve_latest_tick(symbol)
    return {"bid": bid, "ask": ask}

@app.get("/retrieve_all_symbols")
async def retrieve_all_symbols_endpoint():
    symbols = retrieve_all_symbols()
    return {"symbols": symbols}

@app.get("/get_total_open_amount/{symbol}")
async def get_total_open_amount_endpoint(symbol: str):
    total_open_amount = get_total_open_amount(symbol)
    return {"total_open_amount": total_open_amount}

@app.post("/manage_symbol_inventory/{symbol}")
async def manage_symbol_inventory_endpoint(symbol: str, amount: float):
    success = manage_symbol_inventory(max_notional, symbol, amount)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to manage inventory")
    return {"success": True}

@app.post("/reset_account")
async def reset_account_endpoint():
    reset_account()
    return {"success": True}

@app.get("/retrieve_max_notional")
async def retrieve_max_notional_endpoint():
    return {"max_notional": max_notional}

@app.get("/min_amount_symbol/{symbol}")
async def min_amount_symbol_endpoint(symbol: str):
    min_amount = min_amount_symbol(symbol)
    return {"min_amount": min_amount}

@app.get("/symbol_info/{symbol}")
async def symbol_info_endpoint(symbol: str):
    symbol_info = retrieve_symbol_info(symbol)
    print(symbol_info)
    return symbol_info

@app.get("/precision_info/{symbol}")
async def symbol_info_endpoint(symbol: str):
    symbol_info = retrieve_symbol_info(symbol)
    return symbol_info.trade_tick_size

@app.get("/funding_long_info/{symbol}")
async def symbol_info_endpoint(symbol: str):
    symbol_info = retrieve_symbol_info(symbol)
    return symbol_info.swap_short

@app.get("/funding_short_info/{symbol}")
async def symbol_info_endpoint(symbol: str):
    symbol_info = retrieve_symbol_info(symbol)
    return symbol_info.swap_short

@app.get("/min_ammount_asset_info/{symbol}")
async def symbol_info_endpoint(symbol: str):
    symbol_info = retrieve_symbol_info(symbol)
    return symbol_info.volume_min * symbol_info.trade_contract_size

@app.get("/max_ammount_asset_info/{symbol}")
async def symbol_info_endpoint(symbol: str):
    symbol_info = retrieve_symbol_info(symbol)
    return symbol_info.volume_max * symbol_info.trade_contract_size

# Allow requests from all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)