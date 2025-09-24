'use client'

import { ReactNode, createContext, useContext, useState } from 'react'

interface ChatContextProps {
  isChatOpen: boolean
  setIsChatOpen: (isOpen: boolean) => void
  assistantName: string
  setAssistantName: (name: string) => void
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined)

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [assistantName, setAssistantName] = useState('Lama Bot')

  return (
    <ChatContext.Provider
      value={{ isChatOpen, setIsChatOpen, assistantName, setAssistantName }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = (): ChatContextProps => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
