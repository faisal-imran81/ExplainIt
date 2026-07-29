import { useWindowDimensions, Platform } from 'react-native';

const BREAKPOINTS = { MOBILE: 480, TABLET: 768, DESKTOP: 1024 };

export function useResponsive() {
  const { width: windowWidth } = useWindowDimensions();

  const breakpoint =
    windowWidth <= BREAKPOINTS.MOBILE ? 'mobile'
      : windowWidth <= BREAKPOINTS.TABLET ? 'tablet'
        : windowWidth <= BREAKPOINTS.DESKTOP ? 'desktop'
          : 'ultrawide';

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';
  const isUltraWide = breakpoint === 'ultrawide';

  const containerStyle = Platform.select({
    web: {
      maxWidth:
        isMobile ? undefined
          : isTablet ? 720
            : isDesktop ? 960
              : 1140,
      alignSelf: 'center',
      width: '100%',
    },
    default: {},
  });

  const bubbleMaxWidth = Platform.select({
    web: isMobile ? undefined : isTablet ? '75%' : '65%',
    default: undefined,
  });

  return {
    windowWidth,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isUltraWide,
    containerStyle,
    bubbleMaxWidth,
  };
}
