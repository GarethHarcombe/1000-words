// components/mapComponents/accessories.ts
import { ImageStyle } from 'react-native';

export type AccessoryKey = 'wings' | 'surf' | 'suitcases';

export const ACCESSORY_IMAGES: Record<AccessoryKey, any> = {
  wings: require('@/assets/images/good-icons/wings_cream.png'),
  surf: require('@/assets/images/good-icons/surf.png'),
  suitcases: require('@/assets/images/good-icons/suitcases.png'),
};

/**
 * Placement is relative to the caravan container size so it scales nicely.
 * Tweak these to match your artwork precisely.
 */
export function getAccessoryStyle(
  key: AccessoryKey,
  size: number
): ImageStyle {
  switch (key) {
    case 'wings':
      return {
        position: 'absolute',
        width: size * 0.7,
        height: size * 0.5,
        right: size * -0.1,
        top: size * -0.05,
        zIndex: 31, // behind the body
      };
    case 'surf':
      return {
        position: 'absolute',
        width: size * 0.9,
        height: size * 0.16,
        // right: size * 0.08,
        top: size * 0.14,
        zIndex: 3, // on top of body
      };
    case 'suitcases':
      return {
        position: 'absolute',
        width: size * 0.5,
        height: size * 0.3,
        left: size * 0.2,
        top: size * -0.02,
        zIndex: 3,
      };
    default:
      return {};
  }
}
