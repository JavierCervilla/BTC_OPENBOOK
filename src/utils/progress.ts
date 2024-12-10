// progress.ts

const encoder = new TextEncoder();

export function initProgress(total: number): void {
    const progress = `Processing: 0 / ${total}`;
    Deno.stdout.writeSync(encoder.encode(`\x1b[2K\r${progress}`));
}

export function updateProgress(completed: number, total: number): void {
    const progress = `Processing: ${completed} / ${total}`;
    Deno.stdout.writeSync(encoder.encode(`\x1b[2K\r${progress}`));
}

export function finishProgress(): void {
    Deno.stdout.writeSync(encoder.encode('\x1b[2K\r'));
}
