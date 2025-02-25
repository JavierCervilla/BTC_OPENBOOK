export type inputToSign = {
    index: number;
    sighashTypes: number[];
    address: string;
}

export type partialSignature = {
    index: number;
    partialSig: {
        signature: Uint8Array,
        pubkey: Uint8Array,
    }[];
}