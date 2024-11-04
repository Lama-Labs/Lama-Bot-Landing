import { useTranslations } from 'next-intl'
import { Container } from '@mui/material'
import Paragraph from '@/components/Paragraphs/Paragraph'

const Paragraphs = () => {
  const t = useTranslations('home.paragraphs')
  const items = t.raw('items')

  return (
    <Container maxWidth='xl'>
      {/* todo: fix any*/}
      {items.map((paragraph: any, index: number) => (
        <Paragraph
          key={index}
          title={paragraph.title}
          description={paragraph.content}
          image={paragraph.image}
        />
      ))}
    </Container>
  )
}

export default Paragraphs
