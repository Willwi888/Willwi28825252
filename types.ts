
export interface LyricLine {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  translation?: string;
}

export enum ThemeStyle {
  NEON = 'NEON',
  MINIMAL = 'MINIMAL',
  NATURE = 'NATURE',
  FIERY = 'FIERY'
}

export enum AnimationType {
  FADE = 'FADE',
  SLIDE_UP = 'SLIDE_UP',
  ZOOM = 'ZOOM',
  BOUNCE = 'BOUNCE'
}

export interface VisualSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
  particleCount: number;
  beatSensitivity: number; // 0.0 to 2.0
  style: ThemeStyle;
  backgroundImage?: string;
  animationType: AnimationType;
  animationSpeed: number; // 0.5 to 2.0
  transitionDuration: number; // 0.1 to 1.0 seconds
  showTranslation: boolean;
  driveFolderUrl?: string;
}

export interface SongMetadata {
  title: string;
  artist: string;
  duration: number;
}