
import React, { useState, useRef, useEffect } from 'react';
import { LyricLine, VisualSettings, ThemeStyle, AnimationType } from './types';
import { parseSRT, detectAndParse, lyricsToString } from './utils/srtParser';
import { analyzeLyricsForTheme, translateLyricsAI, smartTimingAI } from './services/geminiService';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';

const DEFAULT_SETTINGS: VisualSettings = {
  primaryColor: '#6366f1',
  secondaryColor: '#c084fc',
  backgroundColor: '#0f172a',
  fontFamily: 'Montserrat',
  fontSize: 60,
  particleCount: 50,
  beatSensitivity: 1.0,
  style: ThemeStyle.NEON,
  animationType: AnimationType.SLIDE_UP,
  animationSpeed: 1.0,
  transitionDuration: 0.6,
  showTranslation: false
};

const SAMPLE_LYRICS: LyricLine[] = [
  { id: '1', startTime: 0, endTime: 4, text: "歡迎來到 Willwi.com", translation: "Welcome to Willwi.com" },
  { id: '2', startTime: 4.1, endTime: 8, text: "放下你的節奏，載入你的文字", translation: "Drop your beat, load your text" },
  { id: '3', startTime: 8.1, endTime: 12, text: "觀看魔法展現", translation: "Watch the magic unfold" },
];

export default function App() {
  const [lyrics, setLyrics] = useState<LyricLine[]>(SAMPLE_LYRICS);
  const [settings, setSettings] = useState<VisualSettings>(DEFAULT_SETTINGS);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  
  // AI States
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTiming, setIsTiming] = useState(false);
  
  // Lyric Editor State
  const [isLyricEditorOpen, setIsLyricEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'text' | 'list'>('list'); // 'text' for bulk, 'list' for precision
  const [editorContent, setEditorContent] = useState('');
  const [editingLyrics, setEditingLyrics] = useState<LyricLine[]>([]);

  // Manual Sync State
  const [isSyncMode, setIsSyncMode] = useState(false);
  const [syncIndex, setSyncIndex] = useState(0);
  const [tempSyncLyrics, setTempSyncLyrics] = useState<LyricLine[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Event Listeners
  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onPlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      setIsPlaying(false);
      // Reset time
      if(audioRef.current) audioRef.current.currentTime = 0;
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSettings(prev => ({ ...prev, backgroundImage: url }));
    }
  };

  const handleOpenLyricEditor = () => {
    // Initialize editor state
    setEditorContent(lyricsToString(lyrics));
    setEditingLyrics(JSON.parse(JSON.stringify(lyrics))); // Deep copy
    setIsLyricEditorOpen(true);
  };

  const handleSaveLyrics = () => {
    if (editorMode === 'text') {
        const newLyrics = detectAndParse(editorContent, duration || 180);
        setLyrics(newLyrics);
    } else {
        // List mode
        setLyrics(editingLyrics.sort((a,b) => a.startTime - b.startTime));
    }
    setIsLyricEditorOpen(false);
  };

  const handleListChange = (id: string, field: keyof LyricLine, value: any) => {
    setEditingLyrics(prev => prev.map(line => 
        line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const handleAutoTheme = async () => {
    if (lyrics.length === 0) return;
    setIsGeneratingTheme(true);
    
    // Combine first 20 lines to analyze
    const textSample = lyrics.slice(0, 20).map(l => l.text).join('\n');
    const newSettings = await analyzeLyricsForTheme(textSample);
    
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    setIsGeneratingTheme(false);
  };

  const handleTranslate = async () => {
    if (lyrics.length === 0) return;
    setIsTranslating(true);
    const translatedLyrics = await translateLyricsAI(lyrics, "Traditional Chinese");
    setLyrics(translatedLyrics);
    setSettings(prev => ({ ...prev, showTranslation: true }));
    setIsTranslating(false);
  }

  const handleSmartTiming = async () => {
     if (lyrics.length === 0) return;
     if (!duration || duration === 0) {
        alert("請先上傳音訊以獲取正確時間長度。");
        return;
     }

     setIsTiming(true);
     const fullText = lyrics.map(l => l.text).join('\n');
     
     // Ask AI to redistribute
     const timedLyrics = await smartTimingAI(fullText, duration);
     if (timedLyrics.length > 0) {
         setLyrics(timedLyrics);
     } else {
         alert("AI 對時失敗，請重試或檢查網路。");
     }
     setIsTiming(false);
  }

  // --- MANUAL SYNC LOGIC ---

  const handleStartManualSync = () => {
    if (!audioSrc) {
      alert("請先上傳音訊才能使用對時功能");
      return;
    }
    setIsSyncMode(true);
    setSyncIndex(0);
    // Create a copy of lyrics but preserve IDs and text, timestamps will be overwritten
    setTempSyncLyrics(JSON.parse(JSON.stringify(lyrics)));
    
    // Reset audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleSyncTap = () => {
    if (!isSyncMode || !audioRef.current || syncIndex >= tempSyncLyrics.length) return;

    const now = audioRef.current.currentTime;
    
    setTempSyncLyrics(prev => {
      const next = [...prev];
      
      // Set start time for current line
      next[syncIndex].startTime = now;
      
      // Set end time for previous line
      if (syncIndex > 0) {
        next[syncIndex - 1].endTime = now;
      }
      
      // Estimate end time for current line (will be corrected by next tap)
      // Default to 3 seconds or end of song for now
      next[syncIndex].endTime = Math.min(duration, now + 3);

      return next;
    });

    setSyncIndex(prev => prev + 1);
  };

  const handleSaveSync = () => {
    setLyrics(tempSyncLyrics);
    setIsSyncMode(false);
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleCancelSync = () => {
    setIsSyncMode(false);
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  };

  // Keyboard listener for Sync
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSyncMode) return;
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        if (!isPlaying) {
             onPlayPause(); // Start playing if paused
        } else {
             handleSyncTap(); // Tap logic
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSyncMode, isPlaying, syncIndex, tempSyncLyrics]);

  return (
    <div className="flex flex-col h-screen w-full bg-brand-900 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-brand-800 flex items-center justify-between px-6 bg-brand-900/50 backdrop-blur z-10">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-500 to-neon-purple flex items-center justify-center font-bold text-white">
             W
           </div>
           <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
             Willwi.com
           </h1>
        </div>
        <div className="flex items-center gap-4">
           <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">文件</a>
           <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">關於</a>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Visualization Area */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-800 via-brand-900 to-black">
          
          <div className="w-full max-w-5xl aspect-video mb-6 relative z-10 group">
             {/* Main Visualizer or Sync Overlay */}
             
             {!isSyncMode ? (
               <Visualizer 
                 lyrics={lyrics}
                 currentTime={currentTime}
                 isPlaying={isPlaying}
                 audioRef={audioRef}
                 settings={settings}
                 onExportProgress={() => {}}
               />
             ) : (
                // SYNC MODE OVERLAY
                <div className="w-full h-full bg-black rounded-xl border-2 border-brand-500 relative flex flex-col items-center justify-center overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-brand-900">
                      <div 
                        className="h-full bg-brand-500 transition-all duration-300" 
                        style={{ width: `${(syncIndex / tempSyncLyrics.length) * 100}%` }}
                      />
                   </div>
                   
                   <div className="text-center p-8 space-y-8 z-10">
                      <div className="space-y-2">
                        <p className="text-brand-400 text-sm font-bold uppercase tracking-widest">
                            同步中... {syncIndex + 1} / {tempSyncLyrics.length}
                        </p>
                        <p className="text-gray-500 text-xs">
                            按下空白鍵 (SPACE) 標記這行歌詞的開始
                        </p>
                      </div>

                      {/* Current Line */}
                      <div className="min-h-[120px] flex items-center justify-center">
                        {syncIndex < tempSyncLyrics.length ? (
                            <h2 className="text-4xl md:text-5xl font-bold text-white animate-pulse">
                                {tempSyncLyrics[syncIndex].text}
                            </h2>
                        ) : (
                            <h2 className="text-3xl text-green-400 font-bold">同步完成！</h2>
                        )}
                      </div>

                      {/* Next Line Preview */}
                      <div className="min-h-[60px] flex items-center justify-center opacity-50">
                        {syncIndex + 1 < tempSyncLyrics.length && (
                            <p className="text-xl text-gray-300 font-medium">
                                下一句: {tempSyncLyrics[syncIndex + 1].text}
                            </p>
                        )}
                      </div>
                      
                      {syncIndex < tempSyncLyrics.length && (
                          <button 
                             onClick={handleSyncTap}
                             className="px-10 py-6 bg-brand-600 hover:bg-brand-500 rounded-full text-xl font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] active:scale-95 transition-all mt-8"
                          >
                             TAP / 空白鍵
                          </button>
                      )}
                   </div>
                   
                   {/* Background dim visualizer potentially, but plain black is better for focus */}
                   <div className="absolute inset-0 bg-gradient-to-t from-brand-900/50 to-transparent pointer-events-none" />
                </div>
             )}
          </div>

          {/* Player Controls or Sync Controls */}
          <div className="w-full max-w-5xl bg-brand-800/80 backdrop-blur rounded-xl p-4 border border-white/10 flex items-center gap-4 z-10">
             
             {!isSyncMode ? (
               <>
                 <button 
                   onClick={onPlayPause}
                   className="w-12 h-12 rounded-full bg-white text-brand-900 flex items-center justify-center hover:scale-105 transition-transform"
                 >
                    {isPlaying ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                    ) : (
                      <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                 </button>
                 
                 <div className="flex-1">
                    <input 
                      type="range" 
                      min="0" 
                      max={duration || 100} 
                      value={currentTime}
                      onChange={(e) => {
                        if(audioRef.current) audioRef.current.currentTime = Number(e.target.value);
                      }}
                      className="w-full accent-brand-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                       <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                       <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                 </div>

                 <div className="flex gap-2">
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     accept="audio/*" 
                     className="hidden" 
                     onChange={handleAudioUpload}
                   />
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="px-3 py-2 text-xs font-medium bg-gray-700 hover:bg-gray-600 rounded text-white whitespace-nowrap"
                   >
                     上傳音訊
                   </button>
                 </div>
               </>
             ) : (
                // SYNC CONTROLS
                <div className="w-full flex justify-between items-center">
                   <div className="text-white font-bold text-sm">對時模式</div>
                   <div className="flex gap-4">
                      <button 
                         onClick={onPlayPause}
                         className="px-4 py-2 bg-white text-brand-900 rounded font-bold hover:bg-gray-200"
                      >
                         {isPlaying ? '暫停' : '播放 (開始)'}
                      </button>
                      <button 
                         onClick={handleCancelSync}
                         className="px-4 py-2 bg-gray-700 text-gray-300 rounded font-medium hover:bg-gray-600"
                      >
                         取消
                      </button>
                      <button 
                         onClick={handleSaveSync}
                         className="px-4 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600"
                      >
                         完成並儲存
                      </button>
                   </div>
                </div>
             )}
          </div>

          <audio 
            ref={audioRef}
            src={audioSrc || undefined}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

        </div>

        {/* Right: Controls Sidebar */}
        <Controls 
          settings={settings} 
          updateSettings={(newS) => setSettings(prev => ({...prev, ...newS}))} 
          onAutoTheme={handleAutoTheme}
          isGeneratingTheme={isGeneratingTheme}
          onOpenLyricEditor={handleOpenLyricEditor}
          onBgUpload={handleBgUpload}
          onTranslate={handleTranslate}
          isTranslating={isTranslating}
          onSmartTiming={handleSmartTiming}
          isTiming={isTiming}
          onManualSync={handleStartManualSync}
        />
        
      </div>

      {/* Improved Lyric Editor Modal */}
      {isLyricEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-brand-900 border border-brand-700 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-brand-800 flex justify-between items-center bg-brand-900 shrink-0">
              <div className="flex gap-4 items-center">
                  <h3 className="text-lg font-bold text-white">歌詞編輯器</h3>
                  <div className="flex bg-brand-800 rounded p-1">
                      <button 
                        onClick={() => setEditorMode('list')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${editorMode === 'list' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                          逐行編輯 (翻譯/時間)
                      </button>
                      <button 
                        onClick={() => setEditorMode('text')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${editorMode === 'text' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                          純文字/SRT 貼上
                      </button>
                  </div>
              </div>
              <button onClick={() => setIsLyricEditorOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Editor Body */}
            <div className="flex-1 overflow-y-auto bg-brand-950 p-4">
              
              {editorMode === 'text' ? (
                <div className="h-full flex flex-col">
                     <p className="text-sm text-gray-400 mb-2">
                        在此貼上 SRT 格式內容，或直接輸入純文字歌詞（AI 智能對時將重新分配時間）。
                    </p>
                    <textarea 
                        className="flex-1 w-full bg-brand-900 border border-brand-800 rounded-md p-4 text-sm text-gray-200 font-mono focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        placeholder="在此輸入歌詞..."
                        spellCheck={false}
                    />
                </div>
              ) : (
                <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase px-2 mb-2">
                        <div className="col-span-1">#</div>
                        <div className="col-span-2">開始 (秒)</div>
                        <div className="col-span-2">結束 (秒)</div>
                        <div className="col-span-3">原文歌詞</div>
                        <div className="col-span-4">翻譯字幕 (可編輯)</div>
                    </div>
                    {editingLyrics.map((line, idx) => (
                        <div key={line.id} className="grid grid-cols-12 gap-2 items-start bg-brand-900/50 p-2 rounded hover:bg-brand-900 transition-colors border border-brand-800/50">
                            <div className="col-span-1 text-gray-500 text-xs mt-2">{idx + 1}</div>
                            
                            <div className="col-span-2">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    className="w-full bg-brand-800 border border-brand-700 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-brand-500 outline-none"
                                    value={line.startTime}
                                    onChange={(e) => handleListChange(line.id, 'startTime', Number(e.target.value))}
                                />
                            </div>
                            
                            <div className="col-span-2">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    className="w-full bg-brand-800 border border-brand-700 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-brand-500 outline-none"
                                    value={line.endTime}
                                    onChange={(e) => handleListChange(line.id, 'endTime', Number(e.target.value))}
                                />
                            </div>
                            
                            <div className="col-span-3">
                                <textarea 
                                    rows={1}
                                    className="w-full bg-brand-800 border border-brand-700 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-brand-500 outline-none resize-y min-h-[30px]"
                                    value={line.text}
                                    onChange={(e) => handleListChange(line.id, 'text', e.target.value)}
                                />
                            </div>
                            
                            <div className="col-span-4">
                                <textarea 
                                    rows={1}
                                    className="w-full bg-brand-800 border border-brand-700 rounded px-2 py-1 text-sm text-brand-200 focus:ring-1 focus:ring-brand-500 outline-none resize-y min-h-[30px]"
                                    placeholder="輸入翻譯..."
                                    value={line.translation || ''}
                                    onChange={(e) => handleListChange(line.id, 'translation', e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                    
                    {editingLyrics.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            目前沒有歌詞，請切換至「純文字貼上」模式輸入。
                        </div>
                    )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-brand-800 flex justify-end gap-3 shrink-0 bg-brand-900">
              <button 
                onClick={() => setIsLyricEditorOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-brand-800 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveLyrics}
                className="px-4 py-2 rounded-md text-sm font-bold bg-brand-500 text-white hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20"
              >
                儲存並更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
