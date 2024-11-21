import type { MenuProps } from '@mui/material/Menu'
import { useLocale, useTranslations } from 'next-intl'

import { routing } from '@/i18n/routing'

import LocaleSwitcherSelect from './LocaleSwitcherSelect'

type LocaleSwitcherProps = {
  anchorOrigin?: MenuProps['anchorOrigin']
  transformOrigin?: MenuProps['transformOrigin']
}

const LocaleSwitcher = ({
  anchorOrigin,
  transformOrigin,
}: LocaleSwitcherProps) => {
  const t = useTranslations('navbar.localeSwitcher')
  const locale = useLocale()

  return (
    <LocaleSwitcherSelect
      currentLocale={locale}
      locales={routing.locales.map((cur) => ({
        value: cur,
        label: t(cur),
      }))}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
    />
  )
}

export default LocaleSwitcher
