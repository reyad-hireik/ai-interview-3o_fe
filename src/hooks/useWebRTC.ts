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
    const streamRef = useRef<MediaStream | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const urlRef = useRef<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const [users, setUsers] = useState<string[]>([]);
    const [userName, setUserName] = useState<string>('');
    const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
    const [isMicOn, setIsMicOn] = useState<boolean>(true);

    const handleSpeakSofia = async () => {
        const controller = new AbortController();
        try {
            const response = await fetch('http://localhost:3100/ai/text',
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: "hello sofia"
                    }),
                    signal: controller.signal,
                }
            );
            let audio = audioRef.current;
            if (!audio) {
                audio = document.getElementById("sofia-audio") as HTMLAudioElement | null;
                if (!audio) throw new Error("No <audio id='sofia-audio'> element found.");
                audioRef.current = audio;
            }

            const mediaSource = new MediaSource();
            mediaSourceRef.current = mediaSource;
            const objectUrl = URL.createObjectURL(mediaSource);
            urlRef.current = objectUrl;
            audio.src = objectUrl;
            const onAudioEnded = () => {
                audio!.removeEventListener("ended", onAudioEnded);
            };

            audio.addEventListener("ended", onAudioEnded);
            mediaSource.addEventListener("sourceopen", async () => {
                const mimeType = "audio/mpeg";
                const sourceBuffer = mediaSource.addSourceBuffer(mimeType);

                const reader = response.body!.getReader();
                let playbackStarted = false;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    await new Promise<void>((resolve, reject) => {
                        const onUpdate = () => {
                            sourceBuffer.removeEventListener("updateend", onUpdate);
                            resolve();
                        };
                        const onError = (ev: any) => {
                            sourceBuffer.removeEventListener("error", onError);
                            reject(ev);
                        };
                        sourceBuffer.addEventListener("updateend", onUpdate, { once: true });
                        sourceBuffer.addEventListener("error", onError, { once: true });
                        sourceBuffer.appendBuffer(value);
                    });

                    if (!playbackStarted) {
                        playbackStarted = true;
                        audio!.play().catch((e) =>
                            console.warn("audio.play() error (likely autoplay block):", e)
                        );
                    }
                }

                if (mediaSource.readyState === "open") {
                    mediaSource.endOfStream();
                }
            });

            abortRef.current!.signal.addEventListener("abort", () => {
                if (audio && !audio.paused) {
                    audio.pause();
                }
            });

            // Broadcast to all peers
            // broadcastToPeers({  });

        } catch (e) {
            console.error("Error playing Sofia audio:", e);
        }
    };

    const leaveMeeting = () => {
        socket.disconnect();
        window.location.assign('/');
    };

    const toggleCamera = async () => {
        if (streamRef.current) {
            const videoTracks = streamRef.current.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOn(prev => !prev);
        }
    };

    const toggleMic = () => {
        if (streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMicOn(prev => !prev);
        }
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
            // const newUserName = `User-${myUserIdRef}`;
            setUserName(newUserName);

            let userStream: MediaStream;
            try {
                userStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            } catch {
                alert(`We could not access both your camera and microphone. Please grant permission to both and try joining the meeting again.`);
                leaveMeeting();
                return;
            }

            streamRef.current = userStream;

            if (myVideoRef.current) {
                myVideoRef.current.srcObject = userStream;
            }

            const peer = new Peer(newUserName, {
                host: '0.peerjs.com',
                port: 443,
                secure: true,
                path: '/',
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        {
                            urls: 'turn:openrelay.metered.ca:80',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        }
                    ]
                }
            });
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
        leaveMeeting,
        handleSpeakSofia,
        toggleCamera,
        toggleMic,
        isCameraOn,
        isMicOn
    };
}