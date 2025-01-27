export interface Block {
    block_index: number;
    events: EventCounts;
    nTxs: number;
    block_time: Date | string;
    transactions: string[];
}

interface EventCounts {
    [key: string]: number;
}

interface BlockSummary {
    date: string;
    events: EventCounts;
}