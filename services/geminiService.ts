
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeProject = async (packageJson: string, fileList: string[]): Promise<ProjectAnalysis> => {
  const prompt = `
    Analiza este proyecto React para convertirlo en una aplicación Android (APK) usando Capacitor.
    
    Package.json content:
    ${packageJson}

    Estructura de archivos:
    ${fileList.join('\n')}

    Genera una configuración de transformación móvil profesional.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          version: { type: Type.STRING },
          dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedPackageName: { type: Type.STRING },
          compatibilityScore: { type: Type.NUMBER },
          mobileAdjustments: { type: Type.ARRAY, items: { type: Type.STRING } },
          androidManifest: { type: Type.STRING, description: "XML string for AndroidManifest.xml" }
        },
        required: ["projectName", "version", "suggestedPackageName", "compatibilityScore", "mobileAdjustments", "androidManifest"]
      }
    }
  });

  return JSON.parse(response.text) as ProjectAnalysis;
};
