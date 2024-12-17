/**
 * THIS REPO WILL HOST THE OPEN BOOK LOGIC FOR THE OPENBOOK VOLUME TRACKING SYSTEM
 * 
 * MESSAGE:
 * 
 *  [PROTOCOL: 1byte][ASSET_ID:dependent on protocol][DATA:dependent on protocol]
 * 
 * PROTOCOLS:
 *  - XCP: 0x00: ASSET_ID is a 8 byte asset id
 *     - MESSAGE: [0x00][ASSET_ID: 8bytes][leb128 qty][leb128 price]
 *  - ORDINALS: 0x01: ASSET_ID is a 64 byte asset id
 *     - MESSAGE: [0x01][ASSET_ID: 64bytes][INDEX: 1byte][leb128 qty][leb128 price]
 *
 */
import { CONFIG } from "@/config/index.ts";


import * as leb128 from "@thi.ng/leb128";
import { ascii2hex, bin2hex, hex2ascii, hex2bin } from "@/utils/index.ts";


interface Config {
    PREFIX: string;
    VERSION: {
        MAJOR: number;
        MINOR: number;
        PATCH: number;
        STRING: string;
    },
    TIMELOCK: number;
    [key: number]: ProtocolConfig;
};

interface ProtocolConfig {
    name: string;
    asset_id_bytes: number;
    index_bytes: number;
    divisible_bytes?: number;
}

interface EncodeMessageParams {
    protocol: number;
    asset_id: string;
    qty: bigint;
    index?: number;
    divisible_bytes?: number;
}

interface EncodeListingOPReturnParams {
    protocol: number;
    utxo: string;
    price: number;
}

interface DecodeMessageParams {
    protocol: number;
    message: string;
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class OpenBook {
    static OB_PROTOCOL_CONFIG: Config = CONFIG.OPENBOOK;

    static encode_Listing_OP_RETURN(params: EncodeListingOPReturnParams) {
        const { utxo, price } = params;
        const protocolConfig = OpenBook.OB_PROTOCOL_CONFIG[params.protocol];
        if (!protocolConfig) {
            throw new Error("Invalid protocol");
        }
        const [utxoTxId] = utxo.split(":");
        const utxoBytes = hex2bin(utxoTxId);
        const priceBytes = leb128.encodeULEB128(price);
        const prefixBytes = new TextEncoder().encode(OpenBook.OB_PROTOCOL_CONFIG.PREFIX);
        const msg_len = prefixBytes.length + utxoBytes.length + priceBytes.length;

        const message = new Uint8Array(msg_len);
        let offset = 0;
        message.set(prefixBytes, offset);
        offset += prefixBytes.length;
        message.set(utxoBytes, offset);
        offset += utxoBytes.length;
        message.set(priceBytes, offset);
        return message;
    }

    static decode_Listing_OP_RETURN(params: DecodeMessageParams) {
        const { message, protocol } = params;
        const UTXO_BYTES = 32;
        const protocolConfig = OpenBook.OB_PROTOCOL_CONFIG[protocol];
        if (!protocolConfig) {
            throw new Error("Invalid protocol");
        }
        const prefixBytes = new TextEncoder().encode(OpenBook.OB_PROTOCOL_CONFIG.PREFIX);
        const utxoStart = prefixBytes.length;
        const utxoEnd = utxoStart + UTXO_BYTES;

        const bin_msg = hex2bin(message);
        const utxo = bin2hex(bin_msg.slice(utxoStart, utxoEnd));
        const priceStart = utxoEnd;
        const priceBytes = bin_msg.slice(priceStart);
        const [ price ] = leb128.decodeULEB128(priceBytes);

        return {
            //TODO: check if will always be 0 the vout
            utxo: `${utxo}:0`,
            price: price,
        };
    }

    static encode_OP_RETURN(params: EncodeMessageParams) {
        const protocolConfig = OpenBook.OB_PROTOCOL_CONFIG[params.protocol];
        if (!protocolConfig) {
            throw new Error("Invalid protocol");
        }

        const assetIdBytes = protocolConfig.asset_id_bytes;
        const indexBytes = protocolConfig.index_bytes;
        const prefixBytes = new TextEncoder().encode(OpenBook.OB_PROTOCOL_CONFIG.PREFIX);
        const qtyBytes = leb128.encodeULEB128(params.qty);
        const msg_len = prefixBytes.length + 1 + assetIdBytes + indexBytes + qtyBytes.length;

        const protocolByte = new Uint8Array([params.protocol]);
        const assetIdEncoded = new Uint8Array(assetIdBytes);
        assetIdEncoded.set(hex2bin(ascii2hex(params.asset_id)).slice(0, assetIdBytes));

        const indexByte = params.index !== undefined ? new Uint8Array([params.index]) : new Uint8Array();

        const message = new Uint8Array(msg_len);
        let offset = 0;

        message.set(prefixBytes, offset);
        offset += prefixBytes.length;

        message.set(protocolByte, offset);
        offset += protocolByte.length;

        message.set(assetIdEncoded, offset);
        offset += assetIdEncoded.length;

        if (indexBytes && params.index !== undefined) {
            message.set(indexByte, offset);
            offset += indexByte.length;
        }

        message.set(qtyBytes, offset);

        return message;
    }

    static decode_OP_RETURN(params: DecodeMessageParams) {
        const protocolConfig = OpenBook.OB_PROTOCOL_CONFIG[params.protocol];
        if (!protocolConfig) {
            throw new Error("Invalid protocol");
        }
        const assetIdBytes = protocolConfig.asset_id_bytes;
        const indexBytes = protocolConfig.index_bytes;
        const prefixLength = OpenBook.OB_PROTOCOL_CONFIG.PREFIX.length;
        const message = new Uint8Array(hex2bin(params.message));
        let index = null;

        const prefixBytes = new TextEncoder().encode(OpenBook.OB_PROTOCOL_CONFIG.PREFIX);
        const messagePrefix = message.slice(0, prefixLength);
        if (!messagePrefix.every((byte, i) => byte === prefixBytes[i])) {
            throw new Error("Invalid message prefix");
        }

        const assetId = bin2hex(message.slice(prefixLength + 1, prefixLength + 1 + assetIdBytes));
        const trimmedAssetId = hex2ascii(assetId).replace(/\0+$/, '');

        if (indexBytes) {
            index = message[prefixLength + 1 + assetIdBytes];
        }

        const qtyStart = prefixLength + 1 + assetIdBytes + indexBytes;
        const qty = leb128.decodeULEB128(message.slice(qtyStart));

        return {
            assetId: trimmedAssetId,
            indexBytes: index,
            qty: qty[0],
            protocol: params.protocol,
        };
    }
}

export {
    OpenBook,
}