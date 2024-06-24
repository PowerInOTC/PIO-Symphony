import { ethers } from 'ethers';
import { config } from '../../config';
import { Hedger } from '../../broker/inventory';
import { getTripartyLatestPrice } from '../../broker/tripartyPrice';
import { extractSymbolFromAssetHex } from '../../utils/ethersUtils';
import { getMarketStatus } from '../../broker/marketStatus';
import { settleOpen } from '../../blockchain/write';
import { formatUnits, parseUnits } from 'viem';
import { getPositions, PositionResponse } from '@pionerfriends/api-client';
import { networks, NetworkKey } from '@pionerfriends/blockchain-client';

class SixToTwo {
  private hedger: Hedger;
  private wallet: ethers.Wallet;

  constructor() {
    this.hedger = new Hedger();
    this.wallet = new ethers.Wallet(
      config.privateKeys?.split(',')[config.hedgerId],
    );
  }

  private async checkAndSettlePosition(position: PositionResponse) {
    if (position.state !== 6) return;

    const symbol = extractSymbolFromAssetHex(position.assetHex);
    const tripartyLatestPrice = await getTripartyLatestPrice(
      `${symbol.assetAId}/${symbol.assetBId}`,
    );
    const marketStatus = getMarketStatus(
      position.token,
      `${symbol.assetAId}/${symbol.assetBId}`,
    );

    if (!marketStatus) {
      throw new Error('Open check failed: market status is not open');
    }

    const openPrice = formatUnits(parseUnits(position.price, 0), 18);
    const openAmount = formatUnits(parseUnits(position.amount, 0), 18);

    if (position.isLong) {
      if (tripartyLatestPrice.ask < Number(openPrice) * (1 + 0.0001)) {
        throw new Error(
          `Open check failed: ask: ${tripartyLatestPrice.ask} > price ${Number(openPrice) * (1 + 0.0001)}`,
        );
      }
    } else {
      if (tripartyLatestPrice.bid > Number(openPrice) * (1 - 0.0001)) {
        throw new Error(
          `Open check failed: bid: ${tripartyLatestPrice.bid} < price ${Number(openPrice) * (1 - 0.0001)}`,
        );
      }
    }

    const isPassed = await this.hedger.hedge(
      `${symbol.assetAId}/${symbol.assetBId}`,
      Number(openPrice),
      position.signatureOpenQuote,
      Number(openAmount),
      position.isLong,
      true,
      position.issuerAddress,
    );

    if (!isPassed) {
      throw new Error('Open check failed: hedger failed');
    }

    const bOracleSignValue = {
      x: position.x,
      parity: position.parity,
      maxConfidence: position.maxConfidence,
      assetHex: position.assetHex,
      maxDelay: position.maxDelay,
      precision: String(position.precision),
      imA: position.imA,
      imB: position.imB,
      dfA: position.dfA,
      dfB: position.dfB,
      expiryA: position.expiryA,
      expiryB: position.expiryB,
      timeLock: position.timeLock,
      signatureHashOpenQuote: position.signatureOpenQuote,
      nonce: position.nonceOpenQuote,
    };

    const openQuoteSignValue = {
      isLong: position.isLong,
      bOracleId: '0',
      price: position.price,
      amount: position.amount,
      interestRate: position.interestRate,
      isAPayingAPR: position.isAPayingApr,
      frontEnd: position.frontEnd,
      affiliate: position.affiliate,
      authorized: position.authorized,
      nonce: position.nonceOpenQuote,
    };

    try {
      const isFilled = await settleOpen(
        bOracleSignValue,
        position.signatureBoracle,
        openQuoteSignValue,
        position.signatureOpenQuote,
        position.price,
        config.hedgerId,
        String(position.chainId),
      );

      console.log('Position settled:', isFilled);
    } catch (e) {
      console.error('settleOpen error', e);
    }
  }

  public async startSettlingOpenPositions(token: string) {
    setInterval(async () => {
      try {
        const positions = await getPositions(token);
        for (const position of positions) {
          await this.checkAndSettlePosition(position);
        }
      } catch (error) {
        console.error('Error during open position settlement:', error);
      }
    }, config.SixToTwoInterval);
  }
}

export function startOpenPositionSettlement(token: string) {
  const openPositionSettler = new SixToTwo();
  openPositionSettler.startSettlingOpenPositions(token);
}
