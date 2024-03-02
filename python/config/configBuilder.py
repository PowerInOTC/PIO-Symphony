import json

class TradeManager:
    def __init__(self):
        self.config_file = 'config.json'
        try:
            with open(self.config_file, 'x') as file:
                json.dump([], file)
        except FileExistsError:
            pass

    def add_trade(self, side, asset, leverage):
        with open(self.config_file, 'r') as file:
            trades = json.load(file)
        new_trade = {"Side": side, "Asset": asset, "leverage": leverage}
        if new_trade not in trades:
            trades.append(new_trade)
            with open(self.config_file, 'w') as file:
                json.dump(trades, file)
            return "Trade added."
        else:
            return "Trade already exists."

    def get_trades(self):
        with open(self.config_file, 'r') as file:
            trades = json.load(file)
        return trades

    def delete_trade(self, side, asset):
        with open(self.config_file, 'r') as file:
            trades = json.load(file)
        trades = [trade for trade in trades if not (trade["Side"] == side and trade["Asset"] == asset)]
        with open(self.config_file, 'w') as file:
            json.dump(trades, file)
        return "Trade(s) deleted."
    
    def add_field(self, side, asset, leverage, field_name, field_value):
        with open(self.config_file, 'r') as file:
            trades = json.load(file)
        updated = False
        for trade in trades:
            if trade["Side"] == side and trade["Asset"] == asset and trade["leverage"] == leverage:
                trade[field_name] = field_value
                updated = True
        if updated:
            with open(self.config_file, 'w') as file:
                json.dump(trades, file)

    def remove_field(self, side, asset, leverage, field_name):
        with open(self.config_file, 'r') as file:
            trades = json.load(file)
        for trade in trades:
            if trade["Side"] == side and trade["Asset"] == asset and trade["leverage"] == leverage:
                if field_name in trade:
                    del trade[field_name]
        with open(self.config_file, 'w') as file:
            json.dump(trades, file)
    
    def get_trades(self):
        with open(self.config_file, 'r') as file:
            trades = json.load(file)
        return trades

    def find_trades_by_combination(self, side, asset):
        trades = self.get_trades()
        matching_trades = [trade for trade in trades if trade["Side"] == side and trade["Asset"] == asset]
        return matching_trades

    def find_next_highest_leverage_trade(self, side, asset, input_leverage):
        trades = self.get_trades()
        filtered_trades = [trade for trade in trades if trade["Side"] == side and trade["Asset"] == asset and trade["leverage"] > input_leverage]
        if not filtered_trades:
            return None
        next_highest_leverage_trade = min(filtered_trades, key=lambda x: x["leverage"])
        return next_highest_leverage_trade

    def find_all_combinations(self):
        trades = self.get_trades()
        combinations = []
        for trade in trades:
            combination = {k: trade[k] for k in ("Side", "Asset")}
            if combination not in combinations:
                combinations.append(combination)
        return combinations
    
    def add_complete_trade(self, side, asset, leverage, maxLeverageDeltaGlobalNotional=1000, maxLeverageLongGlobalNotional=1000, maxLeverageShortGlobalNotional=1000, imA=100000000000000000, imB=100000000000000000, dfA=15000000000000000, dfB=15000000000000000, ir=15000000000000000, expiryA=30, expiryB=7776000, timeLockA=7776000, timeLockB=7776000, maxConfidence="1000000000000000000", maxDelay=15, forceCloseType=1, kycType=1, cType=1, kycAddress="0x0000000000000000000000000000000000000000"):
        existing_trades = self.find_trades_by_combination(side, asset)
        matching_trade = None
        for trade in existing_trades:
            if trade["leverage"] == leverage:
                matching_trade = trade
                break
        if not matching_trade:
            self.add_trade(side, asset, leverage)
        fields = {"maxLeverageDeltaGlobalNotional": maxLeverageDeltaGlobalNotional, "maxLeverageLongGlobalNotional": maxLeverageLongGlobalNotional, "maxLeverageShortGlobalNotional": maxLeverageShortGlobalNotional, "imA": imA, "imB": imB, "dfA": dfA, "dfB": dfB, "ir": ir, "expiryA": expiryA, "expiryB": expiryB, "timeLockA": timeLockA, "timeLockB": timeLockB, "maxConfidence": maxConfidence, "maxDelay": maxDelay, "forceCloseType": forceCloseType, "kycType": kycType, "cType": cType, "kycAddress": kycAddress}
        for field, value in fields.items():
            self.add_field(side, asset, leverage, field, value)

    def add_hedge_trade(self, mt5, asset):
        with open(self.config_file, 'r') as file:
            trades = json.load(file)
        hedge_trade = {
            "Side": "Hedge",
            "Asset": asset,
            "hedgingLeverage": mt5.leverage(),
            "fmpTicker": asset,
            "tiingoTicker": asset,
            "alpacaTicker": asset,
            "tradingViewId": asset,
            "brokerMinimalNotional": mt5.broker_minimal_notional(asset),
            "brokerFee": mt5.broker_fee(asset),
            "brokerSpread": mt5.broker_spread(asset)
        }
        existing_trade = next((trade for trade in trades if trade["Side"] == "Hedge" and trade["Asset"] == asset), None)
        if existing_trade:
            trades[trades.index(existing_trade)] = hedge_trade
        else:
            trades.append(hedge_trade)
        with open(self.config_file, 'w') as file:
            json.dump(trades, file)

class MT5:
    def __init__(self):
        pass

    @staticmethod
    def balance():
        return 100000

    @staticmethod
    def leverage():
        return 500
    
    @staticmethod
    def hedging_ir_cost(asset):
        return 0.2
    
    @staticmethod
    def broker_minimal_notional(asset):
        return 1000
    
    @staticmethod
    def broker_fee(asset):
        return 0.0001
    
    @staticmethod
    def broker_spread(asset):
        return 0.0001

class Config:
    def __init__(self):
        pass

    added_ir = 0.3 # Bonus interest rate for the hedger
    confidenceInterval = 0.95 # Confidence interval for risk models
    rebalanceDelay = 3 * 1440 # Rebalance delay in minutes
    maxLeverage = 200 # Maximum leverage 
    # PION SETUP
    x = 0.5
    parity = 1
    publicOracleAddress = "0x0000000000000000000000000000000000000000"
    # PionerV1 SETUP 
    minNotional = 1000000000000000000 # Minimum notional value per contracts and partial fills


trade_manager = TradeManager()
mt5 = MT5()
config = Config()

def add_trade_with_mt5_values(trade_manager, mt5, config, side, asset, leverage):
    balance = mt5.balance()
    maxLeverageDeltaGlobalNotional = int(balance * mt5.leverage())
    imA = int(0.75 * 1/leverage * 1e18)
    imB = int(0.75 * 1/leverage * 1e18)
    dfA = int(0.25 * 1/leverage * 1e18)
    dfB = int(0.25 * 1/leverage * 1e18)
    ir = int((config.added_ir + mt5.hedging_ir_cost(asset)) * 1/leverage * 1e18)
    trade_manager.add_complete_trade(side, asset, leverage, maxLeverageDeltaGlobalNotional=maxLeverageDeltaGlobalNotional, maxLeverageLongGlobalNotional=maxLeverageDeltaGlobalNotional, maxLeverageShortGlobalNotional=maxLeverageDeltaGlobalNotional, imA=imA, imB=imB, dfA=dfA, dfB=dfB, ir=ir)

def generate_trades_for_assets(trade_manager, mt5, config, assets):
    for asset in assets:
        trade_manager.add_hedge_trade( mt5, asset)
        for side in ["Long", "Short"]:
            for leverage in [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000]:
                if leverage < config.maxLeverage:
                    add_trade_with_mt5_values(trade_manager, mt5, config, side, asset, leverage)




generate_trades_for_assets(trade_manager, mt5, config, ["TSLA"])
print(trade_manager.get_trades())
