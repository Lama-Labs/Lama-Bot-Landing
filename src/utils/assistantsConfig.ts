export type AssistantConfig = {
  id: string
  name?: string
  instructions?: string
  vectorStoreIds?: string[]
}

// Default/fallback assistant for Alpaca Chat website
const DEFAULT_ASSISTANT_ID = 'default'
const DEFAULT_ASSISTANT: AssistantConfig = {
  id: DEFAULT_ASSISTANT_ID,
  name: 'Default Assistant',
  instructions:
    'You are the default assistant for the Alpaca Chat website. Answer questions about the site, its product (Alpaca Chat), features, pricing, setup, and usage. Be concise, accurate, and helpful. If something is unclear or unknown, ask a clarifying question or say that you do not know.',
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
    vectorStoreIds: ['vs_FyHYZ4MCvmlYV761G73hK4vA'],
  },
  {
    id: 'asst_wTLWhkdxcyy7vgy7FpfZFVB3',
    name: 'Wristway Ergonomic Assistant',
    instructions:
      'You help with Wristway, an ergonomic wrist rest. Use the knowledge base to answer product features, usage, and benefits.',
    vectorStoreIds: ['vs_yMRChIljXKBsMw3TP8m20r9D'],
  },
]

export function getAssistantConfigById(id?: string | null): AssistantConfig {
  if (!id) return DEFAULT_ASSISTANT
  return ASSISTANTS.find((a) => a.id === id) ?? DEFAULT_ASSISTANT
}
