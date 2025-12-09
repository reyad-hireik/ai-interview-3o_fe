import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { socket } from "../socket";

type VideoMap = {
    [key: string]: HTMLVideoElement | null;
};

type PeerMap = {
    [key: string]: any;
};

export default function useWebRTC(roomId: string) {
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);
    const peersRef = useRef<PeerMap>({});
    const userVideosRef = useRef<VideoMap>({});
    const [users, setUsers] = useState<string[]>([]);
    const [userName, setUserName] = useState<string>('');

    const leaveMeeting = () => {
        socket.disconnect();
        window.location.assign('/');
    };

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
        if (placeholderVideo) {
            placeholderVideo.innerHTML = user as string;
        }
    };

    const callUser = (userId: string, stream: MediaStream) => {
        try {
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
        } catch (error) {
            console.error("Error calling user:", error);
            alert("Error connecting to room. Please try again later.");
            leaveMeeting();
        }
    };

    useEffect(() => {
        if (!roomId) return;

        const start = async () => {
            const myUserIdRef = 10000 + Math.floor(Math.random() * 900000);
            const newUserName = prompt("Enter your name:") || `User-${myUserIdRef}`;
            setUserName(newUserName);

            const userStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

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

        try {
            start();
        } catch (error) {
            console.error("Error starting the room:", error);
            alert("Can not access the room right now. Please try again later.");
            leaveMeeting();
        }

        return () => {
            socket.off("all-users");
            socket.off("user-connected");
            socket.off("user-disconnected");
            peerRef.current?.destroy();
        };
    }, [roomId]);

    return {
        myVideoRef,
        users,
        userName,
        leaveMeeting
    };
}