declare module 'apiclientsdk' {
    import { AxiosResponse } from 'axios';

    export type PriceFeedRequestConfig = {
        verbose?: boolean;
        binary?: boolean;
        allowOutOfOrder?: boolean;
    };

    export type ServerMessage = import('./src/types/responses').RfqResponse;

    export class RfqWebsocketClient {
        constructor(onMessage?: (message: ServerMessage) => void, onError?: (error: Error) => void);
        startWebSocket(token: string): Promise<void>;
        closeWebSocket(): void;
    }

    export function sendRfq(rfq: import('./src/types/requests').RfqRequest, token: string, timeout?: number): Promise<AxiosResponse | undefined>;
    export function getRfqs(token: string, start?: number, end?: number, timeout?: number): Promise<AxiosResponse | undefined>;
    export function getQuotes(rfqId: string, token: string, start?: number, end?: number, timeout?: number): Promise<AxiosResponse | undefined>;
    export function sendQuote(quote: import('./src/types/requests').QuoteRequest, token: string, timeout?: number): Promise<AxiosResponse | undefined>;
    export function logout(token: string, timeout?: number): Promise<AxiosResponse | undefined>;
    export function getPayload(address: string, timeout?: number): Promise<AxiosResponse | undefined>;
    export function login(uuid: string, signedMessage: string): Promise<AxiosResponse | undefined>;
    export function getPayloadAndLogin(wallet: import('ethers').Wallet | import('ethers').HDNodeWallet): Promise<string | null>;
    export function createWalletAndSignIn(privateKey?: string): Promise<{ wallet: import('ethers').Wallet | import('ethers').HDNodeWallet | null; token: string | null; }>;
}
