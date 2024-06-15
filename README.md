# Symphony

PIO Symphony is a sell-side liquidity provider bot designed to provide liquidity to the PIO network and to hedge the greeks on the secondary market.

```
# Install
git clone https://github.com/Pioner-io/Symphony.git
cd Symphony
cd mt5-sdk
pnpm install
pnpm start
```

```
# 1st Terminal
#Start local mt5
cd .\Symphony\mt5-connector\;
python -m venv myenv;
myenv\Scripts\activate;
pip install -r requirements.txt;
python -m uvicorn index:app --reload;
```

```
# 2nd Terminal
# Start docker
cd .\Symphony\mt5-sdk\;
docker-compose up;
```

```
# 3rd Terminal
# Start Symphony
cd .\Symphony\mt5-sdk\;
pnpm start;
```

```
// For local development, modify the config file in @pionerfriends/api-sdk/dist/config.js
exports.config = {
    https: false,
    serverAddress: '127.0.0.1',
    serverPort: '3007',
};
```
