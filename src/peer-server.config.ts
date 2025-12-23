export const peerServerTest = {
    host: 'peer-server-rn7x.onrender.com',
    port: 443,
    secure: true,
    path: '/peerjs',
    config: {
        iceServers: [
            {
                urls: [
                    "stun:stun.cloudflare.com:3478",
                    "stun:stun.cloudflare.com:53"
                ]
            },
            {
                urls: [
                    "turn:turn.cloudflare.com:3478?transport=udp",
                    "turn:turn.cloudflare.com:3478?transport=tcp",
                    "turns:turn.cloudflare.com:5349?transport=tcp",
                    "turn:turn.cloudflare.com:53?transport=udp",
                    "turn:turn.cloudflare.com:80?transport=tcp",
                    "turns:turn.cloudflare.com:443?transport=tcp"
                ],
                username: "g073965b8a81b91b99efc53dae7d5617a16e34931b8ecf107b6cb3fc4141ca0a",
                credential: "ba3944495053f1856e566d33123d2a34aeb7b366f5f2173391c88373b877cd23"
            }
        ]
    }
}

export const peerServerGlobal = {
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    path: '/',
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ]
    }
}

export const peerServerBT1 = {
    host: '64.23.175.176',
    port: 9000,
    secure: false,
    path: '/peerjs',
    config: {
        iceServers: [
            {
                urls: [
                    "stun:stun.cloudflare.com:3478",
                    "stun:stun.cloudflare.com:53"
                ]
            },
            {
                urls: [
                    "turn:turn.cloudflare.com:3478?transport=udp",
                    "turn:turn.cloudflare.com:3478?transport=tcp",
                    "turns:turn.cloudflare.com:5349?transport=tcp",
                    "turn:turn.cloudflare.com:53?transport=udp",
                    "turn:turn.cloudflare.com:80?transport=tcp",
                    "turns:turn.cloudflare.com:443?transport=tcp"
                ],
                username: "g073965b8a81b91b99efc53dae7d5617a16e34931b8ecf107b6cb3fc4141ca0a",
                credential: "ba3944495053f1856e566d33123d2a34aeb7b366f5f2173391c88373b877cd23"
            }
        ]
    }
};