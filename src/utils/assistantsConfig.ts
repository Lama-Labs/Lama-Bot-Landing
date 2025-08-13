export type AssistantConfig = {
  id: string
  name?: string
  instructions?: string
  vectorStoreIds?: string[]
}

// Default/fallback assistant for Lama Bot website
const DEFAULT_ASSISTANT_ID = 'default'
const DEFAULT_ASSISTANT: AssistantConfig = {
  id: DEFAULT_ASSISTANT_ID,
  name: 'Default Assistant',
  instructions:
    'You are the default assistant for the Lama Bot website. Answer questions about the site, its product (Lama Bot), features, pricing, setup, and usage. Be concise, accurate, and helpful. If something is unclear or unknown, ask a clarifying question or say that you do not know.',
  vectorStoreIds: [],
}

// Map legacy assistant ids (from translations) to per-assistant settings for the Responses API
// Vector store ids here should correspond to OpenAI Vector Store IDs containing the assistant-specific knowledge.
const ASSISTANTS: AssistantConfig[] = [
  {
    id: 'asst_EFxvhDNtArBx9phA28fJpO8X',
    name: 'Fitness Assistant',
    instructions:
      'You are a fitness assistant. Answer questions about workout programs, membership options, and opening hours based on the knowledge base.',
    vectorStoreIds: [],
  },
  {
    id: 'asst_wTLWhkdxcyy7vgy7FpfZFVB3',
    name: 'Wristway Ergonomic Assistant',
    instructions:
      'You help with Wristway, an ergonomic wrist rest. Use the knowledge base to answer product features, usage, and benefits.',
    vectorStoreIds: [],
  },
  {
    id: 'asst_PN6Oyk3VjTtt0tAsMWt2bVOM',
    name: 'Seedbox Assistant',
    instructions:
      'You help with Seedbox, an AI-powered at-home sperm health tracker. Answer about features and usage using the knowledge base.',
    vectorStoreIds: [],
  },
  {
    id: 'asst_LkSPCqE7g1TcRayQGkoCMSyS',
    name: 'Shopify Snowboard Assistant',
    instructions:
      'You can answer questions about the latest snowboard products, their prices, and availability using the knowledge base. Prefer up-to-date information when available.',
    vectorStoreIds: [],
  },
]

export function getAssistantConfigById(id?: string | null): AssistantConfig {
  if (!id) return DEFAULT_ASSISTANT
  return ASSISTANTS.find((a) => a.id === id) ?? DEFAULT_ASSISTANT
}
