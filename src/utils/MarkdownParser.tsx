interface TextParserProps {
  text: string
}

const TextParser: React.FC<TextParserProps> = ({ text }) => {
  const parseText = (input: string) => {
    const parts = input.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?]\(.*?\))/g) // Matches **bold**, *italic*, [link](url)
    const parsed: React.ReactNode[] = []

    parts.forEach((part, index) => {
      if (!part.trim() && part !== '\n') return

      if (part.startsWith('**') && part.endsWith('**')) {
        // Bold text
        parsed.push(<strong key={index}>{part.slice(2, -2)}</strong>)
      } else if (part.startsWith('*') && part.endsWith('*')) {
        // Italic text
        parsed.push(<em key={index}>{part.slice(1, -1)}</em>)
      } else if (part.startsWith('[') && part.includes('](')) {
        // Link
        const match = part.match(/\[(.*?)]\((.*?)\)/)
        if (match) {
          const [_, text, url] = match
          parsed.push(
            <a key={index} href={url} target='_blank' rel='noopener noreferrer'>
              {text}
            </a>
          )
        }
      } else {
        // Plain text
        parsed.push(<span key={index}>{part}</span>)
      }
    })

    return parsed
  }

  return <span>{parseText(text)}</span>
}

export default TextParser
