import { Platform, useWindowDimensions } from 'react-native';

export const useResponsive = () => {
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return {
      containerStyle: {},
      isWeb: false,
      isMobile: true,
      contentMaxWidth: width,
      horizontalPadding: 20,
    };
  }

  // Web breakpoints
  const isSmallWeb = width < 768;
  const isMediumWeb = width >= 768 && width < 1100;
  const isLargeWeb = width >= 1100;

  const contentMaxWidth = isLargeWeb ? 960 : isMediumWeb ? 800 : 640;
  const horizontalPadding = isLargeWeb ? 48 : isMediumWeb ? 32 : 20;

  const containerStyle = {
    maxWidth: contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: horizontalPadding,
  };

  return {
    containerStyle,
    isWeb: true,
    isMobile: false,
    contentMaxWidth,
    horizontalPadding,
  };
};
