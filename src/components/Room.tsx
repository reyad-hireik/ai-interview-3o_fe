import { Avatar, Box, Typography } from "convertupleads-theme";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import useWebRTC from "../hooks/useWebRTC";
import RoomHeader from "./RoomHeader";
import { isEmpty } from "../utils/core.utils";

export default function Room() {
    const myUserIdRef = useRef<number>(10000 + Math.floor(Math.random() * 900000));
    const myUserId = myUserIdRef.current;
    const { roomId } = useParams<{ roomId: string }>();
    const {
        myVideoRef,
        users,
        userName,
        isCameraOn,
        isMicOn,
        toggleCamera,
        toggleMic,
        handleSpeakSofia
    } = useWebRTC(roomId || '');
    const { text, startListening, mute, unmute } = useSpeechRecognition();
    const [isMicActive, setIsMicActive] = useState<boolean>(true);
    // const [discussion, setDiscussion] = useState<string>('');

    const handleSTT = (userText?: string) => {
        mute();
        const payload = {
            roomId,
            userName,
            text: `${userName}: ${userText}.`
        }
        setTimeout(() => {
            unmute();
        }, 100);

        // testing mic
        console.log('isMicOn #', isMicActive);
        if (!isMicActive || isEmpty(userText)) return;
        console.log(payload);
    }

    const toggleMicrophone = () => {
        const payload = {
            roomId,
            userName,
            text: `${userName}: ${text}.`
        }
        setIsMicActive(prev => !prev);
        toggleMic();
        if (isMicActive && !isEmpty(text))
            console.log(payload);
    }

    useEffect(() => {
        startListening(text => handleSTT(text));
    }, [isMicActive]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "background.default" }}>
            {/* Top Bar */}
            <RoomHeader
                roomId={roomId as string}
                userName={userName}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                onToggleCamera={toggleCamera}
                onToggleMic={toggleMicrophone}
            />

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
                            gridTemplateColumns: users.length === 0 ? "repeat(2, 1fr)" :
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
                                    display: isCameraOn ? 'block' : 'none',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    backgroundColor: '#1f1f1f'
                                }}
                            />
                            {!isCameraOn && (
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: '#1f1f1f'
                                    }}
                                >
                                    <Avatar
                                        size="large"
                                        sx={{
                                            bgcolor: 'primary.main',
                                            width: 96,
                                            height: 96,
                                            fontSize: 36,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                        }}
                                    >{(userName || 'You').charAt(0).toUpperCase()}</Avatar>
                                </Box>
                            )}
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

                        {/* AI Assistant Avatar */}
                        <Box
                            sx={{
                                position: "relative",
                                borderRadius: 3,
                                overflow: "hidden",
                                bgcolor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 0,
                                border: "2px solid",
                                borderColor: "primary.main"
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 2,
                                    p: 3
                                }}
                            >
                                <Avatar
                                    size="large"
                                    sx={{
                                        bgcolor: 'black',
                                        width: 96,
                                        height: 96,
                                        fontSize: 36,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                    onClick={handleSpeakSofia}
                                >S</Avatar>
                                <Box
                                    sx={{
                                        color: "white",
                                        fontSize: 18,
                                        fontWeight: 600,
                                        textAlign: "center",
                                        textShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                    }}
                                >
                                    Sofia
                                </Box>
                            </Box>
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
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        bgcolor: "success.main",
                                        animation: "pulse 2s ease-in-out infinite",
                                        "@keyframes pulse": {
                                            "0%, 100%": { opacity: 1 },
                                            "50%": { opacity: 0.5 }
                                        }
                                    }}
                                />
                                Sofia
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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                            <Avatar size="medium" sx={{ bgcolor: `info.main` }} />
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ fontSize: 14, fontWeight: 600 }}>
                                    Sofia <Typography variant="caption" fontWeight={700} color={"GrayText"}>(AI)</Typography>
                                </Box>
                                <Box sx={{ fontSize: 12, color: "text.secondary" }}>Joined</Box>
                            </Box>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main" }} />
                        </Box>
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
        </Box>
    );
}
