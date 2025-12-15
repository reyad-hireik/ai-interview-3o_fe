import { Avatar, Box, Button, CopyIcon, IconButton, Stack } from "convertupleads-theme";
import { useEffect, useState } from "react";
import { socket } from "../socket";
import RoomDevice from "./RoomDevice";

interface IProps {
    roomId: string;
    userName: string;
    isCameraOn: boolean;
    isMicOn: boolean;
    onToggleCamera: () => void;
    onToggleMic: () => void;
}

const RoomHeader = ({ roomId, userName, isCameraOn, isMicOn, onToggleCamera, onToggleMic }: IProps) => {
    const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));


    const leaveMeeting = () => {
        socket.disconnect();
        window.location.assign('/');
    };

    const handleCopyRoomId = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar size="large" sx={{ bgcolor: 'primary.main' }} src='https://www.freeiconspng.com/thumbs/meeting-icon/meeting-icon-png-presentation-icon-board-meeting-icon-meeting-icon--4.png' />
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ fontWeight: 600 }}>BT1 Interview Room</Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ color: "text.secondary", fontSize: 13 }}>ID: {roomId}</Box>
                        <IconButton size="small" onClick={handleCopyRoomId}><CopyIcon /></IconButton>
                    </Stack>
                </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <audio id="sofia-audio" style={{ display: 'none' }} controls autoPlay />
                {/* <Button variant="tonal" onClick={handleSpeakSofia}>Sofia</Button> */}
                <Box sx={{ px: 2, py: 0.75, borderRadius: 1, bgcolor: "action.hover" }}>{currentTime}</Box>
                <Box sx={{ px: 2, py: 0.75, borderRadius: 1, bgcolor: "action.hover" }}>{userName}</Box>
                <RoomDevice
                    isCameraOn={isCameraOn}
                    isMicOn={isMicOn}
                    onToggleCamera={onToggleCamera}
                    onToggleMic={onToggleMic}
                />
                <Button onClick={leaveMeeting} color="error">Leave room</Button>
            </Box>
        </Box>
    )
}

export default RoomHeader
