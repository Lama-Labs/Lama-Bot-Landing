'use client'

import { ReactNode, createContext, useContext, useState } from 'react'

interface ChatContextProps {
  isChatOpen: boolean
  setIsChatOpen: (isOpen: boolean) => void
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined)

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <ChatContext.Provider value={{ isChatOpen, setIsChatOpen }}>
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
