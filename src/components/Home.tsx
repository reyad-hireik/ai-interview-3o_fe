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
        <div style={{ padding: 40 }}>
            <h1>Video Meeting</h1>

            <button onClick={createRoom}>Create New Room</button>

            <div style={{ marginTop: 20 }}>
                <input
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                />
                <button onClick={joinRoom}>Join Room</button>
            </div>
        </div>
    );
}
