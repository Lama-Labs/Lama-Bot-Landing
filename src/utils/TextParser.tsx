interface TextParserProps {
  text: string
}

const TextParser: React.FC<TextParserProps> = ({ text }) => {
  const parseText = (input: string) => {
    const parts = input.split(/(\[BOLD\]|\[\/BOLD\]|\[BREAK\])/g)
    const parsed: React.ReactNode[] = []
    let isBold = false

    parts.forEach((part, index) => {
      if (part === '[BOLD]') {
        isBold = true // Start bold
      } else if (part === '[/BOLD]') {
        isBold = false // End bold
      } else if (part === '[BREAK]') {
        parsed.push(<br key={index} />) // Line break
      } else if (part.trim()) {
        parsed.push(
          isBold ? (
            <strong key={index}>{part}</strong>
          ) : (
            <span key={index}>{part}</span>
          )
        )
      }
    })

    return parsed
  }

  return <div>{parseText(text)}</div>
}

export default TextParser
