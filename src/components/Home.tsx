import { AddIcon, Box, Button, TextField } from "convertupleads-theme";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { v4 as uuidV4 } from "uuid";

export default function Home() {
    const [roomId, setRoomId] = useState("");
    const navigate = useNavigate();

    const createRoom = () => {
        const id = 10000 + Math.floor(Math.random() * 900000);
        navigate(`/room/${id}`);
    };

    const joinRoom = () => {
        if (!roomId) return;
        navigate(`/room/${roomId}`);
    };

    return (
        <Box sx={{ padding: 4 }}>
            <h1>Interview Meeting</h1>

            <Button onClick={createRoom} startIcon={<AddIcon />}>Create New Room</Button>

            <Box sx={{ marginTop: 4 }}>
                <TextField
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    autoComplete="off"
                />
                <br />
                <br />
                <Button variant="tonal" onClick={joinRoom}>Join Room</Button>
            </Box>
        </Box>
    );
}
