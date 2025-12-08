import { useCallback, useEffect, useRef, useState } from "react";

type UseTextToSpeechReturn = {
    isTalking: boolean;
    stop: () => void;
    sendApi: (text: string) => Promise<void>;
};

/**
 * useTextToSpeech
 * A React hook that plays streamed audio from a TTS API automatically.
 */
export default function useTextToSpeech(): UseTextToSpeechReturn {
    const [isTalking, setIsTalking] = useState(false);
    const [questionText, setQuestionText] = useState<string>('introduction');

    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const urlRef = useRef<string | null>(null);

    /** Attach audio element and cleanup when unmounted */
    useEffect(() => {
        audioRef.current = document.getElementById("tts-audio") as HTMLAudioElement | null;

        return () => {
            stop();
        };
    }, []);

    /** Stop playback and clean up everything */
    const stop = useCallback(() => {
        setIsTalking(false);

        // Abort any active fetch
        abortRef.current?.abort();
        abortRef.current = null;

        // Stop and reset audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute("src");
            audioRef.current.load();
        }

        // Revoke old blob URL
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
        }

        // Reset refs
        mediaSourceRef.current = null;
        sourceBufferRef.current = null;
    }, []);

    /** Main API to trigger TTS streaming */
    const sendApi = useCallback(async (text: string) => {
        if (!text.trim()) return;

        // Stop any ongoing playback first
        stop();

        const controller = new AbortController();
        abortRef.current = controller;

        setIsTalking(true);

        const resp: any = await fetch("http://localhost:3100/api/interview/text-to-speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, question: questionText }),
            signal: controller.signal,
        });

        if (!resp.ok || !resp.body) {
            setIsTalking(false);
            throw new Error("TTS request failed");
        }

        // Setup MediaSource streaming
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;

        const objectUrl = URL.createObjectURL(mediaSource);
        urlRef.current = objectUrl;

        if (!audioRef.current) {
            const el = document.getElementById("tts-audio") as HTMLAudioElement | null;
            if (el) audioRef.current = el;
        }

        if (!audioRef.current) {
            console.error("No <audio id='tts-audio'> element found.");
            setIsTalking(false);
            return;
        }

        audioRef.current.src = objectUrl;

        mediaSource.addEventListener("sourceopen", async () => {
            try {
                const mimeType = "audio/mpeg";
                const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                sourceBufferRef.current = sourceBuffer;

                const reader = resp.body.getReader();
                let started = false;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    await new Promise<void>((resolve, reject) => {
                        const handleUpdate = () => resolve();
                        const handleError = (err: any) => reject(err);

                        sourceBuffer.addEventListener("updateend", handleUpdate, { once: true });
                        sourceBuffer.addEventListener("error", handleError, { once: true });

                        try {
                            sourceBuffer.appendBuffer(value!);
                        } catch (e) {
                            reject(e);
                        }
                    });

                    if (!started) {
                        started = true;
                        try {
                            await audioRef.current!.play();
                        } catch (e) {
                            console.warn("Autoplay blocked:", e);
                        }
                    }
                }

                // End stream cleanly
                if (mediaSource.readyState === "open") {
                    mediaSource.endOfStream();
                }
            } catch (err) {
                console.error("TTS streaming error:", err);
            } finally {
                setIsTalking(false);
            }
        });
    }, [stop]);

    return { isTalking, stop, sendApi };
}
