import { Home, Settings, User, Search } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

type IconMap = {
  [key: string]: React.FC<LucideProps>
}

// Define the mapping between strings and icons
const iconMap: IconMap = {
  home: Home,
  settings: Settings,
  user: User,
  search: Search,
  // Add more icons as needed
}

type IconProps = {
  iconName: string
  color?: string
  size?: number
}

const MapIcon = ({ iconName, color = '#000', size = 24 }: IconProps) => {
  const Icon = iconMap[iconName]

  if (!Icon) return null

  // Return the icon component with applied props
  return <Icon color={color} size={size} />
}

export default MapIcon
