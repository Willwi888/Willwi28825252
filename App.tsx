
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LyricLine, VisualSettings, ThemeStyle, AnimationType } from './types';
import { detectAndParse, lyricsToString, parseSRT } from './utils/srtParser';
import { analyzeLyricsForTheme, translateLyricsAI, smartTimingAI } from './services/geminiService';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';

// --- Types & Constants ---

const DEFAULT_SETTINGS: VisualSettings = {
  primaryColor: '#fbbf24', // Noodle Yellow
  secondaryColor: '#ea580c', // Soup Orange
  backgroundColor: '#1c1917', // Dark Stone
  fontFamily: 'Noto Serif TC', // Changed to Serif for the vibe
  fontSize: 60,
  particleCount: 50,
  beatSensitivity: 1.0,
  style: ThemeStyle.NEON,
  animationType: AnimationType.SLIDE_UP,
  animationSpeed: 1.0,
  transitionDuration: 0.6,
  showTranslation: false,
  driveFolderUrl: 'https://drive.google.com/drive/folders/1io5C1RJdw7hzlPpgLOhpBKPJr7DCpfoV?usp=drive_link'
};

const SAMPLE_LYRICS: LyricLine[] = [
  { id: '1', startTime: 0, endTime: 4, text: "歡迎來到 Willwi 實驗室", translation: "Welcome to Willwi Lab" },
  { id: '2', startTime: 4.1, endTime: 8, text: "這是屬於你的創作禮物", translation: "This is your creative gift" },
  { id: '3', startTime: 8.1, endTime: 12, text: "請親手對上時間，感受溫度", translation: "Sync it by hand, feel the warmth" },
];

// --- Sub-Components for the Campaign Page ---

const LandingPage = ({ onUnlock }: { onUnlock: () => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [proofLink, setProofLink] = useState('');
  const [claimed, setClaimed] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === '暗號') {
      onUnlock();
    } else {
      setError('暗號錯誤。也許你還沒嘗過那種孤獨？');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleClaim = (e: React.FormEvent) => {
      e.preventDefault();
      if(proofLink.length > 5) {
          setClaimed(true);
      }
  };

  return (
    <div className="min-h-screen bg-brand-900 text-stone-300 font-sans selection:bg-soup selection:text-white overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative py-20 px-6 flex flex-col items-center justify-center text-center min-h-[60vh] overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-800 via-brand-900 to-black opacity-80"></div>
            
            {/* Sparkling Particles */}
            <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse-slow"></div>

            <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto pt-10">
                <h1 className="text-5xl md:text-7xl font-serif font-bold text-noodle mb-6 tracking-tight drop-shadow-lg">
                   Willwi 泡麵聲學院
                </h1>
                <p className="text-lg md:text-xl text-stone-400 max-w-2xl mb-8 leading-relaxed font-light">
                   你也參加泡麵實驗了嗎？<br/>
                   <span className="text-white font-medium">分享溫度，解鎖禮包</span>
                </p>

                {/* Thermometer / Progress */}
                <div className="w-full max-w-md bg-brand-800 h-4 rounded-full overflow-hidden border border-brand-700 relative mb-2">
                    <div className="absolute inset-0 bg-brand-800 z-0"></div>
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-noodle to-soup w-[27%] animate-pulse z-10 rounded-full"></div>
                </div>
                <p className="text-xs text-soup font-bold tracking-widest uppercase mb-12">
                   目前有 134 位朋友參與分享 🔥
                </p>

                <div className="flex gap-4">
                     <a href="#verify" className="bg-noodle hover:bg-noodle-light text-brand-900 px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                         我已分享！
                     </a>
                     <a href="#wall" className="border border-stone-600 hover:border-noodle hover:text-noodle text-stone-400 px-8 py-3 rounded-full font-bold transition-all">
                         逛逛留言牆
                     </a>
                </div>
            </div>
        </section>

        {/* Verification Section */}
        <section id="verify" className="py-20 px-6 bg-brand-800/30 border-y border-brand-800 relative">
             <div className="max-w-xl mx-auto text-center">
                 <h2 className="text-2xl font-serif font-bold text-white mb-8">截圖驗證</h2>
                 
                 {!claimed ? (
                     <form onSubmit={handleClaim} className="bg-brand-900 p-8 rounded-2xl border border-brand-700 shadow-xl">
                         <div className="mb-6">
                             <label className="block text-left text-sm font-bold text-stone-400 mb-2">分享連結 / 截圖證明</label>
                             <input 
                               type="text" 
                               value={proofLink}
                               onChange={(e) => setProofLink(e.target.value)}
                               placeholder="貼上 IG 限動或 Threads 連結..."
                               className="w-full bg-brand-800 border border-brand-600 rounded-lg px-4 py-3 text-stone-200 outline-none focus:border-noodle"
                             />
                         </div>
                         <button 
                            type="submit"
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${proofLink.length > 5 ? 'bg-soup text-white hover:bg-orange-600' : 'bg-brand-700 text-stone-500 cursor-not-allowed'}`}
                            disabled={proofLink.length <= 5}
                         >
                             領取泡麵悲劇禮包 🎁
                         </button>
                     </form>
                 ) : (
                     <div className="bg-brand-900 p-8 rounded-2xl border border-noodle shadow-[0_0_30px_rgba(251,191,36,0.2)] animate-pulse">
                         <h3 className="text-xl font-bold text-noodle mb-2">🎉 驗證成功！</h3>
                         <p className="text-stone-300 mb-6">您的悲劇禮包（哭臉桌布 + 音效）已準備好。</p>
                         <button className="bg-stone-200 text-brand-900 px-6 py-2 rounded-lg font-bold hover:bg-white transition-colors">
                             立即下載
                         </button>
                     </div>
                 )}
             </div>
        </section>

        {/* Message Wall */}
        <section id="wall" className="py-20 px-6 max-w-5xl mx-auto">
            <h2 className="text-center text-2xl font-serif font-bold text-stone-400 mb-12">大家都是怎麼煮這碗麵的？</h2>
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { name: 'Alex', text: '半夜三點的泡麵，吃的是一種自由。', tag: '深夜組' },
                    { name: 'Chloe', text: '加顆蛋，是對生活最後的倔強。', tag: '加蛋派' },
                    { name: 'Will', text: '分享，還能帶來溫度。', tag: '發起人' },
                ].map((msg, i) => (
                    <div key={i} className="bg-brand-800 p-6 rounded-xl border border-brand-700 hover:border-stone-500 transition-all">
                        <p className="text-stone-300 mb-4 font-serif leading-relaxed">"{msg.text}"</p>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-stone-500">@{msg.name}</span>
                            <span className="bg-brand-700 text-stone-400 px-2 py-1 rounded">#{msg.tag}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Password Gate */}
        <section className="py-24 px-6 relative">
            <div className="w-full max-w-md mx-auto mb-12 relative z-10">
                <div className="bg-black/40 backdrop-blur-sm border border-brand-800 p-8 rounded-2xl text-center shadow-2xl">
                    <h3 className="text-xl font-serif font-bold text-stone-500 mb-6 tracking-widest">請輸入暗號</h3>
                    <form onSubmit={handlePasswordSubmit} className="flex gap-2 relative">
                        <input 
                          type="text" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="請輸入暗號..."
                          className="flex-1 bg-brand-900 border border-brand-700 rounded-lg px-4 py-3 text-stone-200 focus:border-noodle focus:ring-1 focus:ring-noodle outline-none transition-all placeholder:text-stone-600 text-center"
                        />
                        <button type="submit" className="absolute right-1 top-1 bottom-1 bg-brand-700 hover:bg-noodle hover:text-brand-900 text-stone-300 px-4 rounded-md font-bold transition-colors">
                            進入
                        </button>
                    </form>
                    {error && <p className="text-soup mt-3 text-sm animate-pulse font-medium">{error}</p>}
                </div>
            </div>

            <div className="text-center max-w-2xl mx-auto text-stone-600 text-sm font-serif leading-loose">
                <p>「你願意熱這碗麵，是我做這場實驗最真實的理由。</p>
                <p>這不是為了反抗，而是為了記得我們曾經相信——分享，還能帶來溫度。」</p>
                <p className="mt-4 text-stone-500">— Willwi</p>
            </div>
        </section>
    </div>
  );
};

// --- Main App Logic (Lyric Studio) ---

const LyricStudio = () => {
  const [lyrics, setLyrics] = useState<LyricLine[]>(SAMPLE_LYRICS);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [settings, setSettings] = useState<VisualSettings>(DEFAULT_SETTINGS);
  const [showEditor, setShowEditor] = useState(false);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // AI States
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTiming, setIsTiming] = useState(false);

  // Sync Mode State
  const [currentSyncIndex, setCurrentSyncIndex] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isPlaying && audioRef.current) {
      interval = window.setInterval(() => {
        setCurrentTime(audioRef.current!.currentTime);
      }, 16); // ~60fps update for UI
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateSettings({ backgroundImage: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSrtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const parsed = parseSRT(content);
        if (parsed.length > 0) {
            setLyrics(parsed);
        } else {
            alert('無法解析 SRT 檔案');
        }
      };
      reader.readAsText(file);
    }
  };

  const updateSettings = (newSettings: Partial<VisualSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleLyricsChange = (newLyrics: LyricLine[]) => {
    setLyrics(newLyrics);
  };

  const handleTextPaste = (text: string) => {
      // If user pastes raw text, try to distribute it evenly or parse it
      const duration = audioRef.current?.duration || 180;
      const parsed = detectAndParse(text, duration);
      setLyrics(parsed);
  };

  // AI Actions
  const handleAutoTheme = async () => {
    const fullText = lyrics.map(l => l.text).join('\n');
    setIsGeneratingTheme(true);
    const theme = await analyzeLyricsForTheme(fullText);
    if (theme) updateSettings(theme);
    setIsGeneratingTheme(false);
  };

  const handleTranslate = async () => {
      setIsTranslating(true);
      const translated = await translateLyricsAI(lyrics);
      setLyrics(translated);
      updateSettings({ showTranslation: true });
      setIsTranslating(false);
  };

  const handleSmartTiming = async () => {
      if (!audioRef.current) {
          alert("請先上傳音樂");
          return;
      }
      setIsTiming(true);
      const fullText = lyrics.map(l => l.text).join('\n');
      const timedLyrics = await smartTimingAI(fullText, audioRef.current.duration);
      if (timedLyrics.length > 0) setLyrics(timedLyrics);
      setIsTiming(false);
  };

  // Sync Mode Handlers
  const startSyncMode = () => {
    if (!audioSrc) {
        alert("請先上傳音樂");
        return;
    }
    setCurrentSyncIndex(0);
    setShowSyncOverlay(true);
    audioRef.current!.currentTime = 0;
    audioRef.current!.play();
    setIsPlaying(true);
  };

  const markCurrentLine = useCallback(() => {
    if (!audioRef.current) return;
    
    const now = audioRef.current.currentTime;
    
    setLyrics(prev => {
        const newLyrics = [...prev];
        // Set start time of current line
        if (currentSyncIndex < newLyrics.length) {
            newLyrics[currentSyncIndex].startTime = now;
            
            // Set end time of previous line to now
            if (currentSyncIndex > 0) {
                newLyrics[currentSyncIndex - 1].endTime = now;
            }
        }
        return newLyrics;
    });

    // Move to next
    if (currentSyncIndex < lyrics.length - 1) {
        setCurrentSyncIndex(prev => prev + 1);
    } else {
        // Finished
        // Set end time of last line to end of song or +5s
        setLyrics(prev => {
             const newLyrics = [...prev];
             newLyrics[newLyrics.length - 1].endTime = now + 5;
             return newLyrics;
        });
        setShowSyncOverlay(false);
    }
  }, [currentSyncIndex, lyrics.length]);

  // Keyboard listener for Sync Mode
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (showSyncOverlay && (e.code === 'Space' || e.key === 'Enter')) {
              e.preventDefault();
              markCurrentLine();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSyncOverlay, markCurrentLine]);


  return (
    <div className="flex h-screen bg-brand-900 text-stone-200 overflow-hidden font-sans">
      <audio 
        ref={audioRef} 
        src={audioSrc || undefined} 
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Left: Controls */}
      <Controls 
        settings={settings} 
        updateSettings={updateSettings} 
        onAutoTheme={handleAutoTheme}
        isGeneratingTheme={isGeneratingTheme}
        onOpenLyricEditor={() => setShowEditor(true)}
        onBgUpload={handleBgUpload}
        onSrtUpload={handleSrtUpload}
        onTranslate={handleTranslate}
        isTranslating={isTranslating}
        onSmartTiming={handleSmartTiming}
        isTiming={isTiming}
        onManualSync={startSyncMode}
      />

      {/* Right: Visualizer Workspace */}
      <div className="flex-1 flex flex-col relative bg-stone-950">
        {/* Top Bar */}
        <div className="h-16 bg-brand-900 border-b border-brand-800 flex items-center justify-between px-6 shadow-sm z-20">
            <h1 className="font-display font-black text-xl tracking-tighter text-white">
              <span className="text-noodle">WILLWI</span> <span className="text-stone-500 font-medium text-sm">泡麵聲學院</span>
            </h1>
            
            <div className="flex items-center gap-4">
               <label className="flex items-center gap-2 cursor-pointer bg-brand-800 hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors border border-brand-700">
                  <span className="text-sm font-bold text-stone-300">🎵 上傳音樂</span>
                  <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
               </label>
            </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 p-8 flex items-center justify-center relative overflow-hidden">
             {/* Background Grid Pattern */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(#44403c 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
             </div>

             <div className="w-full max-w-5xl aspect-video relative z-10">
                 {!audioSrc ? (
                     <div className="w-full h-full border-2 border-dashed border-brand-700 rounded-xl flex flex-col items-center justify-center text-stone-500 bg-brand-900/50 backdrop-blur-sm">
                         <div className="text-4xl mb-4">🎵</div>
                         <p className="font-bold">請先上傳音樂檔案開始創作</p>
                     </div>
                 ) : (
                     <Visualizer 
                        lyrics={lyrics} 
                        currentTime={currentTime} 
                        isPlaying={isPlaying}
                        audioRef={audioRef}
                        settings={settings}
                        onExportProgress={setIsExporting}
                     />
                 )}
             </div>

             {/* Playback Controls (Floating) */}
             {audioSrc && !isExporting && !showSyncOverlay && (
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-brand-800/90 backdrop-blur border border-brand-700 p-2 rounded-full shadow-2xl flex items-center gap-4 px-6 z-20">
                     <button 
                       onClick={() => {
                           if(audioRef.current) {
                               audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
                           }
                       }}
                       className="p-2 hover:text-noodle transition-colors"
                     >
                        ⏪
                     </button>

                     <button 
                       onClick={() => {
                           if (isPlaying) audioRef.current?.pause();
                           else audioRef.current?.play();
                       }}
                       className="w-12 h-12 bg-white rounded-full text-black flex items-center justify-center hover:scale-105 transition-transform font-black text-xl"
                     >
                        {isPlaying ? '⏸' : '▶'}
                     </button>

                     <button 
                       onClick={() => {
                           if(audioRef.current) {
                               audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5);
                           }
                       }}
                       className="p-2 hover:text-noodle transition-colors"
                     >
                        ⏩
                     </button>
                     
                     <div className="text-xs font-mono text-stone-400 w-24 text-center">
                         {audioRef.current && (
                             `${Math.floor(currentTime/60)}:${Math.floor(currentTime%60).toString().padStart(2,'0')} / ${Math.floor(audioRef.current.duration/60)}:${Math.floor(audioRef.current.duration%60).toString().padStart(2,'0')}`
                         )}
                     </div>
                 </div>
             )}
        </div>
      </div>

      {/* Sync Overlay */}
      {showSyncOverlay && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
              <div className="mb-12">
                  <div className="text-stone-400 text-sm mb-2 uppercase tracking-widest font-bold">即將播放 (Next)</div>
                  <div className="text-2xl text-stone-600 font-serif opacity-50 blur-[1px]">
                      {lyrics[currentSyncIndex + 1]?.text || "(結束)"}
                  </div>
              </div>
              
              <div className="mb-12 scale-110">
                  <div className="text-noodle text-sm mb-4 uppercase tracking-widest font-bold animate-pulse">現在 (Current)</div>
                  <div className="text-5xl md:text-7xl font-black text-white font-serif leading-tight">
                      {lyrics[currentSyncIndex]?.text}
                  </div>
              </div>

              <button 
                onClick={markCurrentLine}
                className="w-64 h-64 rounded-full bg-soup hover:bg-orange-500 active:scale-95 transition-all shadow-[0_0_50px_rgba(234,88,12,0.5)] flex items-center justify-center border-4 border-white/20 group"
              >
                  <span className="font-bold text-2xl text-white group-hover:scale-110 transition-transform block">
                      TAP / 空白鍵<br/>
                      <span className="text-sm font-normal opacity-80 mt-2 block">標記開始時間</span>
                  </span>
              </button>
              
              <button 
                onClick={() => setShowSyncOverlay(false)}
                className="mt-12 text-stone-500 hover:text-white underline text-sm"
              >
                  退出對時模式
              </button>
          </div>
      )}

      {/* Lyric Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-900 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col border border-brand-700">
            <div className="p-4 border-b border-brand-800 flex justify-between items-center">
              <h3 className="font-bold text-xl text-white">歌詞編輯器</h3>
              <div className="flex gap-2">
                 <button onClick={() => setShowEditor(false)} className="text-stone-400 hover:text-white px-3">關閉</button>
                 <button 
                   onClick={() => setShowEditor(false)} 
                   className="bg-noodle text-brand-900 px-4 py-1.5 rounded-lg font-bold hover:bg-yellow-400"
                 >
                   完成
                 </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-0">
               <div className="flex h-full">
                  {/* List View Editor */}
                  <div className="w-full p-6 space-y-4">
                      <div className="grid grid-cols-12 gap-4 mb-2 text-xs font-bold text-stone-500 uppercase px-2">
                          <div className="col-span-1">#</div>
                          <div className="col-span-2">開始 (秒)</div>
                          <div className="col-span-2">結束 (秒)</div>
                          <div className="col-span-3">原文</div>
                          <div className="col-span-3">翻譯</div>
                          <div className="col-span-1"></div>
                      </div>
                      
                      {lyrics.map((line, idx) => (
                          <div key={line.id} className="grid grid-cols-12 gap-4 items-center bg-brand-800/50 p-3 rounded-lg border border-brand-800 hover:border-brand-600 transition-colors group">
                              <div className="col-span-1 text-stone-500 font-mono text-sm">{idx + 1}</div>
                              <div className="col-span-2">
                                  <input 
                                    type="text" 
                                    defaultValue={line.startTime.toFixed(2)}
                                    onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if(!isNaN(val)) {
                                            const newL = [...lyrics];
                                            newL[idx].startTime = val;
                                            setLyrics(newL);
                                        }
                                    }}
                                    className="w-full bg-brand-900 border border-brand-700 rounded px-2 py-1 text-sm text-stone-300 focus:border-noodle outline-none text-center font-mono"
                                  />
                              </div>
                              <div className="col-span-2">
                                  <input 
                                    type="text" 
                                    defaultValue={line.endTime.toFixed(2)}
                                    onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if(!isNaN(val)) {
                                            const newL = [...lyrics];
                                            newL[idx].endTime = val;
                                            setLyrics(newL);
                                        }
                                    }}
                                    className="w-full bg-brand-900 border border-brand-700 rounded px-2 py-1 text-sm text-stone-300 focus:border-noodle outline-none text-center font-mono"
                                  />
                              </div>
                              <div className="col-span-3">
                                  <input 
                                    type="text" 
                                    value={line.text}
                                    onChange={(e) => {
                                        const newL = [...lyrics];
                                        newL[idx].text = e.target.value;
                                        setLyrics(newL);
                                    }}
                                    className="w-full bg-brand-900 border border-brand-700 rounded px-2 py-1 text-sm text-white focus:border-noodle outline-none"
                                  />
                              </div>
                              <div className="col-span-3">
                                  <input 
                                    type="text" 
                                    value={line.translation || ''}
                                    placeholder="翻譯..."
                                    onChange={(e) => {
                                        const newL = [...lyrics];
                                        newL[idx].translation = e.target.value;
                                        setLyrics(newL);
                                    }}
                                    className="w-full bg-brand-900 border border-brand-700 rounded px-2 py-1 text-sm text-stone-400 focus:border-noodle outline-none"
                                  />
                              </div>
                              <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                        const newL = lyrics.filter((_, i) => i !== idx);
                                        setLyrics(newL);
                                    }}
                                    className="text-red-500 hover:bg-red-900/50 p-1.5 rounded"
                                  >
                                      ✕
                                  </button>
                              </div>
                          </div>
                      ))}

                      <div className="pt-4 flex justify-center">
                          <button 
                             onClick={() => {
                                 const lastEnd = lyrics.length > 0 ? lyrics[lyrics.length-1].endTime : 0;
                                 const newId = Date.now().toString();
                                 setLyrics([...lyrics, { id: newId, startTime: lastEnd, endTime: lastEnd + 3, text: "New Line" }]);
                             }}
                             className="text-stone-400 hover:text-noodle text-sm font-bold flex items-center gap-2 px-4 py-2 border border-brand-700 rounded-lg hover:border-noodle transition-colors"
                          >
                              + 新增一行
                          </button>
                      </div>
                  </div>
               </div>
            </div>
            
            <div className="p-4 bg-brand-800 border-t border-brand-700 text-xs text-stone-500 flex justify-between">
                <span>提示：支援手動輸入或貼上純文字（會自動分配時間）</span>
                <span>共 {lyrics.length} 行</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <LandingPage onUnlock={() => setUnlocked(true)} />;
  }

  return <LyricStudio />;
};

export default App;
