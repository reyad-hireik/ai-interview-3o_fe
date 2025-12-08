import { useEffect, useRef, useState } from 'react'
import { socket } from '../socket'

type PeerMap = Record<string, RTCPeerConnection>

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
]

export default function useWebRTC(roomId: string) {
    const localStreamRef = useRef<MediaStream | null>(null)
    const peersRef = useRef<PeerMap>({})
    const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})

    useEffect(() => {
        let mounted = true

        async function start() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                localStreamRef.current = stream

                socket.emit('joinRoom', { roomId })

                socket.on('allUsers', ({ users }) => {
                    // create offer to existing users
                    users.forEach((userId: string) => createOffer(userId))
                })

                socket.on('userJoined', ({ socketId }) => {
                    // a new user joined, we will wait for them to create offer or create one depending on app flow
                    // optionally create offer to the new user
                    createOffer(socketId)
                })

                socket.on('offer', async ({ from, offer }) => {
                    await handleOffer(from, offer)
                })

                socket.on('answer', async ({ from, answer }) => {
                    const pc = peersRef.current[from]
                    if (pc) await pc.setRemoteDescription(answer)
                })

                socket.on('iceCandidate', ({ from, candidate }) => {
                    const pc = peersRef.current[from]
                    if (pc && candidate) pc.addIceCandidate(candidate)
                })

                socket.on('userLeft', ({ socketId }) => {
                    removePeer(socketId)
                })
            } catch (err) {
                console.error('getUserMedia error', err)
            }
        }

        start()

        return () => {
            mounted = false
            // cleanup
            Object.values(peersRef.current).forEach(pc => pc.close())
            peersRef.current = {}
            socket.off('allUsers')
            socket.off('userJoined')
            socket.off('offer')
            socket.off('answer')
            socket.off('iceCandidate')
            socket.off('userLeft')
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop())
            }
        }
    }, [roomId])

    function createPeer(targetId: string, makeOffer: boolean) {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

        // add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!))
        }

        // remote stream (use the provided stream for better audio behavior)
        pc.ontrack = (evt) => {
            const [first] = evt.streams
            if (first) {
                setRemoteStreams(prev => ({ ...prev, [targetId]: first }))
            }
        }

        pc.onicecandidate = (evt) => {
            if (evt.candidate) {
                socket.emit('iceCandidate', { to: targetId, candidate: evt.candidate })
            }
        }

        peersRef.current[targetId] = pc

        if (makeOffer) createOfferSDP(pc, targetId)

        return pc
    }

    async function createOffer(targetId: string) {
        const pc = createPeer(targetId, false)
        await createOfferSDP(pc, targetId)
    }

    async function createOfferSDP(pc: RTCPeerConnection, targetId: string) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('offer', { to: targetId, offer: pc.localDescription })
    }

    async function handleOffer(from: string, offer: RTCSessionDescriptionInit) {
        const pc = createPeer(from, false)
        await pc.setRemoteDescription(offer)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('answer', { to: from, answer: pc.localDescription })
    }

    function removePeer(id: string) {
        const pc = peersRef.current[id]
        if (pc) {
            pc.close()
            delete peersRef.current[id]
        }
        setRemoteStreams(prev => {
            const copy = { ...prev }
            delete copy[id]
            return copy
        })
    }

    return {
        localStream: localStreamRef.current,
        remoteStreams,
        peersRef,
    }
}