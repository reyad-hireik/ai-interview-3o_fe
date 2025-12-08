import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import { Avatar, Box, Button } from "convertupleads-theme";
import Peer from "peerjs";

type VideoMap = {
    [key: string]: HTMLVideoElement | null;
};

type PeerMap = {
    [key: string]: any;
};

export default function Room() {
    const myUserIdRef = useRef<number>(10000 + Math.floor(Math.random() * 900000));
    const { roomId } = useParams<{ roomId: string }>();
    const [users, setUsers] = useState<string[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [muted, setMuted] = useState<boolean>(true);
    const [cameraOn, setCameraOn] = useState<boolean>(false);
    const [screenSharing, setScreenSharing] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>('User#' + myUserIdRef.current);
    const [chatOpen, setChatOpen] = useState<boolean>(false);
    const myUserId = myUserIdRef.current;
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);
    const peersRef = useRef<PeerMap>({});
    const userVideosRef = useRef<VideoMap>({});

    const leaveMeeting = () => {
        socket.disconnect();
        window.location.assign('/');
    }

    const addRemoteStream = (user: string, stream: MediaStream) => {
        if (userVideosRef.current[user]) return;
        console.log('Adding remote video for:', user);
        const video = document.createElement("video");
        const placeholderVideo = document.getElementById('placeholder-video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        video.style.borderRadius = "12px";
        video.style.backgroundColor = "#1f1f1f";

        userVideosRef.current[user] = video;

        const container = document.getElementById("video-grid");
        container?.appendChild(video);
        placeholderVideo!.innerHTML = user as string;
    };

    const callUser = (userId: string, stream: MediaStream) => {
        if (!peerRef.current || !stream) return;

        const call = peerRef.current.call(userId, stream);

        if (!call) {
            console.error("Failed to create call to user:", userId);
            return;
        }

        call.on("stream", (remoteStream) => {
            addRemoteStream(userId, remoteStream);
        });

        call.on("close", () => {
            if (userVideosRef.current[userId]) {
                userVideosRef.current[userId]?.remove();
                delete userVideosRef.current[userId];
            }
        });

        peersRef.current[userId] = call;
    };

    useEffect(() => {
        if (!roomId) return;
        const start = async () => {
            const newUserName = prompt("Enter your name:", userName ?? '') || userName;
            setUserName(newUserName);

            const userStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setStream(userStream);

            if (myVideoRef.current) {
                myVideoRef.current.srcObject = userStream;
            }

            const peer = new Peer(newUserName);
            peerRef.current = peer;

            peer.on("open", (user) => {
                socket.emit("join-room", roomId, user);
            });

            peer.on("call", (call) => {
                call.answer(userStream);

                call.on("stream", (remoteStream) => {
                    addRemoteStream(call.peer, remoteStream);
                });

                peersRef.current[call.peer] = call;
            });

            socket.on("all-users", (existingUsers: string[]) => {
                setUsers(existingUsers);
                existingUsers.forEach((userId) => {
                    callUser(userId, userStream);
                });
            });

            socket.on("user-connected", (userId: string) => {
                setUsers((prev) => [...prev, userId]);
                callUser(userId, userStream);
            });

            // ✅ User left → remove video
            socket.on("user-disconnected", (userId: string) => {
                setUsers((prev) => prev.filter((id) => id !== userId));

                if (peersRef.current[userId]) {
                    peersRef.current[userId].close();
                    delete peersRef.current[userId];
                }

                if (userVideosRef.current[userId]) {
                    userVideosRef.current[userId]?.remove();
                    delete userVideosRef.current[userId];
                }
            });
        };

        start();
        return () => {
            socket.off("all-users");
            socket.off("user-connected");
            socket.off("user-disconnected");
            peerRef.current?.destroy();
        };
    }, [roomId]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "background.default" }}>
            {/* Top Bar */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: 1, borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "primary.main" }} />
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Box sx={{ fontWeight: 600 }}>Meeting</Box>
                        <Box sx={{ color: "text.secondary", fontSize: 13 }}>ID: {roomId}</Box>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ px: 2, py: 0.75, borderRadius: 1, bgcolor: "action.hover" }}>1:05 PM</Box>
                    <Box sx={{ px: 2, py: 0.75, borderRadius: 1, bgcolor: "action.hover" }}>{userName}</Box>
                    <Button onClick={leaveMeeting} color="error">Leave room</Button>
                </Box>
            </Box>

            {/* Content Area */}
            <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Video Grid Stage */}
                <Box sx={{ flex: 1, p: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2,
                            width: "100%",
                            height: "100%",
                            gridTemplateColumns: users.length === 0 ? "1fr" :
                                users.length === 1 ? "repeat(2, 1fr)" :
                                    users.length === 2 ? "repeat(2, 1fr)" :
                                        users.length === 3 ? "repeat(2, 1fr)" :
                                            users.length <= 6 ? "repeat(3, 1fr)" :
                                                users.length <= 9 ? "repeat(3, 1fr)" :
                                                    "repeat(4, 1fr)",
                            gridTemplateRows: users.length === 0 ? "1fr" :
                                users.length === 1 ? "1fr" :
                                    users.length === 2 ? "1fr" :
                                        users.length === 3 ? "repeat(2, 1fr)" :
                                            users.length <= 6 ? "repeat(2, 1fr)" :
                                                users.length <= 9 ? "repeat(3, 1fr)" :
                                                    "repeat(3, 1fr)",
                            maxWidth: "100%",
                            maxHeight: "100%"
                        }}
                    >
                        {/* My Video */}
                        <Box
                            sx={{
                                position: "relative",
                                borderRadius: 3,
                                overflow: "hidden",
                                bgcolor: "#1f1f1f",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 0
                            }}
                        >
                            <video
                                ref={myVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    backgroundColor: '#1f1f1f'
                                }}
                            />
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 12,
                                    left: 12,
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    bgcolor: "rgba(0,0,0,0.6)",
                                    color: "white",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75
                                }}
                            >
                                You
                            </Box>
                        </Box>

                        {/* Other Users' Videos */}
                        <Box
                            id="video-grid"
                            sx={{
                                display: "contents",
                                "& > video": {
                                    position: "relative",
                                    borderRadius: 3,
                                    overflow: "hidden"
                                }
                            }}
                        >                        </Box>
                    </Box>
                </Box>

                {/* Sidebar */}
                <Box sx={{ width: chatOpen ? 320 : 260, borderLeft: 1, borderColor: "divider", display: "flex", flexDirection: "column" }}>
                    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ fontWeight: 600 }}>People ({[myUserId, ...Array.from(new Set(users))].length})</Box>
                        {/* <Button onClick={() => setChatOpen((v) => !v)} sx={{ px: 1.5, py: 0.5, borderRadius: 1, bgcolor: "action.hover", border: "none", cursor: "pointer" }}>{chatOpen ? "Close" : "Chat"}</Button> */}
                    </Box>

                    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25, overflowY: "auto" }}>
                        {[myUserId, ...Array.from(new Set(users))].map((id) => (
                            <Box key={id} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: "primary.light" }} />
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ fontSize: 14, fontWeight: 600 }}>{id === myUserId ? "You" : id}</Box>
                                    <Box sx={{ fontSize: 12, color: "text.secondary" }}>Joined</Box>
                                </Box>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main" }} />
                            </Box>
                        ))}
                    </Box>

                    {chatOpen && (
                        <Box sx={{ borderTop: 1, borderColor: "divider", p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                            <Box sx={{ fontWeight: 600, mb: 1 }}>Chat</Box>
                            <Box sx={{ flex: 1, minHeight: 120, borderRadius: 1, bgcolor: "action.hover" }} />
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <input style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid var(--cu-border)" }} placeholder="Type a message" />
                                <Button sx={{ px: 2, borderRadius: 1, bgcolor: "primary.main", color: "primary.contrastText", border: "none", cursor: "pointer" }}>Send</Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Footer Controls */}
            {/* <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, py: 2, borderTop: 1, borderColor: "divider" }}>
                <Button onClick={() => setMuted((m) => !m)}>{muted ? "Unmute" : "Mute"}</Button>
                <Button onClick={handleCameraToggle}>{cameraOn ? "Stop video" : "Start video"}</Button>
                <Button onClick={() => setScreenSharing((s) => !s)}>{screenSharing ? "Stop sharing" : "Present"}</Button>
                <Button onClick={leaveMeeting} color="warning">Leave room</Button>
                <Button onClick={() => setChatOpen((v) => !v)}>{chatOpen ? "Close chat" : "Chat"}</Button>
            </Box> */}
        </Box>
    );
}
