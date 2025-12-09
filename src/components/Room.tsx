import { Avatar, Box, Button, CopyIcon, IconButton, Stack } from "convertupleads-theme";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useWebRTC from "../hooks/useWebRTC";

export default function Room() {
    const myUserIdRef = useRef<number>(10000 + Math.floor(Math.random() * 900000));
    const myUserId = myUserIdRef.current;
    const { roomId } = useParams<{ roomId: string }>();
    const { myVideoRef, users, userName, leaveMeeting } = useWebRTC(roomId || '');
    const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleCopyRoomId = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "background.default" }}>
            {/* Top Bar */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: 1, borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar size="large" sx={{ bgcolor: 'primary.main' }} src='https://www.freeiconspng.com/thumbs/meeting-icon/meeting-icon-png-presentation-icon-board-meeting-icon-meeting-icon--4.png' />
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Box sx={{ fontWeight: 600 }}>Meeting Room</Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ color: "text.secondary", fontSize: 13 }}>ID: {roomId}</Box>
                            <IconButton size="small" onClick={() => handleCopyRoomId()}><CopyIcon /></IconButton>
                        </Stack>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ px: 2, py: 0.75, borderRadius: 1, bgcolor: "action.hover" }}>{currentTime}</Box>
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
                                position: "relative",
                                "& > video": {
                                    borderRadius: 3,
                                    overflow: "hidden"
                                }
                            }}
                        ></Box>
                    </Box>
                </Box>

                {/* Sidebar */}
                <Box sx={{ width: 260, borderLeft: 1, borderColor: "divider", display: "flex", flexDirection: "column" }}>
                    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ fontWeight: 600 }}>People ({[myUserId, ...Array.from(new Set(users))].length})</Box>
                        {/* <Button onClick={() => setChatOpen((v) => !v)} sx={{ px: 1.5, py: 0.5, borderRadius: 1, bgcolor: "action.hover", border: "none", cursor: "pointer" }}>{chatOpen ? "Close" : "Chat"}</Button> */}
                    </Box>

                    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25, overflowY: "auto" }}>
                        {[myUserId, ...Array.from(new Set(users))].map((id) => (
                            <Box key={id} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                <Avatar size="medium" sx={{ bgcolor: `info.main` }} />
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ fontSize: 14, fontWeight: 600 }}>{id === myUserId ? "You" : id}</Box>
                                    <Box sx={{ fontSize: 12, color: "text.secondary" }}>Joined</Box>
                                </Box>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main" }} />
                            </Box>
                        ))}
                    </Box>

                    {/* {chatOpen && (
                        <Box sx={{ borderTop: 1, borderColor: "divider", p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                            <Box sx={{ fontWeight: 600, mb: 1 }}>Chat</Box>
                            <Box sx={{ flex: 1, minHeight: 120, borderRadius: 1, bgcolor: "action.hover" }} />
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <input style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid var(--cu-border)" }} placeholder="Type a message" />
                                <Button sx={{ px: 2, borderRadius: 1, bgcolor: "primary.main", color: "primary.contrastText", border: "none", cursor: "pointer" }}>Send</Button>
                            </Box>
                        </Box>
                    )} */}
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
