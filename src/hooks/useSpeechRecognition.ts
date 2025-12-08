import { useCallback, useEffect, useRef, useState } from "react";

type UseSpeechRecognitionOptions = {
    lang?: string;
    interimResults?: boolean;
    continuous?: boolean;
};

type UseSpeechRecognitionReturn = {
    text: string;
    isListening: boolean;
    startListening: () => void;
    stopListening: () => void;
    setText: (text: string) => void;
};

const useSpeechRecognition = (
    options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn => {
    const { lang = "en-AU", interimResults = true, continuous = true } = options;

    const [text, setText] = useState<string>("");
    const [isListening, setIsListening] = useState<boolean>(false);
    const recognitionRef = useRef<any | null>(null);
    const baselineIndexRef = useRef<number>(0); // ignore results before this index
    const pendingClearRef = useRef<boolean>(false); // mark to reset baseline at next event
    const finalTranscriptRef = useRef<string>("");

    const startListening = useCallback(() => {
        if (typeof window === "undefined") return;
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;

        recognition.onresult = (event: any) => {
            if (pendingClearRef.current) {
                baselineIndexRef.current = event.results.length;
                pendingClearRef.current = false;
                return;
            }

            let interim = "";
            // Process only results after the baseline to avoid replaying old buffer
            for (let i = baselineIndexRef.current; i < event.results.length; i++) {
                const res = event.results[i];
                const piece = res[0]?.transcript ?? "";
                if (res.isFinal) {
                    finalTranscriptRef.current += piece;
                } else {
                    interim += piece;
                }
            }
            setText(finalTranscriptRef.current + interim);
            baselineIndexRef.current = event.results.length;
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        baselineIndexRef.current = 0;
        pendingClearRef.current = false;
        finalTranscriptRef.current = "";
        setText("");
    }, [lang, interimResults, continuous]);

    const stopListening = useCallback(() => {
        try {
            recognitionRef.current?.stop();
        } catch {
            // no-op
        }
        setIsListening(false);
    }, []);

    useEffect(() => {
        return () => {
            try {
                recognitionRef.current?.stop();
            } catch {
                // ignore
            }
            recognitionRef.current = null;
        };
    }, []);

    const externalSetText = useCallback((val: string) => {
        if (val === "") {
            pendingClearRef.current = true;
            finalTranscriptRef.current = "";
        }
        setText(val);
    }, []);

    return { text, isListening, startListening, stopListening, setText: externalSetText };
};

export default useSpeechRecognition;
