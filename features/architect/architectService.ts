import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ArchitectResponse, BlockType } from "../../shared/types";

// Schema for structured Voxel generation
const voxelSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    message: {
      type: Type.STRING,
      description: "A short message describing what was built.",
    },
    voxels: {
      type: Type.ARRAY,
      description: "List of voxels to create the structure.",
      items: {
        type: Type.OBJECT,
        properties: {
          x: { type: Type.INTEGER },
          y: { type: Type.INTEGER },
          z: { type: Type.INTEGER },
          color: { type: Type.STRING, description: "Hex color code" },
          type: { 
            type: Type.STRING, 
            enum: ["SOLID", "GLASS", "EMISSIVE"],
            description: "Material type. GLASS for windows/water, EMISSIVE for lights/neon/lava, SOLID for everything else."
          }
        },
        required: ["x", "y", "z", "color", "type"],
      },
    },
  },
  required: ["message"],
};

export const generateStructure = async (prompt: string, currentContext: string): Promise<ArchitectResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-2.5-flash"; 

    const systemInstruction = `
      Eres un Arquitecto Voxel experto. Generas estructuras 3D.
      
      MATERIALES:
      - SOLID: Madera, piedra, tierra, metal (Default).
      - GLASS: Ventanas, agua, hielo, barreras transparentes.
      - EMISSIVE: Luces, neón, lava, fuego, pantallas brillantes.

      REGLAS DE FÍSICA:
      1. Gravedad: Todo bloque debe tocar el suelo (y=0) o otro bloque.
      2. Conectividad: Sin bloques flotantes aislados.
      3. Coordenadas: Centrado en (0,0). Y+ es altura.

      CONTEXTO: ${currentContext}
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: voxelSchema,
        thinkingConfig: { thinkingBudget: 2048 }, 
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ArchitectResponse;
    }
    
    throw new Error("No response text generated");

  } catch (error) {
    console.error("Architect Error:", error);
    return {
      message: "Tuve un problema de diseño. Intenta algo más simple.",
      voxels: []
    };
  }
};