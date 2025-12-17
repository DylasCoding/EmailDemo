// Utility function to convert a base64 string to a Blob object

export function base64ToBlob(base64, mimeType) {
    const byteChars = atob(base64);
    const byteNumbers = new Uint8Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
    }

    return new Blob([byteNumbers], { type: mimeType });
}
