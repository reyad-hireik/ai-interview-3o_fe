import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import { Avatar, Box, Button } from "convertupleads-theme";
// import { v4 as uuidV4 } from "uuid";

export default function Room() {
    const myUserIdRef = useRef<number>(10000 + Math.floor(Math.random() * 900000));
    const { roomId } = useParams<{ roomId: string }>();
    const [users, setUsers] = useState<string[]>([]);
    const [muted, setMuted] = useState<boolean>(true);
    const [cameraOn, setCameraOn] = useState<boolean>(false);
    const [screenSharing, setScreenSharing] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>('User#' + myUserIdRef.current);
    const [chatOpen, setChatOpen] = useState<boolean>(false);
    const myUserId = myUserIdRef.current;

    const leaveMeeting = () => {
        socket.disconnect();
        window.location.assign('/');
    }

    useEffect(() => {
        if (!roomId) return;

        const newUserName = prompt("Enter your name:", userName ?? '') || userName;
        setUserName(newUserName);

        console.log("JOINING ROOM ONCE");

        socket.emit("join-room", roomId, newUserName);

        socket.on("all-users", (existingUsers: string[]) => {
            setUsers(existingUsers);
        });

        socket.on("user-connected", (userId: string) => {
            setUsers((prev) => [...prev, userId]);
            console.log("User connected:", userId);
        });

        socket.on("user-disconnected", (userId: string) => {
            setUsers((prev) => prev.filter((id) => id !== userId));
            console.log("User disconnected:", userId);
        });

        return () => {
            socket.off("user-connected");
            socket.off("user-disconnected");
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
                    {/* <Button onClick={() => navigate('/')} color="error">Close Room</Button> */}
                </Box>
            </Box>

            {/* Content Area */}
            <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Stage */}
                <Box sx={{ flex: 1, p: 3, display: "flex", flexDirection: "column" }}>
                    {/* Active Speaker Tile */}
                    <Box sx={{ flex: 1, borderRadius: 2, bgcolor: "grey.900", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <Avatar size="large" sx={{ height: '80px', width: '80px' }} src={''}>{userName[0]}</Avatar>
                        <Box sx={{ position: "absolute", bottom: 16, left: 16, display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 1, bgcolor: "rgba(0,0,0,0.5)", color: "common.white" }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: muted ? "error.main" : "success.main" }} />
                            <Box>{muted ? "Muted" : "Speaking"}</Box>
                        </Box>
                    </Box>

                    {/* Thumbnails Row */}
                    <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 1.5 }}>
                        {[...Array.from(new Set(users))].slice(0, 6).map((id) => (
                            <Box key={id} sx={{ aspectRatio: "16/10", borderRadius: 1.5, bgcolor: "grey.800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Avatar size="large" sx={{ height: '30px', width: '30px' }} src="">{id[0]}</Avatar>
                            </Box>
                        ))}
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
                                    <Box sx={{ fontSize: 12, color: "text.secondary" }}>{muted ? "Muted" : "On"}</Box>
                                </Box>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: muted ? "error.main" : "success.main" }} />
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
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, py: 2, borderTop: 1, borderColor: "divider" }}>
                <Button onClick={leaveMeeting} color="warning">Leave room</Button>
                {/* <Button onClick={() => setMuted((m) => !m)}>{muted ? "Unmute" : "Mute"}</Button>
                <Button onClick={() => setCameraOn((c) => !c)}>{cameraOn ? "Stop video" : "Start video"}</Button>
                <Button onClick={() => setScreenSharing((s) => !s)}>{screenSharing ? "Stop sharing" : "Present"}</Button>
                <Button onClick={() => setChatOpen((v) => !v)}>{chatOpen ? "Close chat" : "Chat"}</Button> */}
            </Box>
        </Box>
    );
}
