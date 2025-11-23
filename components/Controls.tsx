
import React from 'react';
import { VisualSettings, ThemeStyle, AnimationType } from '../types';

interface ControlsProps {
  settings: VisualSettings;
  updateSettings: (newSettings: Partial<VisualSettings>) => void;
  onAutoTheme: () => void;
  isGeneratingTheme: boolean;
  onOpenLyricEditor: () => void;
  onBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTranslate: () => void;
  isTranslating: boolean;
  onSmartTiming: () => void;
  isTiming: boolean;
  onManualSync: () => void;
}

const FONTS = [
  { name: 'Montserrat', label: 'Montserrat (現代)' },
  { name: 'Inter', label: 'Inter (簡約)' },
  { name: 'Times New Roman', label: 'Serif (經典)' },
  { name: 'Courier New', label: 'Mono (代碼)' },
];

const ANIMATION_LABELS: Record<AnimationType, string> = {
  [AnimationType.FADE]: '淡入 (Fade)',
  [AnimationType.SLIDE_UP]: '上滑 (Slide Up)',
  [AnimationType.ZOOM]: '縮放 (Zoom)',
  [AnimationType.BOUNCE]: '彈跳 (Bounce)',
};

const THEME_LABELS: Record<ThemeStyle, string> = {
  [ThemeStyle.NEON]: '霓虹 (Neon)',
  [ThemeStyle.MINIMAL]: '極簡 (Minimal)',
  [ThemeStyle.NATURE]: '自然 (Nature)',
  [ThemeStyle.FIERY]: '熾熱 (Fiery)',
};

const Controls: React.FC<ControlsProps> = ({ 
  settings, 
  updateSettings, 
  onAutoTheme, 
  isGeneratingTheme, 
  onOpenLyricEditor,
  onBgUpload,
  onTranslate,
  isTranslating,
  onSmartTiming,
  isTiming,
  onManualSync
}) => {
  return (
    <div className="bg-brand-900 border-l border-brand-800 p-6 h-full overflow-y-auto w-full md:w-80 flex-shrink-0">
      <h2 className="text-xl font-display font-bold text-white mb-6">工作室控制</h2>

      <div className="space-y-6">
        
        {/* Lyrics & Content */}
        <div className="pb-4 border-b border-brand-800">
           <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">內容管理</label>
           <button 
             onClick={onOpenLyricEditor}
             className="w-full mb-3 py-2 border border-brand-500 text-brand-400 hover:bg-brand-800 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
             編輯/輸入歌詞
           </button>

           <div className="space-y-2">
             <div className="text-xs text-gray-500">背景圖片</div>
             <div className="flex items-center gap-2">
               <label className="flex-1 cursor-pointer py-2 px-3 bg-brand-800 hover:bg-brand-700 rounded-md text-xs text-center text-gray-300 border border-gray-700 transition-colors truncate">
                 {settings.backgroundImage ? '更換圖片' : '選擇背景圖片'}
                 <input type="file" accept="image/*" onChange={onBgUpload} className="hidden" />
               </label>
               {settings.backgroundImage && (
                 <button 
                   onClick={() => updateSettings({ backgroundImage: undefined })}
                   className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-md"
                   title="移除背景"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
               )}
             </div>
           </div>
        </div>

        {/* AI Tools */}
        <div className="p-4 bg-brand-800 rounded-lg border border-brand-500/30">
          <h3 className="text-sm font-semibold text-brand-400 mb-2 flex items-center gap-2">
            ✨ AI 工具箱 & 時間
          </h3>
          <div className="space-y-2">
            <button 
              onClick={onManualSync}
              className="w-full py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-md text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              手動節奏對時 (Tap to Sync)
            </button>

            <div className="h-px bg-brand-600/30 my-2"></div>

            <button 
              onClick={onAutoTheme}
              disabled={isGeneratingTheme}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors"
            >
              {isGeneratingTheme ? '分析中...' : '自動生成主題'}
            </button>

            <button 
              onClick={onSmartTiming}
              disabled={isTiming}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors"
            >
              {isTiming ? '分配中...' : 'AI 智能對時 (分配時間)'}
            </button>
            
            <button 
              onClick={onTranslate}
              disabled={isTranslating}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors"
            >
              {isTranslating ? '翻譯中...' : 'AI 翻譯歌詞 (繁中)'}
            </button>
          </div>
        </div>

        {/* Translation Settings */}
        <div>
           <div className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                id="showTranslation"
                checked={settings.showTranslation}
                onChange={(e) => updateSettings({ showTranslation: e.target.checked })}
                className="rounded text-brand-500 focus:ring-brand-500 bg-brand-800 border-gray-700"
              />
              <label htmlFor="showTranslation" className="text-xs font-bold text-gray-400 uppercase tracking-wider select-none cursor-pointer">顯示翻譯字幕</label>
           </div>
        </div>

        {/* Animation Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">文字動畫</label>
          <div className="space-y-3">
             <select
               value={settings.animationType}
               onChange={(e) => updateSettings({ animationType: e.target.value as AnimationType })}
               className="w-full bg-brand-800 text-white text-sm rounded-md border border-gray-700 p-2 focus:ring-1 focus:ring-brand-500 outline-none"
             >
               {Object.values(AnimationType).map(type => (
                 <option key={type} value={type}>{ANIMATION_LABELS[type]}</option>
               ))}
             </select>
             
             <div>
                <span className="text-xs text-gray-500 block mb-1">動畫速度 ({settings.animationSpeed}x)</span>
                <input 
                  type="range" 
                  min="0.1" 
                  max="3.0" 
                  step="0.1"
                  value={settings.animationSpeed}
                  onChange={(e) => updateSettings({ animationSpeed: Number(e.target.value) })}
                  className="w-full accent-brand-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>

             <div>
                <span className="text-xs text-gray-500 block mb-1">過場時間 ({settings.transitionDuration}s)</span>
                <input 
                  type="range" 
                  min="0.1" 
                  max="2.0" 
                  step="0.1"
                  value={settings.transitionDuration}
                  onChange={(e) => updateSettings({ transitionDuration: Number(e.target.value) })}
                  className="w-full accent-brand-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>
          </div>
        </div>

        {/* Style Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">視覺風格</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(ThemeStyle).map((style) => (
              <button
                key={style}
                onClick={() => updateSettings({ style })}
                className={`py-2 px-2 text-xs rounded border transition-all truncate ${
                  settings.style === style 
                    ? 'bg-brand-500 border-brand-500 text-white' 
                    : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {THEME_LABELS[style]}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">配色</label>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">主色</span>
              <input 
                type="color" 
                value={settings.primaryColor}
                onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">次色</span>
              <input 
                type="color" 
                value={settings.secondaryColor}
                onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">背景色</span>
              <input 
                type="color" 
                value={settings.backgroundColor}
                onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
              />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">字體排版</label>
          <div className="space-y-3">
             <select
               value={settings.fontFamily}
               onChange={(e) => updateSettings({ fontFamily: e.target.value })}
               className="w-full bg-brand-800 text-white text-sm rounded-md border border-gray-700 p-2 focus:ring-1 focus:ring-brand-500 outline-none"
             >
               {FONTS.map(font => (
                 <option key={font.name} value={font.name}>{font.label}</option>
               ))}
             </select>

             <div>
                <span className="text-xs text-gray-500 block mb-1">字體大小 ({settings.fontSize}px)</span>
                <input 
                  type="range" 
                  min="20" 
                  max="120" 
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                  className="w-full accent-brand-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>
          </div>
        </div>

        {/* Particles / Beat */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">特效</label>
          <div className="space-y-4">
             <div>
                <span className="text-xs text-gray-500 block mb-1">粒子數量</span>
                <input 
                  type="range" 
                  min="0" 
                  max="200" 
                  value={settings.particleCount}
                  onChange={(e) => updateSettings({ particleCount: Number(e.target.value) })}
                  className="w-full accent-neon-pink h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>
             <div>
                <span className="text-xs text-gray-500 block mb-1">節奏靈敏度</span>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1"
                  value={settings.beatSensitivity}
                  onChange={(e) => updateSettings({ beatSensitivity: Number(e.target.value) })}
                  className="w-full accent-neon-cyan h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Controls;
