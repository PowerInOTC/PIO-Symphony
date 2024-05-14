'''
cd .\Symphony\mt5-connector\;
myenv\Scripts\activate;
python -m uvicorn index:app --reload;
```
cd .\Symphony\mt5-connector\;
python -m venv myenv;
myenv\Scripts\activate;
pip install -r requirements.txt;
python -m uvicorn index:app --reload;
'''
from fastapi import FastAPI, HTTPException, BackgroundTasks
from python.mt5_interaction import (retrieve_inventory_amount, get_total_open_amount, is_connected, 
                             retrieve_all_symbols, retrieve_symbol_info, manage_symbol_inventory, 
                             start_mt5, reset_account, verify_trade_openable,amount_to_lots,lots_to_amount, get_open_positions,
                             retrieve_latest_tick, retrieve_account_free_margin, min_amount_symbol, shutdown_mt5)
from dotenv import load_dotenv
import os
import json
import pandas as pd
import asyncio
load_dotenv()
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from functools import lru_cache
import time


login_id = int(os.getenv('HEDGER1_LOGIN'))
password = os.getenv('HEDGER1_PASSWORD')
server = os.getenv('HEDGER1_SERVER')
identification_token = os.getenv('AZURE_MT5_IDENTIFICATION_TOKEN')


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
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(update_max_notional_task())
    asyncio.create_task(stay_connected_task())
    yield
    shutdown_mt5()

app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/verify-trade")
async def verify_trade_endpoint(payload: dict):
    print("Received request to verify trade")
    symbol = payload.get("symbol")
    volume = payload.get("volume")
    price = payload.get("price")
    
    if symbol is None or volume is None or price is None:
        raise HTTPException(status_code=400, detail="Missing required parameters")
    
    try:
        trade_openable = verify_trade_openable(symbol, volume, price)
        return {"trade_openable": trade_openable}
    except Exception as e:
        print("An error occurred:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

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

@app.post("/manage_symbol_inventory")
async def manage_symbol_inventory_endpoint(payload: dict):
    pair = payload.get("pair")
    b_contract_id = payload.get("b_contract_id")
    amount = payload.get("amount")
    is_long = payload.get("is_long")
    is_open = payload.get("is_open")
    if pair is None or b_contract_id is None or amount is None or is_long is None or is_open is None:
        raise HTTPException(status_code=400, detail="Missing required parameters")
    try:
        success = manage_symbol_inventory(pair, amount, b_contract_id, is_long, is_open)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to manage inventory")
        return {"success": True}
    except Exception as e:
        print("An error occurred:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

def get_cached_open_positions():
    positions = get_open_positions()
    return [
        {
            "order_number": position.ticket,
            "symbol": position.symbol,
            "volume": position.volume,
            "type": position.type,
            "open_price": position.price_open,
            "comment": position.comment
        }
        for position in positions
    ]

@app.get("/open_positions")
async def get_open_positions_endpoint():
    positions = get_cached_open_positions()
    return positions

@app.get("/open_trades")
async def get_open_trades():
    with open("static/open_trades.html") as file:
        html_content = file.read()
    return HTMLResponse(content=html_content, status_code=200)
    


@app.get("/retrieve_max_notional")
async def retrieve_max_notional_endpoint():
    return {"max_notional": max_notional}

@app.get("/min_amount_symbol/{symbol}")
async def min_amount_symbol_endpoint(symbol: str):
    min_amount = min_amount_symbol(symbol)
    lots_to_amount(symbol, min_amount)
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

@app.get("/get_total_open_amount/{symbol}")
async def total_open_amount_endpoint(symbol: str):
    total_open_amount = get_total_open_amount(symbol)
    return total_open_amount

def get_mt5_upnl():
    # Simulating a time-consuming operation
    time.sleep(1)
    return 100

def get_sum_upnl():
    # Simulating a time-consuming operation
    time.sleep(1)
    return 200

def get_onchain_upnl(): 
    # Simulating a time-consuming operation
    time.sleep(1)
    return 300

@app.get("/mt5_upnl")
async def get_upnl():
    mt5_upnl = get_mt5_upnl()
    sum_upnl = get_sum_upnl()
    onchain_upnl = get_onchain_upnl()
    return {
        "mt5_upnl": mt5_upnl,
        "sum_upnl": sum_upnl,
        "onchain_upnl": onchain_upnl
    }


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