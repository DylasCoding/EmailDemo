// src/smtp/smtpClient.js
import net from 'net';

/**
 * Gửi email bằng cách mở kết nối tới SMTP server (localhost:2525) và gửi lệnh đơn giản.
 * from, to, subject, body are plain strings (may be already encrypted by client).
 */
export function sendViaSMTP({ from, to, subject, body }) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let state = 'greet';
        let dataBuffer = '';

        client.connect(2525, '127.0.0.1', () => {});
        client.on('data', (chunk) => {
            const resp = chunk.toString();
            // console.log('SMTP server ->', resp.trim());
            if (state === 'greet') {
                client.write('HELO example.com\r\n');
                state = 'helo';
            } else if (state === 'helo') {
                client.write(`MAIL FROM:<${from}>\r\n`);
                state = 'mailfrom';
            } else if (state === 'mailfrom') {
                client.write(`RCPT TO:<${to}>\r\n`);
                state = 'rcptto';
            } else if (state === 'rcptto') {
                client.write('DATA\r\n');
                state = 'data';
            } else if (state === 'data') {
                // write email body
                // include Subject header as first line
                client.write(`Subject: ${subject}\r\n`);
                client.write(`${body}\r\n`);
                client.write('.\r\n');
                state = 'enddata';
            } else if (state === 'enddata') {
                client.write('QUIT\r\n');
                state = 'quit';
            } else if (state === 'quit') {
                client.end();
            }
            dataBuffer += resp;
            // last line may include 250 OK, etc — we simply resolve when socket ends
        });

        client.on('end', () => resolve(dataBuffer));
        client.on('close', () => {});
        client.on('error', (err) => reject(err));
    });
}
