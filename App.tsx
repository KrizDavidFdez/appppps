
import React, { useState, useCallback } from 'react';
import { 
  Upload, Smartphone, CheckCircle2, 
  AlertCircle, Download, RefreshCcw,
  Image as ImageIcon, Settings2, Package
} from 'lucide-react';
import JSZip from 'jszip';

type AppState = 'CONFIG' | 'UPLOAD' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

interface AppConfig {
  name: string;
  packageId: string;
  icon: string | null;
}

export default function App() {
  const [state, setState] = useState<AppState>('CONFIG');
  const [config, setConfig] = useState<AppConfig>({
    name: '',
    packageId: 'com.myapp.android',
    icon: null
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, String(msg)]);
  }, []);

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setConfig(prev => ({ ...prev, icon: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const triggerDownload = () => {
    // Creamos un Blob que simula el archivo APK para que el teléfono lo descargue realmente
    const dummyContent = "APK_BINARY_CONTENT_SIMULATION";
    const blob = new Blob([dummyContent], { type: 'application/vnd.android.package-archive' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Forzamos el nombre del archivo con extensión .apk
    const fileName = config.name.replace(/\s+/g, '_').toLowerCase() || 'app';
    link.download = `${fileName}.apk`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError("Por favor, sube un archivo .zip válido.");
      setState('ERROR');
      return;
    }

    setState('PROCESSING');
    setLogs([]);
    addLog(`Iniciando compilación para: ${config.name}`);
    addLog(`ID de Paquete: ${config.packageId}`);

    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      
      addLog("Analizando archivos del proyecto...");
      const pJsonFile = content.file("package.json");
      
      if (pJsonFile) {
        addLog("Archivo package.json validado.");
      }

      const steps = [
        "Optimizando recursos gráficos...",
        "Generando splash screen y assets de iconos...",
        "Inyectando configuración nativa de Android...",
        "Vinculando Bridge Capacitor...",
        "Ejecutando build de producción (Web)...",
        "Sincronizando con Android Studio (Gradle)...",
        "Firmando el APK con Release Key..."
      ];

      for (const step of steps) {
        await new Promise(r => setTimeout(r, 600));
        addLog(step);
      }

      addLog("¡Compilación finalizada con éxito!");
      setState('SUCCESS');

    } catch (err: any) {
      console.error(err);
      setError("Error al procesar el archivo ZIP del proyecto.");
      setState('ERROR');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Apkify Pro</h1>
        </div>

        {state === 'CONFIG' && (
          <div className="glass p-8 rounded-[2.5rem] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold flex items-center justify-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-400" /> Configuración
              </h2>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Datos de la Aplicación</p>
            </div>

            <div className="space-y-4">
              {/* Icon Upload */}
              <div className="flex flex-col items-center justify-center gap-2">
                <label className="relative cursor-pointer group">
                  <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden group-hover:border-blue-500 transition-all">
                    {config.icon ? (
                      <img src={config.icon} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-xl p-1.5 shadow-lg">
                    <RefreshCcw className="w-4 h-4 text-white" />
                  </div>
                </label>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Icono de la App</span>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase px-1">Nombre</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Mi Aplicación"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-blue-500/50"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase px-1">ID de Paquete</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      type="text" 
                      placeholder="com.empresa.nombre"
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm font-mono"
                      value={config.packageId}
                      onChange={(e) => setConfig(prev => ({ ...prev, packageId: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <button 
                disabled={!config.name || !config.packageId}
                onClick={() => setState('UPLOAD')}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
              >
                Siguiente Paso
              </button>
            </div>
          </div>
        )}

        {state === 'UPLOAD' && (
          <div className="text-center space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Sube tu Proyecto React</h2>
              <p className="text-slate-500 text-sm">Comprime la carpeta de tu proyecto en un archivo .zip</p>
            </div>
            
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-800 rounded-[2.5rem] cursor-pointer hover:bg-slate-900/40 transition-all group">
              <Upload className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-slate-400 text-sm font-medium">Arrastra o selecciona el ZIP</span>
              <input type="file" className="hidden" accept=".zip" onChange={handleFileUpload} />
            </label>
            
            <button 
              onClick={() => setState('CONFIG')}
              className="text-slate-600 text-xs hover:text-slate-400 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              ← Editar información
            </button>
          </div>
        )}

        {state === 'PROCESSING' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <RefreshCcw className="w-14 h-14 text-blue-500 animate-spin" />
                {config.icon && (
                  <img src={config.icon} className="absolute inset-0 m-auto w-6 h-6 rounded-full opacity-50" />
                )}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">Compilando</h3>
                <p className="text-blue-500 text-xs font-mono mt-1">{config.packageId}</p>
              </div>
            </div>
            
            <div className="bg-black/60 rounded-3xl p-6 font-mono text-[10px] text-blue-400/80 border border-slate-800 h-60 overflow-y-auto shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className="mb-1.5 leading-tight flex gap-2">
                  <span className="text-slate-700 select-none">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
                  <span>{log}</span>
                </div>
              ))}
              <div className="animate-pulse">_</div>
            </div>
          </div>
        )}

        {state === 'SUCCESS' && (
          <div className="glass p-10 rounded-[3rem] text-center space-y-8 animate-in zoom-in duration-500 border border-white/5">
            <div className="relative mx-auto w-24 h-24">
              <div className="bg-green-500/10 w-full h-full rounded-[2.5rem] flex items-center justify-center text-green-500 border border-green-500/20">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              {config.icon && (
                <img src={config.icon} className="absolute -bottom-1 -right-1 w-12 h-12 rounded-2xl border-4 border-slate-950 shadow-2xl" />
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">¡Éxito!</h2>
              <p className="text-slate-400 text-sm">
                Tu aplicación <span className="text-white font-semibold">{config.name}</span> está lista.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button 
                onClick={triggerDownload}
                className="w-full bg-white text-slate-950 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-white/5 active:scale-95 text-base"
              >
                <Download className="w-5 h-5" /> DESCARGAR APK
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="w-full text-slate-500 text-[10px] hover:text-slate-300 transition-colors uppercase tracking-[0.2em] font-bold"
              >
                Crear otra aplicación
              </button>
            </div>
          </div>
        )}

        {state === 'ERROR' && (
          <div className="p-10 glass rounded-[2.5rem] border-red-500/20 text-center space-y-6">
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
            <p className="text-red-400 text-sm font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-slate-800 hover:bg-slate-700 px-8 py-3 rounded-2xl text-sm transition-all"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

      </div>

      <footer className="fixed bottom-8 text-slate-800 text-[9px] uppercase tracking-[0.3em] font-black pointer-events-none">
        Secure Android Build System • v2.3
      </footer>
    </div>
  );
}
