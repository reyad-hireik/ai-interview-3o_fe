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
        <Box sx={{ padding: 4, height: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Box>
                <h1>Discushy</h1>
                <p>Start or join a discussion room</p>
                <Button onClick={createRoom} startIcon={<AddIcon />}>Create New Room</Button>
            </Box>

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
