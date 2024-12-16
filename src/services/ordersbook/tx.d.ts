export type inputToSign = {
    index: number;
    sighashType: number[];
}

export type partialSignature = {
    index: number;
    partialSig: {
        signature: Uint8Array,
        pubkey: Uint8Array,
    }[];
}