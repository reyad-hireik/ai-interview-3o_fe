import { Button, ButtonGroup, ChevronDownIcon, MicrophoneOffSmallIcon, MicrophoneSmallIcon, VideoIcon, VideoOffIcon } from "convertupleads-theme"
import { useRef } from "react";

type RoomDeviceProps = {
    isCameraOn: boolean;
    isMicOn: boolean;
    onToggleCamera: () => void;
    onToggleMic: () => void;
};

const RoomDevice = ({ isCameraOn, isMicOn, onToggleCamera, onToggleMic }: RoomDeviceProps) => {
    const anchorRef = useRef<HTMLDivElement | null>(null);

    return (
        <>
            <ButtonGroup
                variant="outlined"
                color={isCameraOn ? 'primary' : 'warning'}
                ref={anchorRef}
                aria-label="split button"
            >
                <Button
                    variant={isCameraOn ? 'outlined' : 'contained'}
                    onClick={onToggleCamera}
                >
                    {isCameraOn ? <VideoIcon /> : <VideoOffIcon />}
                </Button>
                <Button
                    size="small"
                    // aria-controls={open ? "split-button-menu" : undefined}
                    // aria-expanded={open ? "true" : undefined}
                    aria-label="select merge strategy"
                    aria-haspopup="menu"
                // onClick={handleToggle}
                >
                    <ChevronDownIcon />
                </Button>
            </ButtonGroup>
            <ButtonGroup
                variant="outlined"
                color={isMicOn ? 'primary' : 'warning'}
                ref={anchorRef}
                aria-label="split button"
            >
                <Button
                    variant={isMicOn ? 'outlined' : 'contained'}
                    onClick={onToggleMic}
                >
                    {isMicOn ? <MicrophoneSmallIcon /> : <MicrophoneOffSmallIcon />}
                </Button>
                <Button
                    size="small"
                    // aria-controls={open ? "split-button-menu" : undefined}
                    // aria-expanded={open ? "true" : undefined}
                    aria-label="select merge strategy"
                    aria-haspopup="menu"
                // onClick={handleToggle}
                >
                    <ChevronDownIcon />
                </Button>
            </ButtonGroup>
        </>
    )
}

export default RoomDevice
