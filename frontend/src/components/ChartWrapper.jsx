import React, { useEffect, useRef } from 'react'

/**
 * 圖表包裝器組件 - 確保圖表背景始終為白色
 */
const ChartWrapper = ({ children, style = {}, ...props }) => {
  const wrapperRef = useRef(null)

  useEffect(() => {
    // 強制設置所有SVG和圖表元素的背景為白色
    const forceWhiteBackground = () => {
      if (wrapperRef.current) {
        const svgs = wrapperRef.current.querySelectorAll('svg')
        svgs.forEach(svg => {
          svg.style.backgroundColor = 'white'
          svg.style.background = 'white'
        })

        const rechartsElements = wrapperRef.current.querySelectorAll('[class*="recharts"]')
        rechartsElements.forEach(element => {
          element.style.backgroundColor = 'white'
          element.style.background = 'white'
        })
      }
    }

    // 初始設置
    forceWhiteBackground()

    // 設置觀察器監聽DOM變化
    const observer = new MutationObserver(forceWhiteBackground)
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      })
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={wrapperRef}
      style={{
        backgroundColor: 'white',
        width: '100%',
        height: '100%',
        position: 'relative',
        ...style
      }}
      {...props}
    >
      <div
        style={{
          backgroundColor: 'white',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'white'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default ChartWrapper