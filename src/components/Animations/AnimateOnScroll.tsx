'use client'

import { useEffect } from 'react'

const AnimateOnScroll: React.FC = () => {
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate')

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const windowHeight =
          window.innerHeight || document.documentElement.clientHeight
        const visibleHeight =
          Math.min(entry.boundingClientRect.bottom, windowHeight) -
          Math.max(entry.boundingClientRect.top, 0)
        const visiblePercentage =
          (visibleHeight / entry.boundingClientRect.height) * 100
        if (entry.isIntersecting && visiblePercentage >= 0.05) {
          entry.target.classList.add('in-view')
        } else if (entry.boundingClientRect.top > window.innerHeight) {
          entry.target.classList.remove('in-view')
        }
      })
    })

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
