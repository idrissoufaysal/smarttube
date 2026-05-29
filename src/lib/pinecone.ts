import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";

// 1. Initialisation des embeddings avec le modèle gratuit de OpenRouter
export function getEmbeddings() {
  const apiKey = process.env.AI_KEY;
  if (!apiKey) {
    throw new Error("La variable d'environnement AI_KEY (clé OpenRouter) est requise.");
  }

  return new OpenAIEmbeddings({
    apiKey,
    modelName: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://smarttube.example.com", // Requis par OpenRouter
        "X-Title": "SmartTube AI",
      }
    }
  });
}

// 2. Initialisation du client Pinecone et récupération de l'index
export function getPineconeIndex() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;

  if (!apiKey || apiKey === "your_pinecone_api_key_here") {
    throw new Error("Veuillez configurer la clé PINECONE_API_KEY dans votre fichier .env.");
  }
  if (!indexName || indexName === "your_pinecone_index_name_here") {
    throw new Error("Veuillez configurer le nom PINECONE_INDEX dans votre fichier .env.");
  }

  const pc = new Pinecone({ apiKey });
  return pc.index(indexName);
}

// 3. Obtenir le PineconeStore pour LangChain
export async function getVectorStore(videoId: string) {
  const pineconeIndex = getPineconeIndex();
  const embeddings = getEmbeddings();

  return new PineconeStore(embeddings, {
    pineconeIndex,
    namespace: videoId, // Permet d'isoler hermétiquement les transcriptions par vidéo
  });
}
