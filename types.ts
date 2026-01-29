
export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  DASHBOARD = 'DASHBOARD',
  BUILDING = 'BUILDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface FileData {
  name: string;
  path: string;
  content: string | ArrayBuffer;
  isDir: boolean;
}

export interface ProjectAnalysis {
  projectName: string;
  version: string;
  dependencies: string[];
  suggestedPackageName: string;
  compatibilityScore: number;
  mobileAdjustments: string[];
  androidManifest: string;
}

export interface BuildLog {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}
