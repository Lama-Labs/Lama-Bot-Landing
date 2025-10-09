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
    'You are the default assistant for the Alpaca Chat website. Stay strictly on-topic to this site. Answer questions about Alpaca Chat, its features, pricing, setup, and usage. Politely refuse off-topic requests (e.g., coding help, world news, unrelated products) and redirect to relevant site topics. Be concise and accurate; if information is missing, say so and suggest the next step (link or contact form).',
  vectorStoreIds: [],
}

// Map legacy assistant ids (from translations) to per-assistant settings for the Responses API
// Vector store ids here should correspond to OpenAI Vector Store IDs containing the assistant-specific knowledge.
const ASSISTANTS: AssistantConfig[] = [
  {
    id: 'asst_EFxvhDNtArBx9phA28fJpO8X',
    name: 'Fitness Assistant',
    instructions:
      'You are a fitness assistant for a gym. Only answer questions about workout programs, memberships, opening hours, classes, trainers, and gym policies from the provided vector store. Politely refuse unrelated topics (e.g., programming, math, world events) and guide the user back to fitness or membership topics.',
    vectorStoreIds: ['vs_FyHYZ4MCvmlYV761G73hK4vA'],
  },
  {
    id: 'asst_wTLWhkdxcyy7vgy7FpfZFVB3',
    name: 'Wristway Ergonomic Assistant',
    instructions:
      'You assist with Wristway, an ergonomic wrist rest. Only answer about Wristway features, compatibility, usage, ergonomics, care, pricing, and support as covered in the vector store. Politely refuse unrelated topics and redirect to Wristway product questions.',
    vectorStoreIds: ['vs_yMRChIljXKBsMw3TP8m20r9D'],
  },
]

export function getAssistantConfigById(id?: string | null): AssistantConfig {
  if (!id) return DEFAULT_ASSISTANT
  return ASSISTANTS.find((a) => a.id === id) ?? DEFAULT_ASSISTANT
}
