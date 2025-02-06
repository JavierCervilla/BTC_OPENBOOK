import type { MarketData, Currencies } from "@/services/market/data.d.ts";
import { CONFIG } from "@/config/index.ts";

const CACHE_TIME = 1000 * 60 * 5;

class MarketDataService {
    cache: Map<Currencies, MarketData>;
    currencies: Currencies[];
    lastUpdated: Date | undefined;

    constructor() {
        this.currencies = ["bitcoin", "counterparty"];
        this.cache = new Map();
    }

    private dataAdapter(data: any): MarketData[] {
        return data.map((item: any) => ({
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            ath: item.ath,
            ath_date: item.ath_date,
            price_change_percentage_24h: item.price_change_percentage_24h,
            current_price: item.current_price,
            market_cap: item.market_cap,
            total_volume: item.total_volume,
        }));
    }

    private async fetchMarketData(): Promise<MarketData[]> {
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${this.currencies.join(",")}`;
        const response = await fetch(url, {
            headers: {
                "x-cg-demo-api-key": CONFIG.MARKET.COINGECKO_API_KEY
            }
        });
        const data = await response.json();
        return this.dataAdapter(data);
    }

    async getMarketData(): Promise<MarketData[]> {
        if (this.lastUpdated && new Date().getTime() - this.lastUpdated.getTime() < CACHE_TIME) {
            return [
                this.cache.get("bitcoin") as MarketData,
                this.cache.get("counterparty") as MarketData
            ];
        }
        const data = await this.fetchMarketData();
        if (!data || data.length === 0) {
            console.log("Errored Fetching data from coingecko");
            return [
                this.cache.get("bitcoin") as MarketData,
                this.cache.get("counterparty") as MarketData
            ]
        }
        for (const item of data) {
            this.cache.set(item.id as Currencies, item);
        }
        this.lastUpdated = new Date();
        return [
            this.cache.get("bitcoin") as MarketData,
            this.cache.get("counterparty") as MarketData
        ]
    }
}

export default new MarketDataService();