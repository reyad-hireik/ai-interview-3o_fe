import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { socket } from "../socket";
import { User } from "../components/Room";

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

    const [users, setUsers] = useState<User[]>([]);
    const [userName, setUserName] = useState<string>('');
    const isCameraOnRef = useRef<boolean>(true);
    const isMicOnRef = useRef<boolean>(true);

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

    const endMeeting = () => {
        console.log('meeting-ended');
        socket.emit("end-meeting", roomId);
        leaveMeeting();
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
            isCameraOnRef.current = !isCameraOnRef.current;
        }
    };

    const toggleMic = () => {
        if (streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            isMicOnRef.current = !isMicOnRef.current;
        }
    };

    const addRemoteStream = (user: User, stream: MediaStream) => {
        if (userVideosRef.current[user.userId]) return;
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

        userVideosRef.current[user.userId] = video;

        const container = document.getElementById("video-grid");
        container?.appendChild(video);
        if (placeholderVideo) {
            placeholderVideo.innerHTML = user.userName;
        }
    };

    const callUser = (user: User, stream: MediaStream) => {
        try {
            if (!peerRef.current || !stream) return;

            const call = peerRef.current.call(user.userId, stream);
            if (!call) {
                console.error("Failed to create call to user:", user.userId);
                return;
            }

            call.on("stream", (remoteStream) => {
                addRemoteStream(user, remoteStream);
            });

            call.on("close", () => {
                if (userVideosRef.current[user.userId]) {
                    userVideosRef.current[user.userId]?.remove();
                    delete userVideosRef.current[user.userId];
                }
            });

            peersRef.current[user.userId] = call;
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
            const myUserId = `user-${myUserIdRef}`;
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

            const peer = new Peer(myUserId, {
                host: '64.23.175.176',
                port: 9000,
                secure: false,
                path: '/peerjs',
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

            peer.on("open", (userId) => {
                socket.emit("join-room", roomId, { userId, userName: newUserName });
            });

            peer.on("call", (call) => {
                call.answer(userStream);
                console.log('call #', call);
                call.on("stream", (remoteStream) => {
                    addRemoteStream({ userId: call.peer, userName: "" }, remoteStream);
                });

                peersRef.current[call.peer] = call;
            });

            socket.on("all-users", (existingUsers: User[]) => {
                setUsers(existingUsers);
                existingUsers.forEach((user) => {
                    callUser(user, userStream);
                });
            });

            socket.on("user-connected", (user: User) => {
                console.log('user-connected:', user);
                setUsers((prev) => [...prev, user]);
                callUser(user, userStream);
            });

            socket.on("meeting-ended", () => {
                console.log('meeting-ended');
                leaveMeeting();
            });

            socket.on("user-disconnected", (user: User) => {
                console.log('user-disconnected:', user.userId);
                setUsers((prev) => prev.filter((u) => user.userId !== u.userId));

                if (peersRef.current[user.userId]) {
                    peersRef.current[user.userId].close();
                    delete peersRef.current[user.userId];
                }

                if (userVideosRef.current[user.userId]) {
                    userVideosRef.current[user.userId]?.remove();
                    delete userVideosRef.current[user.userId];
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
        endMeeting,
        handleSpeakSofia,
        toggleCamera,
        toggleMic,
        isCameraOn: isCameraOnRef.current,
        isMicOn: isMicOnRef.current
    };
}