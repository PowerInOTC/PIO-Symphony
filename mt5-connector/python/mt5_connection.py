import MetaTrader5
from dotenv import load_dotenv
import os

load_dotenv()

class MT5ConnectionSingleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.initialize()
        return cls._instance

    def initialize(self):
        self.login_id = int(os.getenv('HEDGER1_LOGIN'))
        self.password = os.getenv('HEDGER1_PASSWORD')
        self.server = os.getenv('HEDGER1_SERVER')
        self.mt5_connected = False
        self.start_mt5()

    def start_mt5(self):
        if not self.mt5_connected:
            # Attempt to start MT5
            try:
                metaTrader_init = MetaTrader5.initialize(login=self.login_id, password=self.password, server=self.server)
                if metaTrader_init:
                    self.mt5_connected = True
                    print("MetaTrader5 initialized successfully")
                else:
                    print("MetaTrader5 initialization failed")
            except Exception as e:
                print(f"Error initializing MetaTrader: {e}")

    def is_connected(self):
        return self.mt5_connected

    def shutdown_mt5(self):
        if self.mt5_connected:
            MetaTrader5.shutdown()
            self.mt5_connected = False
            print("MetaTrader5 shutdown successfully")

    def get_mt5(self):
        return MetaTrader5