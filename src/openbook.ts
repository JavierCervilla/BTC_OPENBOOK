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


import * as leb128 from "@thi.ng/leb128";
import { ascii2hex, bin2hex, hex2ascii, hex2bin } from "@/utils/index.ts";


interface Config {
    PREFIX: string;
    VERSIONS: {
        [key: number]: {
            TIMELOCK: number;
        }
    },
    [key: number]: ProtocolConfig;
};

interface ProtocolConfig {
    name: string;
    asset_id_bytes: number;
    index_bytes: number;
}

interface EncodeMessageParams {
    protocol: number;
    asset_id: string;
    qty: bigint;
    index?: number;
    divisible_bytes?: number;
}

interface DecodeMessageParams {
    protocol: number;
    message: string;
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class OpenBook {
    static OB_PROTOCOL_CONFIG: Config = {
        PREFIX: "OB",
        VERSIONS: {
            0: {
                TIMELOCK: 800,
            }
        },
        0: {
            name: "XCP",
            asset_id_bytes: 20,
            divisible_bytes: 1,
            index_bytes: 0,
        },
        1: {
            name: "ORDINALS",
            asset_id_bytes: 64,
            index_bytes: 1,
        }
    };

    static encodeMessage(params: EncodeMessageParams) {
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

    static decodeMessage(params: DecodeMessageParams) {
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
            index,
            qty: qty[0],
        };
    }
}

export {
    OpenBook,
}

const message = OpenBook.encodeMessage({
    protocol: 0,
    asset_id: "A6524912715479370914",
    qty: 1n,
});
const hex_message = bin2hex(message);
console.log(hex_message);
console.log(hex_message.length);
const decoded = OpenBook.decodeMessage({
    protocol: 0,
    message: bin2hex(message),
});
console.log(decoded);