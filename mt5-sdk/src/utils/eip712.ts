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
