/// <reference types="vite/client" />

type EthereumRequestParams = {
    method: string;
    params?: unknown[];
};

type EthereumProvider = {
    request: <T = unknown>(args: EthereumRequestParams) => Promise<T>;
    on?: (event: 'accountsChanged' | 'chainChanged', handler: (...args: unknown[]) => void) => void;
    removeListener?: (event: 'accountsChanged' | 'chainChanged', handler: (...args: unknown[]) => void) => void;
};

interface Window {
    ethereum?: EthereumProvider;
}