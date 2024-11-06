'use client'

import { useEffect } from 'react'

const AnimateOnScroll: React.FC = () => {
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
          } else {
            entry.target.classList.remove('in-view')
          }
        })
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is in view
      }
    )

    elements.forEach((element) => {
      observer.observe(element)
    })
  }

  useEffect(() => {
    animateOnScroll()
  }, [])

  return null
}

export default AnimateOnScroll

/*todo: direction, delay, restart*/
