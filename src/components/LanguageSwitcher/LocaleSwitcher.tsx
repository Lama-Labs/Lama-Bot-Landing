import { useLocale, useTranslations } from 'next-intl'
import { routing } from '@/i18n/routing'
import LocaleSwitcherSelect from './LocaleSwitcherSelect'

const LocaleSwitcher = () => {
  const t = useTranslations('components.LocaleSwitcher')
  const locale = useLocale()

  return (
    <LocaleSwitcherSelect
      currentLocale={locale}
      locales={routing.locales.map((cur) => ({
        value: cur,
        label: t(cur),
      }))}
    />
  )
}

export default LocaleSwitcher
