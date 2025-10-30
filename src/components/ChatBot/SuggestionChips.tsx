import { Chip, Stack } from '@mui/material'

interface SuggestionChipsProps {
  suggestions: string[]
  onSelect: (text: string) => void
  disabled?: boolean
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSelect,
  disabled = false,
}) => {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <Stack direction='row' flexWrap='wrap' gap={1} sx={{ mt: 1 }}>
      {suggestions.map((s, idx) => (
        <Chip
          key={`${idx}-${s}`}
          label={s}
          clickable={!disabled}
          disabled={disabled}
          variant='outlined'
          color='default'
          onClick={() => onSelect(s)}
          sx={{
            bgcolor: 'grey.800',
            color: 'grey.100',
            borderColor: 'grey.700',
          }}
        />
      ))}
    </Stack>
  )
}

export default SuggestionChips
