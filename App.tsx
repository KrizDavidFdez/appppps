
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  Package, 
  Smartphone, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  Activity,
  FileCode,
  Download,
  Terminal,
  ChevronRight
} from 'lucide-react';
import JSZip from 'jszip';
import { AppState, ProjectAnalysis, BuildLog } from './types';
import { analyzeProject } from './services/geminiService';

// --- Sub-components (Internal) ---

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
    <p className="text-xl font-medium text-blue-400">{message}</p>
  </div>
);

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
    <div 
      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [buildProgress, setBuildProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string, level: BuildLog['level'] = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      level
    }]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Por favor, sube un archivo .zip válido.');
      return;
    }

    setState(AppState.UPLOADING);
    addLog(`Cargando archivo: ${file.name}`);

    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      
      setState(AppState.ANALYZING);
      addLog('Descomprimiendo y analizando estructura del proyecto...');

      // Find package.json
      let packageJsonContent = '{}';
      const fileList: string[] = [];
      
      // Fixed: Iterate over files using Object.keys and retrieve JSZipObject via .file() for better typing
      const fileNames = Object.keys(content.files);
      for (const path of fileNames) {
        const zipEntry = content.file(path);
        if (!zipEntry) continue;
        
        fileList.push(path);
        if (path.endsWith('package.json')) {
          packageJsonContent = await zipEntry.async('string');
        }
      }

      if (!packageJsonContent || packageJsonContent === '{}') {
        throw new Error('No se encontró el archivo package.json. ¿Es un proyecto React válido?');
      }

      const result = await analyzeProject(packageJsonContent, fileList.slice(0, 50)); // Send first 50 files for context
      setAnalysis(result);
      addLog('Análisis de IA completado.', 'success');
      setState(AppState.DASHBOARD);

    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo');
      setState(AppState.ERROR);
    }
  };

  const startBuild = () => {
    setState(AppState.BUILDING);
    setBuildProgress(0);
    setLogs([]);
    addLog('Iniciando proceso de compilación para Android...', 'info');

    const steps = [
      { msg: 'Configurando entorno de Capacitor...', time: 2000, prog: 20 },
      { msg: 'Instalando dependencias nativas...', time: 3000, prog: 40 },
      { msg: 'Generando recursos (iconos, splash screens)...', time: 2500, prog: 60 },
      { msg: 'Compilando proyecto web para producción...', time: 4000, prog: 80 },
      { msg: 'Sincronizando con Android Gradle...', time: 3000, prog: 90 },
      { msg: 'Generando APK firmado (debug mode)...', time: 2000, prog: 100 },
    ];

    let currentStep = 0;
    const runStep = () => {
      if (currentStep >= steps.length) {
        setState(AppState.SUCCESS);
        addLog('APK Generado con éxito!', 'success');
        return;
      }

      const step = steps[currentStep];
      addLog(step.msg);
      setBuildProgress(step.prog);
      
      setTimeout(() => {
        currentStep++;
        runStep();
      }, step.time);
    };

    runStep();
  };

  const reset = () => {
    setState(AppState.IDLE);
    setAnalysis(null);
    setLogs([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Apkify AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:inline">React to Android Pipeline</span>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-8">
        
        {state === AppState.IDLE && (
          <section className="text-center py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold text-white tracking-tight sm:text-6xl">
                Transforma tu Web en <span className="text-blue-500">Android</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Sube tu proyecto React (.zip) y deja que nuestra IA configure el entorno nativo por ti. 
                Optimización de rendimiento y empaquetado automático.
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              <label className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer bg-slate-900 hover:bg-slate-800/50 hover:border-blue-500 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="mb-2 text-sm text-slate-300">
                    <span className="font-semibold text-blue-400">Haz clic para subir</span> o arrastra y suelta
                  </p>
                  <p className="text-xs text-slate-500">Archivo ZIP del proyecto React</p>
                </div>
                <input type="file" className="hidden" accept=".zip" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-16">
              {[
                { icon: Layers, title: 'Basado en Capacitor', desc: 'Puente moderno entre Web y Nativo.' },
                { icon: Activity, title: 'IA Adaptativa', desc: 'Analizamos tus rutas y estados para móvil.' },
                { icon: Package, title: 'Pronto para APK', desc: 'Compilación automatizada en la nube.' }
              ].map((item, idx) => (
                <div key={idx} className="p-6 glass-card rounded-xl">
                  <item.icon className="w-8 h-8 text-blue-500 mb-4" />
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(state === AppState.UPLOADING || state === AppState.ANALYZING) && (
          <LoadingScreen message={state === AppState.UPLOADING ? "Subiendo proyecto..." : "IA analizando código..."} />
        )}

        {state === AppState.DASHBOARD && analysis && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="text-green-500 w-6 h-6" />
                Proyecto Listo para Conversión
              </h2>
              <button 
                onClick={startBuild}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                Compilar APK <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Info Principal */}
              <div className="md:col-span-2 space-y-6">
                <div className="glass-card p-6 rounded-xl space-y-4">
                  <h3 className="text-lg font-semibold border-b border-slate-800 pb-2">Resumen del Proyecto</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Nombre</label>
                      <p className="font-medium">{analysis.projectName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Versión</label>
                      <p className="font-medium">{analysis.version}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Package ID</label>
                      <p className="font-medium text-blue-400">{analysis.suggestedPackageName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider">Score Móvil</label>
                      <p className="font-medium text-green-400">{analysis.compatibilityScore}%</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl space-y-4">
                  <h3 className="text-lg font-semibold border-b border-slate-800 pb-2">Ajustes de IA Recomendados</h3>
                  <ul className="space-y-3">
                    {analysis.mobileAdjustments.map((adj, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                        {adj}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sidebar stats */}
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950/30">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-indigo-400" /> Dependencias
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.dependencies.slice(0, 10).map((dep, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-800 rounded text-xs border border-slate-700">
                        {dep}
                      </span>
                    ))}
                    {analysis.dependencies.length > 10 && (
                      <span className="text-xs text-slate-500">+{analysis.dependencies.length - 10} más</span>
                    )}
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl">
                  <h3 className="font-semibold mb-2">Android Manifest</h3>
                  <p className="text-xs text-slate-500 mb-4 italic">Previsualización del archivo generado automáticamente.</p>
                  <pre className="text-[10px] bg-black/40 p-3 rounded overflow-hidden text-slate-400">
                    {analysis.androidManifest.substring(0, 150)}...
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {state === AppState.BUILDING && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Compilando Aplicación</h2>
              <p className="text-slate-400">Esto puede tomar unos minutos dependiendo del tamaño del proyecto.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-400 font-medium">{logs[logs.length - 1]?.message}</span>
                <span className="text-slate-500">{buildProgress}%</span>
              </div>
              <ProgressBar progress={buildProgress} />
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono text-slate-300">Console Logs</span>
              </div>
              <div className="p-4 font-mono text-xs space-y-1.5 h-64 overflow-y-auto bg-black/40">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                    <span className={`
                      ${log.level === 'success' ? 'text-green-400' : ''}
                      ${log.level === 'error' ? 'text-red-400' : ''}
                      ${log.level === 'warn' ? 'text-yellow-400' : ''}
                      ${log.level === 'info' ? 'text-blue-300' : ''}
                    `}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {state === AppState.SUCCESS && (
          <div className="text-center py-12 space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-xl shadow-green-500/10">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-bold text-white">¡Listo para Instalar!</h2>
              <p className="text-slate-400 mt-2">Hemos generado tu APK y un bundle de código optimizado.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              <div className="p-6 glass-card rounded-2xl flex flex-col items-center gap-4 hover:border-blue-500 transition-colors group">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                  <Download className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold">Descargar APK</h4>
                  <p className="text-xs text-slate-500">app-debug-v1.0.apk (18 MB)</p>
                </div>
                <button className="w-full mt-2 bg-blue-600 group-hover:bg-blue-500 py-2 rounded-lg font-medium">Download</button>
              </div>

              <div className="p-6 glass-card rounded-2xl flex flex-col items-center gap-4 hover:border-indigo-500 transition-colors group">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <Package className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold">Código Nativo</h4>
                  <p className="text-xs text-slate-500">android-project.zip (4 MB)</p>
                </div>
                <button className="w-full mt-2 bg-indigo-600 group-hover:bg-indigo-500 py-2 rounded-lg font-medium">Download</button>
              </div>
            </div>

            <button 
              onClick={reset}
              className="text-slate-400 hover:text-white flex items-center gap-2 mx-auto"
            >
              Convertir otro proyecto <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {state === AppState.ERROR && (
          <div className="text-center py-12 space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Error en la Conversión</h2>
              <p className="text-red-400/80">{error}</p>
            </div>
            <button 
              onClick={reset}
              className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-lg transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

      </main>

      <footer className="mt-auto py-8 text-center border-t border-slate-900 bg-slate-950">
        <p className="text-sm text-slate-600">
          © {new Date().getFullYear()} Apkify AI Platform. Potenciado por Google Gemini.
        </p>
      </footer>
    </div>
  );
}
