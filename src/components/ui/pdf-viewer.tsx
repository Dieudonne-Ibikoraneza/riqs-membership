import {useState, useRef, useEffect, JSX} from "react";
import {
    ZoomIn,
    ZoomOut,
    Download,
    ChevronLeft,
    ChevronRight,
    Maximize,
    Minimize,
    RotateCw,
    BookOpen,
} from "lucide-react";

interface PDFViewerProps {
    src: string;
    fileName?: string;
}

interface PDFDocument {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPage>;
    destroy(): Promise<void>;
}

interface RenderContext {
    canvasContext: CanvasRenderingContext2D;
    transform?: number[];
    viewport: Viewport;
}

interface PDFPage {
    getViewport(options: { scale: number; rotation: number }): Viewport;
    render(renderContext: RenderContext): { promise: Promise<void>; cancel(): void };
}

interface Viewport {
    width: number;
    height: number;
}

interface RenderTask {
    cancel(): void;
    promise: Promise<void>;
}

interface PDFJSLib {
    GlobalWorkerOptions: {
        workerSrc: string;
    };
    getDocument(src: string): { promise: Promise<PDFDocument> };
}

declare global {
    interface Window {
        pdfjsLib?: PDFJSLib;
    }
}

const PDFViewer = ({ src, fileName = "document.pdf" }: PDFViewerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [canvasElements, setCanvasElements] = useState<JSX.Element[]>([]);

    const pdfDocRef = useRef<PDFDocument | null>(null);
    const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
    const instanceIdRef = useRef(`pdf-${Math.random().toString(36).substr(2, 9)}`);

    // PDF.js setup
    useEffect(() => {
        let mounted = true;

        const loadPDF = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Cancel all existing render tasks first
                renderTasksRef.current.forEach((task, pageNum) => {
                    if (task && task.cancel) {
                        task.cancel();
                    }
                });
                renderTasksRef.current.clear();

                // Load PDF.js from CDN
                if (!window.pdfjsLib) {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                    script.async = true;

                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                const pdfjsLib = window.pdfjsLib as PDFJSLib;
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

                const loadingTask = pdfjsLib.getDocument(src);
                const pdf = await loadingTask.promise;

                if (!mounted) return;

                pdfDocRef.current = pdf;
                setTotalPages(pdf.numPages);

                // Create canvas elements using React state
                const canvases = [];
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    canvases.push(
                        <div key={pageNum} className="relative">
                            <canvas
                                id={`${instanceIdRef.current}-page-${pageNum}`}
                                className="shadow-lg bg-white"
                            />
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                Page {pageNum}
                            </div>
                        </div>
                    );
                }
                setCanvasElements(canvases);

                // Then render all pages
                await renderAllPages(pdf, scale);

                setIsLoading(false);
            } catch (err) {
                if (mounted) {
                    setError('Failed to load PDF');
                    console.error('PDF loading error:', err);
                    setIsLoading(false);
                }
            }
        };

        loadPDF();

        return () => {
            mounted = false;
            // Cleanup on unmount
            renderTasksRef.current.forEach((task, pageNum) => {
                if (task && task.cancel) {
                    task.cancel();
                }
            });
            renderTasksRef.current.clear();

            if (pdfDocRef.current) {
                pdfDocRef.current.destroy().catch(() => {});
                pdfDocRef.current = null;
            }
        };
    }, [src]);

    const renderAllPages = async (pdf: PDFDocument, zoom: number) => {
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            await renderPage(pdf, pageNum, zoom);
        }
    };

    const renderPage = async (pdf: PDFDocument, pageNum: number, zoom: number) => {
        try {
            // Wait a bit for the canvas to be available in DOM
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = document.getElementById(`${instanceIdRef.current}-page-${pageNum}`) as HTMLCanvasElement;
            if (!canvas) {
                console.warn(`Canvas for page ${pageNum} not found, retrying...`);
                // Retry after a short delay
                setTimeout(() => renderPage(pdf, pageNum, zoom), 200);
                return;
            }

            // Clear any existing render task for this page
            const existingTask = renderTasksRef.current.get(pageNum);
            if (existingTask && existingTask.cancel) {
                existingTask.cancel();
            }

            const page = await pdf.getPage(pageNum);
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Get viewport at the desired scale
            const viewport = page.getViewport({ scale: zoom, rotation });
            const outputScale = window.devicePixelRatio || 1;

            // Set canvas size to match viewport scaled by device pixel ratio for high DPI
            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);

            // Set display size to match actual size
            canvas.style.width = `${Math.floor(viewport.width)}px`;
            canvas.style.height = `${Math.floor(viewport.height)}px`;

            const transform = outputScale !== 1
                ? [outputScale, 0, 0, outputScale, 0, 0]
                : undefined;

            // Clear the canvas before rendering
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const renderContext: RenderContext = {
                canvasContext: ctx,
                transform: transform,
                viewport: viewport
            };

            // Store and execute the render task
            const renderTask = page.render(renderContext);
            renderTasksRef.current.set(pageNum, renderTask);

            await renderTask.promise;

            // Remove completed task
            renderTasksRef.current.delete(pageNum);

        } catch (error) {
            // Ignore cancellation errors
            if (error instanceof Error && error.name === 'RenderingCancelledException') {
                return;
            }
            console.error(`Error rendering page ${pageNum}:`, error);
        }
    };

    // Re-render all pages when scale or rotation changes
    useEffect(() => {
        if (pdfDocRef.current) {
            renderAllPages(pdfDocRef.current, scale);
        }
    }, [scale, rotation]);

    // Track current page based on scroll position
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer || totalPages === 0) return;

        const handleScroll = () => {
            const containerHeight = scrollContainer.clientHeight;

            // Find which page is most visible
            for (let i = 1; i <= totalPages; i++) {
                const canvas = document.getElementById(`${instanceIdRef.current}-page-${i}`) as HTMLCanvasElement;
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const containerRect = scrollContainer.getBoundingClientRect();

                    // Check if page is in the middle of viewport
                    if (rect.top <= containerRect.top + containerHeight / 2 &&
                        rect.bottom >= containerRect.top + containerHeight / 2) {
                        setCurrentPage(i);
                        break;
                    }
                }
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [totalPages]);

    const zoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5));
    };

    const resetZoom = () => {
        setScale(1.0);
    };

    const scrollToPage = (pageNum: number) => {
        const canvas = document.getElementById(`${instanceIdRef.current}-page-${pageNum}`) as HTMLCanvasElement;
        if (canvas && scrollContainerRef.current) {
            canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            scrollToPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            scrollToPage(currentPage - 1);
        }
    };

    const goToPage = (page: number) => {
        const pageNum = Math.max(1, Math.min(page, totalPages));
        scrollToPage(pageNum);
    };

    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const rotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const downloadPDF = () => {
        const a = document.createElement('a');
        a.href = src;
        a.download = fileName;
        a.click();
    };

    const formatZoom = () => {
        return `${Math.round(scale * 100)}%`;
    };

    // Handle fullscreen changes
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
            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading PDF...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <div className="text-center text-red-600">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">{error}</p>
                        <p className="text-sm text-gray-600 mt-2">Please check the PDF URL and try again.</p>
                    </div>
                </div>
            )}

            {/* PDF Pages Container */}
            {!isLoading && !error && (
                <div
                    ref={scrollContainerRef}
                    className="w-full h-full overflow-auto bg-gray-300"
                    style={{ padding: '20px 0' }}
                >
                    <div className="flex flex-col items-center gap-4">
                        {canvasElements}
                    </div>
                </div>
            )}

            {/* Custom Controls Overlay */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
            }`}>
                {/* Page Navigation */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Page Controls */}
                        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2">
                            <button
                                onClick={prevPage}
                                disabled={currentPage <= 1}
                                className="text-white hover:bg-white/20 p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <div className="flex items-center gap-2 text-white text-sm">
                                <input
                                    type="number"
                                    min="1"
                                    max={totalPages}
                                    value={currentPage}
                                    onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                                    className="w-12 bg-white/20 border border-white/30 rounded px-2 py-1 text-center text-white"
                                />
                                <span className="text-white/70">of {totalPages}</span>
                            </div>

                            <button
                                onClick={nextPage}
                                disabled={currentPage >= totalPages}
                                className="text-white hover:bg-white/20 p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2">
                            <button
                                onClick={zoomOut}
                                disabled={scale <= 0.5}
                                className="text-white hover:bg-white/20 p-1 rounded transition-colors disabled:opacity-30"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </button>

                            <button
                                onClick={resetZoom}
                                className="text-white text-sm hover:bg-white/20 px-2 py-1 rounded transition-colors min-w-[60px]"
                            >
                                {formatZoom()}
                            </button>

                            <button
                                onClick={zoomIn}
                                disabled={scale >= 3}
                                className="text-white hover:bg-white/20 p-1 rounded transition-colors disabled:opacity-30"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Additional Tools */}
                        <button
                            onClick={rotate}
                            className="text-white hover:bg-white/20 p-2 rounded transition-colors"
                            title="Rotate"
                        >
                            <RotateCw className="h-4 w-4" />
                        </button>

                        <button
                            onClick={downloadPDF}
                            className="text-white hover:bg-white/20 p-2 rounded transition-colors"
                            title="Download"
                        >
                            <Download className="h-4 w-4" />
                        </button>

                        <button
                            onClick={toggleFullscreen}
                            className="text-white hover:bg-white/20 p-2 rounded transition-colors"
                        >
                            {isFullscreen ? (
                                <Minimize className="h-4 w-4" />
                            ) : (
                                <Maximize className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Zoom Level Indicator */}
                <div className="flex justify-center">
                    <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-full text-center max-w-full truncate">
                        Page {currentPage} of {totalPages} • {formatZoom()} • {fileName}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFViewer;
