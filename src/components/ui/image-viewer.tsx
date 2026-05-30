import {useState, useRef, useEffect} from "react";
import {
    ZoomIn,
    ZoomOut,
    Download,
    Maximize,
    Minimize,
    RotateCw,
    Image as ImageIcon
} from "lucide-react";

interface ImageViewerProps {
    src: string;
    alt?: string;
    fileName?: string;
}

const ImageViewer = ({ src, alt = "Image", fileName = "image.png" }: ImageViewerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Zoom handlers
    const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
    const resetZoom = () => { setScale(1.0); setRotation(0); };

    const rotate = () => setRotation(prev => (prev + 90) % 360);

    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const downloadImage = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            // fallback
            const a = document.createElement('a');
            a.href = src;
            a.download = fileName;
            a.click();
        }
    };

    const formatZoom = () => `${Math.round(scale * 100)}%`;

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden flex flex-col ${
                isFullscreen ? 'w-screen h-screen' : 'h-full w-full'
            }`}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-zinc-900 z-10">
                    <div className="text-center text-red-600">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-red-500" />
                        <p className="text-lg font-semibold">{error}</p>
                    </div>
                </div>
            )}

            {/* Image Container */}
            <div className="w-full h-full overflow-auto flex items-center justify-center bg-gray-300 dark:bg-zinc-800 p-4 relative">
                {isLoading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy"></div>
                    </div>
                )}
                
                <img
                    src={src}
                    alt={alt}
                    onLoad={() => setIsLoading(false)}
                    onError={() => { setIsLoading(false); setError('Failed to load image'); }}
                    className="shadow-lg transition-transform duration-200"
                    style={{
                        transform: `scale(${scale}) rotate(${rotation}deg)`,
                        transformOrigin: 'center',
                        maxHeight: scale <= 1 ? '100%' : 'none',
                        maxWidth: scale <= 1 ? '100%' : 'none',
                        display: error ? 'none' : 'block'
                    }}
                />
            </div>

            {/* Custom Controls Overlay */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 transition-opacity duration-300 z-20 ${
                showControls ? 'opacity-100' : 'opacity-0'
            }`}>
                <div className="flex items-center justify-center mb-4 flex-wrap gap-4">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2">
                        <button onClick={zoomOut} disabled={scale <= 0.25} className="text-white hover:bg-white/20 p-1 rounded transition-colors disabled:opacity-30">
                            <ZoomOut className="h-4 w-4" />
                        </button>
                        <button onClick={resetZoom} className="text-white text-sm hover:bg-white/20 px-2 py-1 rounded transition-colors min-w-[60px]">
                            {formatZoom()}
                        </button>
                        <button onClick={zoomIn} disabled={scale >= 3} className="text-white hover:bg-white/20 p-1 rounded transition-colors disabled:opacity-30">
                            <ZoomIn className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Additional Tools */}
                        <button onClick={rotate} className="text-white hover:bg-white/20 p-2 rounded transition-colors bg-black/50" title="Rotate">
                            <RotateCw className="h-4 w-4" />
                        </button>

                        <button onClick={downloadImage} className="text-white hover:bg-white/20 p-2 rounded transition-colors bg-black/50" title="Download">
                            <Download className="h-4 w-4" />
                        </button>

                        <button onClick={toggleFullscreen} className="text-white hover:bg-white/20 p-2 rounded transition-colors bg-black/50">
                            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-full text-center max-w-full truncate">
                        {formatZoom()} • {fileName}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageViewer;
