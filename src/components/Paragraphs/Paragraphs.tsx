import { Box, Container } from '@mui/material'
import { useTranslations } from 'next-intl'

import Paragraph from '@/components/Paragraphs/Paragraph'

const Paragraphs = () => {
  const t = useTranslations('home.paragraphs')
  const items = t.raw('items')

  return (
    <Container maxWidth='xl'>
      <Box
        display='flex'
        flexDirection='column'
        justifyContent='center'
        gap={18}
        py={9}
      >
        {/*todo: fix*/}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
        {items.map((paragraph: any, index: number) => (
          <Paragraph
            key={index}
            pretitle={paragraph.pretitle}
            title={paragraph.title}
            description={paragraph.content}
            image={paragraph.image}
            icon={paragraph.icon}
            messages={paragraph.messages}
          />
        ))}
      </Box>
    </Container>
  )
}

export default Paragraphs
