// ============================================================
// FundTracer by DT - Etherscan Provider
// ============================================================

import { ChainId } from '../types.js';
import { BaseProvider } from './BaseProvider.js';

export class EtherscanProvider extends BaseProvider {
    constructor(apiKey: string) {
        super('ethereum', apiKey);
    }
}

export class LineascanProvider extends BaseProvider {
    constructor(apiKey: string) {
        super('linea', apiKey);
    }
}

export class ArbiscanProvider extends BaseProvider {
    constructor(apiKey: string) {
        super('arbitrum', apiKey);
    }
}

export class BasescanProvider extends BaseProvider {
    constructor(apiKey: string) {
        super('base', apiKey);
    }
}
