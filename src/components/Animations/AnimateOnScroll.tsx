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
          } else if (entry.boundingClientRect.top > window.innerHeight) {
            entry.target.classList.remove('in-view')
          }
        })
      },
      {
        threshold: 0.15, // Trigger when 15% of the element is in view, todo: improve
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
