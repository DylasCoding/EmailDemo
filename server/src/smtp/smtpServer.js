// src/smtp/smtpServer.js
import net from 'net';
import { saveEmail } from '../services/mailService.js';

export function startSMTPServer() {
    const server = net.createServer((socket) => {
        console.log('📡 SMTP client connected');
        socket.write('220 SMTP server ready\r\n');

        let sender = '';
        let recipient = '';
        let dataMode = false;
        let buffer = '';

        socket.on('data', async (chunk) => {
            const line = chunk.toString().trim();
            console.log('📨 SMTP <-', line);

            if (line.startsWith('HELO')) {
                socket.write('250 Hello\r\n');
            }
            else if (line.startsWith('MAIL FROM:')) {
                sender = line.split(':')[1].trim().replace(/[<>]/g, '');
                socket.write('250 OK\r\n');
            }
            else if (line.startsWith('RCPT TO:')) {
                recipient = line.split(':')[1].trim().replace(/[<>]/g, '');
                socket.write('250 OK\r\n');
            }
            else if (line === 'DATA') {
                dataMode = true;
                buffer = '';
                socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
            }
            else if (dataMode) {
                if (line === '.') {
                    dataMode = false;
                    try {
                        const [subjectLine, ...bodyLines] = buffer.split('\n');
                        const subject = subjectLine.replace('Subject:', '').trim();
                        const body = bodyLines.join('\n').trim();

                        await saveEmail(sender, recipient, subject, body);
                        console.log(`Email stored: ${subject}`);
                        socket.write('250 Message accepted\r\n');
                    } catch (err) {
                        console.error('Failed to store email:', err);
                        socket.write('550 Failed to store email\r\n');
                    }
                } else {
                    buffer += line + '\n';
                }
            }
            else if (line === 'QUIT') {
                socket.write('221 Bye\r\n');
                socket.end();
            }
            else {
                socket.write('250 OK\r\n');
            }
        });

        socket.on('end', () => console.log('SMTP client disconnected'));
    });

    server.listen(2525, () => console.log('SMTP server running on port 2525'));
}
