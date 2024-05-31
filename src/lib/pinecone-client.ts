import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "./config";
import { delay } from "./utils";

let pineconeClientInstance: Pinecone | null = null;

// Create pineconeIndex if it doesn't exist
async function createIndex(client: Pinecone, indexName: string) {
  try {
    await client.createIndex({
      name: indexName,
      dimension: 1536,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: env.PINECONE_ENVIRONMENT
        }
      }
    });

    console.log(
      `Waiting for ${process.env.INDEX_INIT_TIMEOUT!} seconds for index initialization to complete...`
    );
    await delay(env.INDEX_INIT_TIMEOUT);
    console.log("Index created !!");
  } catch (error) {
    console.error("error ", error);
    throw new Error("Index creation failed");
  }
}

// Initialize index and ready to be accessed.
async function initPineconeClient() {
  try {
    const pineconeClient = new Pinecone({
      apiKey:  process.env.PINECONE_API_KEY ?? '',
    });

    const indexName =  process.env.PINECONE_INDEX_NAME ?? '';

    const indexList = await pineconeClient.listIndexes();
    const existingIndexes = indexList.indexes ?? [];

    const indexExists = existingIndexes.some(index => index.name === indexName);


    if (!indexExists) {
      await createIndex(pineconeClient, indexName);
    } else {
      console.log("Your index already exists. nice !!");
    }

    return pineconeClient;
  } catch (error) {
    console.error("error", error);
    throw new Error("Failed to initialize Pinecone Client");
  }
}

export async function getPineconeClient() {
  if (!pineconeClientInstance) {
    pineconeClientInstance = await initPineconeClient();
  }

  return pineconeClientInstance;
}
