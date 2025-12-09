import { AddIcon, Box, Button, Divider, FormLabel, TextField } from "convertupleads-theme";
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
        <>
            <Box sx={{
                padding: 4,
                height: "80vh",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
            }}>
                <Box>
                    <h1>Discushy</h1>
                    <p>Start or join a discussion room</p>
                    <Button onClick={createRoom} startIcon={<AddIcon />}>Create New Room</Button>
                </Box>

                <Box sx={{ marginTop: 4, border: '1px solid #ccc', borderRadius: 2, padding: 2 }}>
                    <FormLabel>Join a Room</FormLabel>
                    <br />
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
            <Box sx={{ position: 'absolute', bottom: 16, width: '100%', textAlign: 'center' }}>
                <Divider />
                <p>Developed By <a href="https://beetcoder.com" target="_blank">BeetCoder</a></p>
            </Box>
        </>
    );
}
