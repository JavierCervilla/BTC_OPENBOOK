// progress.ts

const encoder = new TextEncoder();

export function initProgress(total: number, message='Processing'): void {
    const progress = `${message }: 0 / ${total}`;
    Deno.stdout.writeSync(encoder.encode(`\x1b[2K\r${progress}`));
}

export function updateProgress(completed: number, total: number, message='Processing'): void {
    const progress = `${message}: ${completed} / ${total}`;
    Deno.stdout.writeSync(encoder.encode(`\x1b[2K\r${progress}`));
}

export function finishProgress(): void {
    Deno.stdout.writeSync(encoder.encode('\x1b[2K\r'));
}
