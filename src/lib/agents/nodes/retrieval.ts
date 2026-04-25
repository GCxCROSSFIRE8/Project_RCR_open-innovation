import { AgentState } from "../state";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const ragRetrievalNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("[Node: RAG] Retrieving similar past verified events... (Pinecone)");
  
  if (state.isSpam) {
    return { ragContext: "Report identified as spam. No retrieval performed.", status: 'RAG_COMPLETE' as const };
  }

  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!pineconeApiKey || !geminiApiKey) {
    console.warn("[Node: RAG] Missing Pinecone or Gemini config. Falling back to mock RAG.");
    const mockContext = `[Past Event] 2km away, "Minor collision", Risk: LOW, Verified = TRUE`;
    return { ragContext: mockContext, status: 'RAG_COMPLETE' as const };
  }

  try {
    const pc = new Pinecone({ apiKey: pineconeApiKey });
    const index = pc.Index("localyze");
    
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: geminiApiKey,
      model: "text-embedding-004",
    });
    
    // Embed the incoming user report
    const vector = await embeddings.embedQuery(state.crisisRequest);

    // Query Pinecone for Top-3 similar past events
    const queryResponse = await index.query({
      topK: 3,
      vector: vector,
      includeMetadata: true,
    });

    if (queryResponse.matches.length === 0) {
       return { ragContext: "No dynamically similar past events found in database.", status: 'RAG_COMPLETE' as const };
    }

    const context = queryResponse.matches.map((match: any, i: number) => {
       const meta = (match.metadata as Record<string, any>) || {};
       return `[Past Event ${i + 1}] Risk: ${meta.riskLevel || 'UNKNOWN'}, Category: ${meta.category || 'UNKNOWN'}, Summary: "${meta.summary || 'No description found'}"`;
    }).join("\n");

    return { ragContext: context, status: 'RAG_COMPLETE' as const };

  } catch (err: any) {
    console.error("[Node: RAG] Retrieval Error:", err.message || err);
    return { ragContext: "Error retrieving contexts from Database.", status: 'RAG_COMPLETE' as const };
  }
};
