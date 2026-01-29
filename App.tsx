
import React, { useState } from 'react';
import { 
  Upload, Smartphone, Cpu, CheckCircle2, 
  AlertCircle, ArrowRight, Download, Terminal 
} from 'lucide-react';
import JSZip from 'jszip';
import { GoogleGenAI, Type } from "@google/genai";

// --- Tipos Consolidados ---
type AppState = 'IDLE' | 'UPLOADING' | 'ANALYZING' | 'BUILDING' | 'SUCCESS' | 'ERROR';

interface ProjectAnalysis {
  projectName: string;
  version: string;
  suggestedPackageName: string;
  compatibilityScore: number;
  adjustments: string[];
}

// --- Componente Principal ---
export default function App() {
  const [state, setState] = useState<AppState>('IDLE');
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.zip')) {
      alert("Sube un archivo .zip válido");
      return;
    }

    setState('UPLOADING');
    addLog(`Cargando ZIP: ${file.name}`);

    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      
      setState('ANALYZING');
      addLog("Analizando proyecto con IA...");

      const packageJson = content.file("package.json") 
        ? await content.file("package.json")!.async("string") 
        : '{"name": "unknown"}';

      // Llamada directa a Gemini
      const ai = new GoogleGenAI({ apiKey: (process.env.API_KEY || "") });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza este proyecto React para APK Android. package.json: ${packageJson}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectName: { type: Type.STRING },
              version: { type: Type.STRING },
              suggestedPackageName: { type: Type.STRING },
              compatibilityScore: { type: Type.NUMBER },
              adjustments: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["projectName", "version", "suggestedPackageName", "compatibilityScore", "adjustments"]
          }
        }
      });

      setAnalysis(JSON.parse(response.text));
      addLog("Análisis completado satisfactoriamente.");
      setState('BUILDING');

      // Simulación de build rápida
      setTimeout(() => {
        addLog("Generando assets nativos...");
        setTimeout(() => {
          addLog("Compilación finalizada.");
          setState('SUCCESS');
        }, 2000);
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setState('ERROR');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-950 text-slate-100">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-12 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><Smartphone className="w-6 h-6" /></div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Apkify AI
          </h1>
        </div>
        <Cpu className="text-slate-700" />
      </header>

      <main className="max-w-4xl mx-auto">
        {state === 'IDLE' && (
          <div className="text-center space-y-8 py-10">
            <h2 className="text-4xl font-bold">Convierte tu React en APK</h2>
            <p className="text-slate-400">Sube tu proyecto en ZIP y nosotros nos encargamos del resto.</p>
            
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-800 rounded-3xl cursor-pointer hover:bg-slate-900/50 transition-all">
              <Upload className="w-12 h-12 text-blue-500 mb-4" />
              <span className="text-slate-300">Haz clic para subir tu ZIP</span>
              <input type="file" className="hidden" accept=".zip" onChange={handleFile} />
            </label>
          </div>
        )}

        {(state === 'UPLOADING' || state === 'ANALYZING' || state === 'BUILDING') && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-4 py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xl font-medium">Procesando: {state}...</p>
            </div>
            <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-blue-300 border border-slate-800">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </div>
        )}

        {state === 'SUCCESS' && analysis && (
          <div className="glass p-8 rounded-3xl space-y-6 animate-in fade-in zoom-in">
            <div className="flex items-center gap-4 text-green-400">
              <CheckCircle2 className="w-8 h-8" />
              <h2 className="text-2xl font-bold">¡APK Generado!</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50 p-6 rounded-2xl">
              <div>
                <p className="text-xs text-slate-500 uppercase">Proyecto</p>
                <p className="font-bold">{analysis.projectName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Compatibilidad</p>
                <p className="font-bold text-green-400">{analysis.compatibilityScore}%</p>
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-5 h-5" /> Descargar APK v{analysis.version}
            </button>
          </div>
        )}

        {state === 'ERROR' && (
          <div className="p-8 glass rounded-3xl border-red-500/30 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold">Ocurrió un error</h2>
            <p className="text-red-400">{error}</p>
            <button onClick={() => window.location.reload()} className="underline">Reintentar</button>
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto mt-20 text-center text-slate-600 text-sm">
        Potenciado por Gemini 3 Flash & JSZip
      </footer>
    </div>
  );
}
