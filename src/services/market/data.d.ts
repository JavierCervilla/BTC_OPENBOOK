export type Currencies = "bitcoin" | "counterparty";


interface MarketData {
    id: string;
    symbol: string;
    name: string;
    image?: string;
    current_price: number;
    price_change_percentage_24h: number;
    ath: number;
    ath_date: string;
    market_cap: number;
    total_volume: number;
}