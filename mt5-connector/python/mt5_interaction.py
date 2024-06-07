import time
from python.mt5_connection import MT5ConnectionSingleton
import MetaTrader5

def manage_single_symbol_inventory(symbol, amount, b_contract_id, is_long, is_open):
    print(f"manage_single_symbol_inventory called with symbol: {symbol}, amount: {amount}, b_contract_id: {b_contract_id}, is_long: {is_long}, is_open: {is_open}")
    mt5 = MT5ConnectionSingleton().get_mt5()
    print("manage_single_symbol_inventory", mt5)

    max_retries = 3
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            if not MT5ConnectionSingleton().is_connected():
                print(f"MetaTrader5 is not connected. Retrying in {retry_delay} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(retry_delay)
                continue
            
            lots = amount_to_lots(amount, symbol)

            if is_open:
                if is_long:
                    success = place_order("BUY", symbol, lots, str(b_contract_id), True)
                else:
                    success = place_order("SELL", symbol, lots, str(b_contract_id), True)
                
                if not success:
                    print("Order placement failed")
                    return False
            else:
                positions = get_open_positions()
                closed_successfully = False
                for position in positions:
                    if position.symbol == symbol and position.comment == str(b_contract_id):
                        if is_long and position.type == 0:  # Long position
                            print(f"Closing long position for {symbol} with volume: {position.volume}")
                            success = place_order("SELL", symbol, position.volume, str(b_contract_id), True, position.price_current, position.ticket)
                            if success:
                                closed_successfully = True
                        elif not is_long and position.type == 1:  # Short position
                            print(f"Closing short position for {symbol} with volume: {position.volume}")
                            success = place_order("BUY", symbol, position.volume, str(b_contract_id), True, position.price_current, position.ticket)
                            if success:
                                closed_successfully = True
                
                if not closed_successfully:
                    print("No matching position found or closing failed")
                    return False
            
            print("manage_single_symbol_inventory executed successfully")
            return True
        
        except Exception as e:
            print(f"An error occurred in manage_single_symbol_inventory")
            
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(retry_delay)
            else:
                print("Max retries reached. Aborting.")
                return False
            
def place_order(order_type, symbol, volume, comment, direct=False, price=0, order_number=None):
    mt5 = MT5ConnectionSingleton().get_mt5()
    print("place_order", symbol, volume, order_type, comment, direct, price)

    if not mt5.initialize():
        print("Failed to initialize MetaTrader5")
        return False

    account_info = mt5.account_info()
    if account_info is None:
        print("Failed to retrieve account info. Ensure MetaTrader5 is connected and the account is valid.")
        return False
    
    terminal_info = mt5.terminal_info()
    if terminal_info is None:
        print("Failed to retrieve terminal info. Ensure MetaTrader5 is connected and properly set up.")
        return False
    
    if price == 0:
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            print(f"Error retrieving tick data for {symbol}")
            return False
        if order_type == "SELL":
            price = tick.ask
        elif order_type == "BUY":
            price = tick.bid
        else:
            return False

    request = {
        "symbol": symbol,
        "volume": float(volume),
        "type_time": mt5.ORDER_TIME_GTC,
        "comment": comment,
        "price": price
    }

    if order_type == "SELL":
        request['type'] = mt5.ORDER_TYPE_SELL
        request['action'] = mt5.TRADE_ACTION_DEAL
        request['type_filling'] = mt5.ORDER_FILLING_IOC
    elif order_type == "BUY":
        request['type'] = mt5.ORDER_TYPE_BUY
        request['action'] = mt5.TRADE_ACTION_DEAL
        request['type_filling'] = mt5.ORDER_FILLING_IOC
    else:
        return False

    if order_number is not None:
        request['action'] = mt5.TRADE_ACTION_DEAL
        request['position'] = order_number

    if direct is True:
        print("Request:", request)
        order_result = mt5.order_send(request)

        if order_result is None:
            print("Order failed to send. MetaTrader5 Object is None")
            return False
    
        if order_result.retcode != mt5.TRADE_RETCODE_DONE:
            print(f"Order placement failed. RetCode: {order_result.retcode}, Comment: {order_result.comment}")
            return False

        if order_result.retcode == 10009:
            print(f"Order for {symbol} successful")
            return True
        else:
            print(f"Error placing order. ErrorCode {order_result.retcode}, Error Details: {order_result}")
            return False
    else:
        result = mt5.order_check(request)
        if result.retcode == 0:
            return place_order(
                order_type=order_type,
                symbol=symbol,
                volume=float(volume),
                price=price,
                comment=comment,
                direct=True,
                order_number=order_number
            )
        else:
            print(f"Order unsuccessful. Details: {result}")
            return False


    
def get_open_positions():
    positions = MetaTrader5.positions_get()
    return positions

def retrieve_latest_tick(symbol):
    tick = MetaTrader5.symbol_info_tick(symbol)

    if tick is not None:
        tick = tick._asdict()
        return (tick['ask'], tick['bid'])
    else:
        return (0, 0)

def amount_to_lots(amount, symbol):
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is None:
        return 2137
    else:
        lots = amount / (symbol_info.trade_contract_size)
        return lots

def lots_to_amount(lots, symbol):
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is None:
        return 2137
    else:
        amount = lots * (symbol_info.trade_contract_size)
        return amount

def retrieve_all_symbols():
    symbols = MetaTrader5.symbols_get()
    if symbols is not None:
        symbol_list = []
        for symbol in symbols:
            symbol_list.append(symbol.name)
        return symbol_list
    else:
        return 2137

def retrieve_symbol_info(symbol):
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is not None:
        return symbol_info
    else:
        return 2137

def min_amount_symbol(symbol):
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is not None:
        volum_min = symbol_info.volume_min
        amount = lots_to_amount(volum_min, symbol)
        return amount
    else:
        return 2137
    

def get_total_open_amount(symbol):
    """
    Function to retrieve the total open amount of a symbol
    :param symbol: String
    :return: Float
    """
    # Get all open positions
    positions = get_open_positions()
    # Filter the positions to only include those of the symbol
    positions = [position for position in positions if position.symbol == symbol]
    # Calculate the total open amount
    total_open_amount = 0
    for position in positions:
        if position.type == 1:
            total_open_amount += position.volume
        elif position.type == 0:
            total_open_amount -= position.volume
    return total_open_amount

# Function to retrieve the account free margin
def retrieve_account_free_margin():
    """
    Function to retrieve the account free margin
    :return: Float
    """
    # Retrieve the account information
    account_info = MetaTrader5.account_info()
    if account_info is not None:
        return account_info.margin_free
    else:
        return 2137