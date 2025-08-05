import { useState, useEffect } from 'react'

// 屏幕尺寸斷點
const BREAKPOINTS = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1200,
  xl: 1600,
}

/**
 * 響應式設計 Hook
 * 檢測屏幕尺寸並返回當前斷點信息
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  const [breakpoint, setBreakpoint] = useState('')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({ width, height })

      // 判斷當前斷點
      if (width <= BREAKPOINTS.xs) {
        setBreakpoint('xs')
      } else if (width <= BREAKPOINTS.sm) {
        setBreakpoint('sm')
      } else if (width <= BREAKPOINTS.md) {
        setBreakpoint('md')
      } else if (width <= BREAKPOINTS.lg) {
        setBreakpoint('lg')
      } else {
        setBreakpoint('xl')
      }
    }

    // 初始化
    handleResize()

    // 添加事件監聽
    window.addEventListener('resize', handleResize)

    // 清理函數
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    // 屏幕尺寸
    width: screenSize.width,
    height: screenSize.height,
    
    // 當前斷點
    breakpoint,
    
    // 便捷判斷
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm', 
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    
    // 移動端判斷
    isMobile: screenSize.width <= BREAKPOINTS.sm,
    isTablet: screenSize.width > BREAKPOINTS.sm && screenSize.width <= BREAKPOINTS.md,
    isDesktop: screenSize.width > BREAKPOINTS.md,
    
    // 方向判斷
    isLandscape: screenSize.width > screenSize.height,
    isPortrait: screenSize.width <= screenSize.height,
    
    // 具體斷點檢查
    isAbove: (size) => screenSize.width > BREAKPOINTS[size],
    isBelow: (size) => screenSize.width <= BREAKPOINTS[size],
    isBetween: (min, max) => screenSize.width > BREAKPOINTS[min] && screenSize.width <= BREAKPOINTS[max],
  }
}

/**
 * 移動端檢測 Hook（簡化版）
 */
export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= BREAKPOINTS.sm)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= BREAKPOINTS.sm)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

/**
 * 設備類型檢測 Hook
 */
export const useDeviceType = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive()

  return {
    isMobile,
    isTablet, 
    isDesktop,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  }
}

export default useResponsive