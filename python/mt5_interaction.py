# mt5_interaction.py
import MetaTrader5
import pandas
import datetime
import pytz



# Function to start Meta Trader 5 (MT5)
def start_mt5(username, password, server):
    """
    Initializes and logs into MT5
    :param username: 8 digit integer
    :param password: string
    :param server: string
    :param path: string
    :return: True if successful, Error if not
    """
    # Ensure that all variables are the correct type
    uname = int(username)  # Username must be an int
    pword = str(password)  # Password must be a string
    trading_server = str(server)  # Server must be a string

    # Attempt to start MT5
    try:
        metaTrader_init = MetaTrader5.initialize(login=uname, password=pword, server=trading_server)
    except Exception as e:
        print(f"Error initializing MetaTrader: {e}")

    # Attempt to login to MT5
    if metaTrader_init:
        metaTrader_login = MetaTrader5.login(login=uname, password=pword, server=trading_server)
    else :
        print(f"Error loging in to MetaTrader")

    # Return True if initialization and login are successful
    if metaTrader_login:
        return True
    else:
        return False


# Function to initialize a symbol on MT5
def initialize_symbols(symbol_array):
    """
    Function to initialize a symbol on MT5. Note that different brokers have different symbols.
    To read more: https://trading-data-analysis.pro/everything-you-need-to-connect-your-python-trading-bot-to-metatrader-5-de0d8fb80053
    :param symbol_array: List of symbols to be initialized
    :return: True if all symbols enabled
    """
    # Get a list of all symbols supported in MT5
    all_symbols = MetaTrader5.symbols_get()
    # Create a list to store all the symbols
    symbol_names = []
    # Add the retrieved symbols to the list
    for symbol in all_symbols:
        symbol_names.append(symbol.name)

    # Check each provided symbol in symbol_array to ensure it exists
    for provided_symbol in symbol_array:
        if provided_symbol in symbol_names:
            # If it exists, enable
            if MetaTrader5.symbol_select(provided_symbol, True):
                pass
            else:
                # Print the outcome to screen. Custom Logging/Error Handling not yet created
                print(f"Error creating symbol {provided_symbol}. Symbol not enabled.")
        else:
            # Print the outcome to screen. Custom Logging/Error Handling not yet created
            print(f"Symbol {provided_symbol} does not exist in this MT5 implementation. Symbol not enabled.")
    # Return true if all symbols enabled
    return True


# Function to place a trade on MT5
def place_order(order_type, symbol, volume, comment, direct=False, price=0):
    """
    Function to place a trade on MetaTrader 5 with option to check balance first
    :param order_type: String from options: SELL_STOP, BUY_STOP, SELL, BUY
    :param symbol: String
    :param volume: String or Float
    :param comment: String
    :param direct: Bool, defaults to False
    :param price: String or Float, optional
    :return: Trade outcome or syntax error
    """

    # Set up the place order request
    request = {
        "symbol": symbol,
        "volume": volume,
        "type_time": MetaTrader5.ORDER_TIME_GTC,
        "comment": comment
    }

    # Create the order type based upon provided values. This can be expanded for different order types as needed.
    if order_type == "SELL_STOP":
        request['type'] = MetaTrader5.ORDER_TYPE_SELL_STOP
        request['action'] = MetaTrader5.TRADE_ACTION_PENDING
        if price > 0:
            request['price'] = round(price, 3)
            request['type_filling'] = MetaTrader5.ORDER_FILLING_RETURN
    elif order_type == "BUY_STOP":
        request['type'] = MetaTrader5.ORDER_TYPE_BUY_STOP
        request['action'] = MetaTrader5.TRADE_ACTION_PENDING
        if price > 0:
            request['price'] = round(price, 3)
            request['type_filling'] = MetaTrader5.ORDER_FILLING_RETURN

    elif order_type == "SELL":
        request['type'] = MetaTrader5.ORDER_TYPE_SELL
        request['action'] = MetaTrader5.TRADE_ACTION_DEAL
        request['type_filling'] = MetaTrader5.ORDER_FILLING_IOC
    elif order_type == "BUY":
        request['type'] = MetaTrader5.ORDER_TYPE_BUY
        request['action'] = MetaTrader5.TRADE_ACTION_DEAL
        request['type_filling'] = MetaTrader5.ORDER_FILLING_IOC
    else:
        print("Choose a valid order type from SELL_STOP, BUY_STOP, SELL, BUY")
        raise SyntaxError

    if direct is True:
        # Send the order to MT5
        order_result = MetaTrader5.order_send(request)
        # Notify based on return outcomes
        if order_result[0] == 10009:
            # print(f"Order for {symbol} successful") # Enable if error checking order_result
            return order_result[2]
        elif order_result[0] == 10027:
            # Turn off autotrading
            print(f"Turn off Algo Trading on MT5 Terminal")
        else:
            # Print result
            print(f"Error placing order. ErrorCode {order_result[0]}, Error Details: {order_result}")

    else:
        # Check the order
        result = MetaTrader5.order_check(request)
        if result[0] == 0:
            # print("Balance Check Successful") # Enable to error check Balance Check
            # If order check is successful, place the order. Little bit of recursion for fun.
            place_order(
                order_type=order_type,
                symbol=symbol,
                volume=volume,
                price=price,
                comment=comment,
                direct=True
            )
        else:
            print(f"Order unsucessful. Details: {result}")

# Function to cancel an order
def cancel_order(order_number):
    """
    Function to cancel an order
    :param order_number: Int
    :return:
    """
    # Create the request
    request = {
        "action": MetaTrader5.TRADE_ACTION_REMOVE,
        "order": order_number,
        "comment": "Order Removed"
    }
    # Send order to MT5
    order_result = MetaTrader5.order_send(request)
    if order_result[0] == 10009:
        return True
    else:
        print(f"Error cancelling order. Details: {order_result}")


# Function to retrieve all open orders from MT5
def get_open_orders():
    """
    Function to retrieve a list of open orders from MetaTrader 5
    :return: List of open orders
    """
    orders = MetaTrader5.orders_get()
    order_array = []
    for order in orders:
        order_array.append(order[0])
    return order_array

# Function to cancel all open orders of a symbol
def cancel_all_symbol_orders(symbol):
    """
    Function to cancel all orders of a symbol
    :param symbol: String
    :return:
    """
    # Get all open orders
    orders = get_open_orders()
    # Filter orders to only include those of the symbol
    orders = [order for order in orders if order[1] == symbol]
    # Loop through each order and cancel
    for order in orders:
        cancel_order(order[0])

# Function to retrieve all open positions
def get_open_positions():
    """
    Function to retrieve a list of open orders from MetaTrader 5
    :return: list of positions
    """
    # Get position objects
    positions = MetaTrader5.positions_get()
    # Return position objects
    return positions

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

def manage_symbol_inventory(max_notional, symbol, target_amount):
    """
    Function to manage the inventory of a symbol
    :param symbol: String
    :param target_notional: Float
    :return:
    """ 
    open_amount = get_total_open_amount(symbol)
    bid, ask = retrieve_latest_tick(symbol)
    open_notional = lots_to_dollar_notional(open_amount, symbol, ask)
    if verify_inventory_new_amount_health( max_notional, target_notional, open_notional ):
        if open_amount >= target_notional:
            cancel_all_symbol_orders(symbol)
            if open_amount > 0:
                place_order("SELL", symbol, abs(open_amount - target_notional), "Inventory", True)
            else:
                place_order("BUY", symbol, abs(open_amount - target_notional), "Inventory", True)
        elif open_amount < target_notional:
            cancel_all_symbol_orders(symbol)
            if open_amount < 0:
                place_order("SELL", symbol, abs(target_notional - open_amount), "Inventory", True)
            else:
                place_order("BUY", symbol, abs(target_notional - open_amount), "Inventory", True)
    else:
        return 2013

# Function to close an open position
def close_position(order_number, symbol, volume, order_type, price, comment):
    """
    Function to close an open position from MetaTrader 5
    :param order_number: int
    :return: Boolean
    """
    # Create the request
    request = {
        'action': MetaTrader5.TRADE_ACTION_DEAL,
        'symbol': symbol,
        'volume': volume,
        'position': order_number,
        'price': price,
        'type_time': MetaTrader5.ORDER_TIME_GTC,
        'type_filling': MetaTrader5.ORDER_FILLING_IOC,
        'comment': comment
    }

    if order_type == "SELL":
        request['type'] = MetaTrader5.ORDER_TYPE_SELL
    elif order_type == "BUY":
        request['type'] = MetaTrader5.ORDER_TYPE_BUY
    else:
        print(f"Incorrect syntax for position close {order_type}")

    # Place the order
    result = MetaTrader5.order_send(request)
    print(result)
    if result is not None and result.retcode == 10009:
        return True
    else:
        print(f"Error closing position. Details: {result}")
    

# Function to retrieve latest tick for a symbol
def retrieve_latest_tick(symbol):
    """
    Function to retrieve the latest tick for a symbol
    :param symbol: String
    :return: Dictionary object
    """
    # Retrieve the tick information
    tick = MetaTrader5.symbol_info_tick(symbol)

    if tick is not None:
        tick = tick._asdict()
        return (tick['ask'], tick['bid'])
    else:
        return (None, None)

# Convert lots to dollar notional
def lots_to_dollar_notional(lots, symbol, price):
    """
    Function to convert lots to dollar notional
    :param lots: Float
    :param symbol: String
    :param price: Float
    :return: Float
    """
    # Get the symbol information
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is None:
        return 2137
    else:
        # Calculate the notional
        notional = lots * (symbol_info.trade_contract_size * price)
        return notional

# Convert dollar notional to lots
def dollar_notional_to_lots(notional, symbol, price):
    """
    Function to convert dollar notional to lots
    :param notional: Float
    :param symbol: String
    :param price: Float
    :return: Float
    """
    # Get the symbol information
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is None:
        return 2137
    else :
        # Calculate the lots
        lots = notional / (symbol_info.trade_contract_size * price)
        return lots
    
def amount_to_lots(amount, symbol):
    """
    Function to convert amount to lots
    :param amount: Float
    :param symbol: String
    :param price: Float
    :return: Float
    """
    # Get the symbol information
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is None:
        return 2137
    else:
        # Calculate the lots
        lots = amount / (symbol_info.trade_contract_size )
        return lots
    
def lots_to_amount(lots, symbol):
    """
    Function to convert lots to amount
    :param lots: Float
    :param symbol: String
    :param price: Float
    :return: Float
    """
    # Get the symbol information
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is None:
        return 2137
    else:
        # Calculate the amount
        amount = lots * (symbol_info.trade_contract_size)
        return amount

# Function to retrieve the account balance
def retrieve_account_balance():
    """
    Function to retrieve the account balance
    :return: Float
    """
    # Retrieve the account information
    account_info = MetaTrader5.account_info()
    if account_info is not None:
        return account_info.balance
    else:
        return 2137
    
# Function to retrieve the account leverage
def retrieve_account_leverage():
    """
    Function to retrieve the account leverage
    :return: Float
    """
    # Retrieve the account information
    account_info = MetaTrader5.account_info()
    if account_info is not None:
        return account_info.leverage
    else:
        return 2137

# Function to retrieve the account margin
def retrieve_account_margin():
    """
    Function to retrieve the account margin
    :return: Float
    """
    # Retrieve the account information
    account_info = MetaTrader5.account_info()
    if account_info is not None:
        return account_info.margin
    else:
        return 2137

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
    
# Function to verify if a trade can be open
def verify_trade_openable(symbol, volume, price):
    """
    Function to verify if a trade can be open
    :param symbol: String
    :param volume: Float
    :param price: Float
    :param order_type: String
    :return: Boolean
    """
    # Calculate the margin level
    margin_level = (retrieve_account_margin() / retrieve_account_balance()) * 100
    # Calculate the free margin
    free_margin = retrieve_account_free_margin()
    # Calculate the notional
    notional = lots_to_dollar_notional(volume, symbol, price)
    # Check if the trade can be open
    if margin_level != 2137 and free_margin != 2137 and notional != 2137:
        if margin_level < 100 and notional < free_margin:
            return True
        else:
            return False
    else:
        return False

def account_health( level=100 ):
    """
    Function to calculate the account health
    :return: Float
    """
    account_margin = retrieve_account_margin()
    account_balance = retrieve_account_balance()
    if account_margin != 2137 and account_balance != 2137:
        health = (account_margin / account_balance) * level
        return health
    else:
        return 2137

def max_notional_for_max_account_health( level=100 ):
    """
    Function to calculate the maximum notional for maximum account health
    :return: Float
    """
    account_margin = retrieve_account_margin()
    account_balance = retrieve_account_balance()
    if account_margin != 2137 and account_balance != 2137:
        max_notional = (account_balance * level) - account_margin
        return max_notional
    else:
        return 2137
    
def retrieve_open_positions_notionals():
    """
    Function to retrieve the notionals of all open positions
    :return: Float
    """
    # Get all open positions
    positions = MetaTrader5.positions_get()
    if positions is not None:
        if positions.__len__() > 0:
            # Loop through each position and calculate the notional
            notionals = 0
            for position in positions:
                notionals += lots_to_dollar_notional(position.volume, position.symbol, position.price_open)
            return notionals
        else:
            return 2137
    else:
        return 2137
    
def retrieve_max_notional_for_account_leverage( max_leverage = 100 ):
    """
    Function to retrieve the maximum notional for the account leverage
    :return: Float
    """
    notional = retrieve_open_positions_notionals()
    account_balance = retrieve_account_balance()
    if notional != 2137 and account_balance != 2137:
        max_notional = (max_leverage * account_balance) - notional
        return max_notional


# Function to reset account
def reset_account():
    """
    Function to reset the account
    :return:
    """
    # Close all positions
    close_all_positions()
    # Cancel all orders
    cancel_all_orders()
    

# Function to close all positions
def close_all_positions():
    """
    Function to close all positions
    :return:
    """
   
    # Get all open positions
    positions = MetaTrader5.positions_get()
    if positions is not None:
        if positions.__len__() > 0:
            # Loop through each position and close
            print("Closing all positions", positions)
            for position in positions:
                bid, ask = retrieve_latest_tick(position.symbol)
                print(position[0], position.symbol, position[3], position[5])
                if position.type == 1:
                    close_position(position[0], position.symbol, position.volume, "BUY", bid, "Closing all positions")
                elif position.type == 0:
                    close_position(position[0], position.symbol, position.volume, "SELL", ask, "Closing all positions")
    

# Function to cancel all orders
def cancel_all_orders():
    """
    Function to cancel all orders
    :return:
    """
    # Get all open orders
    orders = MetaTrader5.orders_get()
    if orders is not None:
        if orders.__len__() > 0:
            # Loop through each order and cancel
            for order in orders:
                cancel_order(order[0])
    

def retrieve_symbol_info(symbol):
    """
    Function to retrieve the information of a symbol
    :param symbol: String
    :return: Dictionary
    """
    # Retrieve the symbol information
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is not None:
        return symbol_info
    else:
        return 2137
    
def retrieve_funding(symbol, side):
    """
    Function to retrieve the funding of a symbol
    :param symbol: String
    :param side: String
    :return: Float
    """
    # Retrieve the symbol information
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is not None:
        if side == "long":
            return symbol_info.swap_long
        elif side == "short":
            return symbol_info.swap_short
    else:
        return 2137
    

def verify_inventory_new_amount_health( max_notional, target_notional, open_notional ):
    """
    Function to verify the inventory new amount health
    :param max_notional: Float
    :param target_notional: Float
    :param open_amount: Float
    :param price: Float
    :return: Boolean
    """
    # Calculate the new notional

    if target_notional > 0:
        if open_notional > 0:
            if open_notional < max_notional:
                return True
            else:
                return False
        else:
            if abs(open_notional) > target_notional:
                if abs(open_notional + target_notional) < max_notional:
                    return True
                else:
                    return False
            else:
                return True
    else:
        if open_notional < 0:
            if abs(open_notional) < max_notional:
                return True
            else:
                return False
        else:
            if abs(open_notional) > abs(target_notional):
                if abs(open_notional + target_notional) < max_notional:
                    return True
                else:
                    return False
            else:
                return True
            

def retrieve_all_symbols():
    """
    Function to retrieve all symbols
    :return: List
    """
    # Retrieve the symbol information
    symbols = MetaTrader5.symbols_get()
    if symbols is not None:
        symbol_list = []
        for symbol in symbols:
            symbol_list.append(symbol.name)
        return symbol_list
    else:
        return 2137
    
def is_connected():
    """
    Function to check if the connection is active
    :return: Boolean
    """
    # Check if the connection is active
    if MetaTrader5.initialize():
        return True
    else:
        return False
    
def is_market_open(symbol):
    """
    Function to check if the market is open
    :return: Boolean
    """
     # Retrieve symbol information
    symbol_info = MetaTrader5.symbol_info(symbol)
    
    # Check if trading is allowed for the symbol
    market_open = symbol_info.trade_allowed
    print(market_open)

def retrieve_inventory_amount(symbol):
    """
    Function to retrieve the inventory amount
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
    # Convert lots to amount
    total_open_amount = lots_to_amount(total_open_amount, symbol)
    return total_open_amount

def min_amount_symbol(symbol):
    """
    Function to retrieve the minimum amount for a symbol
    :param symbol: String
    :return: Float
    """
    # Retrieve the symbol information
    symbol_info = MetaTrader5.symbol_info(symbol)
    if symbol_info is not None:
        volum_min = symbol_info.volume_min
        # convert to amount
        amount = lots_to_amount(volum_min, symbol)
        return amount
    else:
        return 2137
    
def shutdown_mt5():
    """
    Function to shutdown MT5
    :return:
    """
    # Shutdown MT5
    MetaTrader5.shutdown()