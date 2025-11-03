// src/pop3/pop3Server.js
import net from 'net';
import { authenticateUser } from '../services/userService.js';
import { getInbox } from '../services/mailService.js';

export function startPOP3Server() {
    const server = net.createServer((socket) => {
        console.log('📡 POP3 client connected');
        socket.write('+OK POP3 server ready\r\n');

        let userEmail = '';
        let authenticated = false;

        socket.on('data', async (chunk) => {
            const [cmd, ...args] = chunk.toString().trim().split(' ');
            console.log('📩 POP3 <-', cmd, args.join(' '));

            if (cmd === 'USER') {
                userEmail = args[0];
                socket.write('+OK user accepted\r\n');
            }
            else if (cmd === 'PASS') {
                const password = args[0];
                authenticated = await authenticateUser(userEmail, password);
                socket.write(authenticated ? '+OK authenticated\r\n' : '-ERR invalid credentials\r\n');
            }
            else if (cmd === 'LIST' && authenticated) {
                const inbox = await getInbox(userEmail);
                socket.write(`+OK ${inbox.length} messages\r\n`);
                inbox.forEach((m, i) => socket.write(`${i + 1} ${m.id}\r\n`));
                socket.write('.\r\n');
            }
            else if (cmd === 'RETR' && authenticated) {
                const index = parseInt(args[0]) - 1;
                const inbox = await getInbox(userEmail);
                const msg = inbox[index];
                if (!msg) return socket.write('-ERR message not found\r\n');
                socket.write(`+OK ${msg.subject}\r\n`);
                socket.write(`Subject: ${msg.subject}\r\n`);
                socket.write(`${msg.body}\r\n.\r\n`);
            }
            else if (cmd === 'QUIT') {
                socket.write('+OK Goodbye\r\n');
                socket.end();
            }
            else {
                socket.write('-ERR unknown command\r\n');
            }
        });

        socket.on('end', () => console.log('POP3 client disconnected'));
    });

    server.listen(1100, () => console.log('POP3 server running on port 1100'));
}
