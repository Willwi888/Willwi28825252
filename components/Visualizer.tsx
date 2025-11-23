
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LyricLine, VisualSettings, ThemeStyle, AnimationType } from '../types';

interface VisualizerProps {
  lyrics: LyricLine[];
  currentTime: number;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  settings: VisualSettings;
  onExportProgress: (isExporting: boolean) => void;
}

// Improved Easing functions
const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
const easeInOutSine = (x: number): number => -(Math.cos(Math.PI * x) - 1) / 2;
const easeOutBack = (x: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// Particle Class for Visuals
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;

  constructor(w: number, h: number, color: string) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 1;
    this.vy = (Math.random() - 0.5) * 1;
    this.size = Math.random() * 3 + 1;
    this.color = color;
    this.life = 0;
    this.maxLife = Math.random() * 100 + 100;
  }

  update(width: number, height: number, beatFactor: number) {
    this.x += this.vx * beatFactor;
    this.y += this.vy * beatFactor;
    this.life++;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = 1 - this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

const Visualizer: React.FC<VisualizerProps> = ({
  lyrics,
  currentTime,
  isPlaying,
  audioRef,
  settings,
  onExportProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const requestRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  
  // Recording State
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  // Initialize Audio Context (once user interacts)
  const initAudio = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    
    // Connect audio element source
    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
  }, [audioRef]);

  // Load Background Image
  useEffect(() => {
    if (settings.backgroundImage) {
      const img = new Image();
      img.src = settings.backgroundImage;
      img.onload = () => {
        bgImageRef.current = img;
      };
    } else {
      bgImageRef.current = null;
    }
  }, [settings.backgroundImage]);

  // Handle Resize with DPI Support
  useEffect(() => {
    const resize = () => {
      if (containerRef.current && canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const rect = containerRef.current.getBoundingClientRect();
        
        // Logical dimensions
        const width = rect.width;
        const height = width * (9 / 16);
        
        // Set physical dimensions
        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        
        // Set display dimensions
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
        
        // Reset particles on resize
        particlesRef.current = [];
      }
    };
    window.addEventListener('resize', resize);
    resize(); // Initial call
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Main Render Loop
  const animate = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvasRef.current.width / dpr; // Logical width
    const height = canvasRef.current.height / dpr; // Logical height

    // Reset transform to handle DPI scaling automatically
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Get Audio Data
    let beatFactor = 1.0;
    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average low-mid freq for "beat"
      let sum = 0;
      for (let i = 0; i < 20; i++) sum += dataArray[i];
      const average = sum / 20;
      beatFactor = 1 + (average / 255) * settings.beatSensitivity;
    }

    // Clear & Background
    ctx.clearRect(0, 0, width, height);

    if (bgImageRef.current) {
      // Draw Image Cover
      const img = bgImageRef.current;
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let renderW, renderH, offsetX, offsetY;
      
      if (imgRatio > canvasRatio) {
        renderH = height;
        renderW = height * imgRatio;
        offsetX = (width - renderW) / 2;
        offsetY = 0;
      } else {
        renderW = width;
        renderH = width / imgRatio;
        offsetX = 0;
        offsetY = (height - renderH) / 2;
      }
      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
      
      // Dark Overlay
      ctx.fillStyle = `rgba(0,0,0,0.6)`;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw Particles
    if (particlesRef.current.length < settings.particleCount) {
      particlesRef.current.push(new Particle(width, height, Math.random() > 0.5 ? settings.primaryColor : settings.secondaryColor));
    }

    particlesRef.current.forEach((p, index) => {
      p.update(width, height, beatFactor);
      p.draw(ctx);
      if (p.life >= p.maxLife) {
        particlesRef.current.splice(index, 1);
      }
    });

    // Draw Visualizer Bar (Bottom)
    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const barWidth = (width / bufferLength) * 2.5;
      let barX = 0;

      for(let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (height / 3) * beatFactor;
        
        ctx.fillStyle = settings.secondaryColor;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(barX, height - barHeight, barWidth, barHeight);
        ctx.globalAlpha = 1.0;
        
        barX += barWidth + 1;
      }
    }

    // --- ADVANCED TEXT RENDERING LOGIC ---
    
    // We render lines that are current, or in the transition window (entering or exiting)
    const transitionDuration = settings.transitionDuration || 0.5;
    
    // Helper to draw a single line
    const drawLine = (line: LyricLine, phase: 'enter' | 'active' | 'exit', progress: number) => {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Base Properties
      let alpha = 1.0;
      let scale = 1.0;
      let yOffset = 0;
      let blurAmount = 0;
      
      const animType = settings.animationType;
      const fontBasedOffset = settings.fontSize * 1.5; // Move relative to font size

      // Calculate styles based on Phase and Animation Type
      if (phase === 'enter') {
        const t = easeOutCubic(progress); // 0 to 1
        
        if (animType === AnimationType.FADE) {
          alpha = t;
          blurAmount = (1 - t) * 4; // Reduced blur for clarity
        } else if (animType === AnimationType.SLIDE_UP) {
          alpha = t;
          yOffset = fontBasedOffset * (1 - t); // From down to 0
          blurAmount = (1 - t) * 3;
        } else if (animType === AnimationType.ZOOM) {
          alpha = t;
          scale = 0.8 + (0.2 * t); // From 0.8 to 1.0 (Less aggressive)
          blurAmount = (1 - t) * 2;
        } else if (animType === AnimationType.BOUNCE) {
          alpha = Math.min(1, progress * 3);
          const bounceT = easeOutBack(progress);
          scale = 0.5 + (0.5 * bounceT);
        }
      } 
      else if (phase === 'exit') {
        const t = easeInOutSine(progress); // 0 to 1
        
        if (animType === AnimationType.FADE) {
          alpha = 1 - t;
          blurAmount = t * 4;
        } else if (animType === AnimationType.SLIDE_UP) {
          alpha = 1 - t;
          yOffset = -fontBasedOffset * t; // Move up
          blurAmount = t * 3;
        } else if (animType === AnimationType.ZOOM) {
          alpha = 1 - t;
          scale = 1 + (0.3 * t); // Zoom out to 1.3
          blurAmount = t * 2;
        } else if (animType === AnimationType.BOUNCE) {
          alpha = 1 - t;
          scale = 1 - (0.3 * t);
        }
      } 
      else {
        // ACTIVE
        // NO VIBRATION/PULSE as requested for clarity
        scale = 1.0;
        blurAmount = 0;
      }

      // Apply Transformations
      ctx.translate(width / 2, height / 2 + yOffset);
      ctx.scale(scale, scale);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      
      if (blurAmount > 0.5) {
        ctx.filter = `blur(${blurAmount}px)`;
      } else {
        ctx.filter = 'none';
      }

      // Glow / Shadow
      if (settings.style === ThemeStyle.NEON) {
        ctx.shadowColor = settings.primaryColor;
        ctx.shadowBlur = 25 * beatFactor;
      } else if (settings.style === ThemeStyle.FIERY) {
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 20 * beatFactor;
      } else if (settings.style === ThemeStyle.MINIMAL) {
          ctx.shadowBlur = 0;
      } else {
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 10;
      }

      // Draw Main Text
      ctx.font = `900 ${settings.fontSize}px ${settings.fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Multiline support
      const lines = line.text.split('\n');
      const lineHeight = settings.fontSize * 1.2;
      const totalHeight = (lines.length - 1) * lineHeight;
      
      lines.forEach((txt, i) => {
          const ly = (i * lineHeight) - (totalHeight / 2);
          
          if (settings.style === ThemeStyle.NEON || settings.style === ThemeStyle.FIERY) {
              ctx.strokeStyle = settings.primaryColor;
              ctx.lineWidth = 3;
              ctx.strokeText(txt, 0, ly);
          }
          ctx.fillText(txt, 0, ly);
      });

      // Draw Translation (Subtitles)
      if (settings.showTranslation && line.translation) {
        ctx.shadowBlur = 0;
        ctx.filter = 'none'; // Always clear translation
        ctx.font = `500 ${settings.fontSize * 0.45}px ${settings.fontFamily}`;
        ctx.fillStyle = '#cbd5e1'; // lighter gray
        
        // Push it down
        const transY = (totalHeight / 2) + settings.fontSize * 1.0;
        ctx.fillText(line.translation, 0, transY);
      }

      ctx.restore();
    };

    // Determine which lines to draw
    lyrics.forEach((line) => {
        const timeSinceStart = currentTime - line.startTime;
        const timeUntilEnd = line.endTime - currentTime;

        // Is this line active?
        if (currentTime >= line.startTime && currentTime < line.endTime) {
            // Check if entering
            if (timeSinceStart < transitionDuration) {
                drawLine(line, 'enter', timeSinceStart / transitionDuration);
            } else {
                drawLine(line, 'active', 1);
            }
        }
        // Is this line recently finished? (Exiting)
        else if (currentTime >= line.endTime && currentTime < line.endTime + transitionDuration) {
             const exitProgress = (currentTime - line.endTime) / transitionDuration;
             drawLine(line, 'exit', exitProgress);
        }
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [currentTime, lyrics, settings]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Setup Audio Context on first interaction
  useEffect(() => {
    if (isPlaying) {
      initAudio();
      audioContextRef.current?.resume();
    }
  }, [isPlaying, initAudio]);

  // Export Logic
  const startRecording = () => {
    if (!canvasRef.current || !audioRef.current) return;

    const canvasStream = canvasRef.current.captureStream(60); // 60 FPS
    
    const dest = audioContextRef.current!.createMediaStreamDestination();
    sourceRef.current!.connect(dest);
    
    const audioTrack = dest.stream.getAudioTracks()[0];
    canvasStream.addTrack(audioTrack);

    const recorder = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000 // 8 Mbps for better quality
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      chunksRef.current = [];
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'willwi-lyric-video.webm';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setRecording(false);
      onExportProgress(false);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    onExportProgress(true);
    
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      audioRef.current?.pause();
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div 
        ref={containerRef} 
        className="w-full relative shadow-2xl rounded-xl overflow-hidden border-2 border-brand-800 bg-black aspect-video"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Overlay Recording Status */}
        {recording && (
           <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/80 px-3 py-1 rounded-full animate-pulse z-20">
             <div className="w-3 h-3 bg-white rounded-full"></div>
             <span className="text-xs font-bold text-white">REC</span>
           </div>
        )}
      </div>

      <div className="flex justify-between items-center bg-brand-800 p-4 rounded-xl border border-brand-800">
        <div className="text-sm text-gray-400">
            {recording ? "錄製中... 請讓歌曲播放完畢，按停止以儲存" : "預覽模式 - 請確保瀏覽器硬體加速已開啟"}
        </div>
        {!recording ? (
             <button 
             onClick={startRecording}
             className="px-6 py-2 bg-gradient-to-r from-brand-500 to-neon-purple rounded-lg text-white font-bold hover:opacity-90 transition-all flex items-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
             </svg>
             開始錄製 (MP4/WebM)
           </button>
        ) : (
            <button 
            onClick={stopRecording}
            className="px-6 py-2 bg-red-500 rounded-lg text-white font-bold hover:bg-red-600 transition-all"
          >
            停止並下載
          </button>
        )}
       
      </div>
    </div>
  );
};

export default Visualizer;
