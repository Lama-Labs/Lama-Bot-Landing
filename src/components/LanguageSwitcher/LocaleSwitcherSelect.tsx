'use client'

// todo: fix
// eslint-disable-next-line import/named
import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useTransition } from 'react'

import { usePathname, useRouter } from '@/i18n/routing'

type LocaleOption = {
  value: string
  label: string
}

type LocaleSwitcherSelectProps = {
  currentLocale: string
  locales: LocaleOption[]
}

const LocaleSwitcherSelect = ({
  currentLocale,
  locales,
}: LocaleSwitcherSelectProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()

  const handleLocaleChange = (event: SelectChangeEvent<string>) => {
    const nextLocale = event.target.value as string
    startTransition(() => {
      router.replace({ pathname }, { locale: nextLocale })
    })
  }

  return (
    <FormControl sx={{ width: '200px' }}>
      <Select
        value={currentLocale}
        onChange={handleLocaleChange}
        variant='outlined'
        disabled={isPending}
      >
        {locales.map(({ value, label }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default LocaleSwitcherSelect
