export function hex2bin(hexString: string): Uint8Array {
	const normalizedHex = hexString.replace(/\s/g, "");
	const bytes = new Uint8Array(
		normalizedHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ??
		[],
	);
	return bytes;
}

export function bin2hex(data: Uint8Array): string {
	return Array.from(data)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export function hex2ascii(hex: string): string {
	return hex.match(/.{1,2}/g)?.map((byte) => String.fromCharCode(Number.parseInt(byte, 16))).join('') ?? "";
}

export function ascii2hex(ascii: string): string {
	return ascii.split('').map((char) => char.charCodeAt(0).toString(16)).join('');
}