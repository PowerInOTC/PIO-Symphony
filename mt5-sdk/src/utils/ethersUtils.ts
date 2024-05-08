import { fromBytes, fromHex } from 'viem';

export function extractSymbolFromAssetHex(assetHex: string): {
  assetAId: string;
  assetBId: string;
} {
  // Convert the bytes to a UTF-8 string
  const paddedSymbol = fromHex(assetHex as `0x ${string}`, 'string') as string;

  // Remove the trailing null characters and split the symbol
  const [assetAId, assetBId] = paddedSymbol.replace(/\0+$/, '').split('/');

  // Return the symbol in the format "assetAId/assetBId"
  return { assetAId, assetBId };
}

import { ethers } from 'ethers';

export const convertToBytes32 = (str: string): string => {
  const maxLength = 32;
  const truncatedStr = str.slice(0, maxLength);
  const bytes32 = ethers.utils.formatBytes32String(truncatedStr);
  return bytes32;
};

export const convertFromBytes32 = (bytes32: string): string => {
  const str = ethers.utils.parseBytes32String(bytes32);
  return str;
};
