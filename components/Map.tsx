import React, { useState, useEffect, useRef } from 'react';
import { View, ImageBackground, StyleSheet, Dimensions, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  clamp,
  Easing,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { Town } from '@/constants/Types'
import rawTowns from '@/data/welsh-towns.json'
import BottomSheet from './BottomSheet'
import TownInfo from './mapComponents/townInfo'

// Define types for the gesture events
interface TapGestureEvent {
  x: number;
  y: number;
  absoluteX: number;
  absoluteY: number;
}

interface Position {
  x: number;
  y: number;
}

const townImages: Record<string, any> = {
  "1": require('@/assets/images/good-icons/CHURCH.png'),  // conwy
  "2": require('@/assets/images/town-icons/armchair.png'),
  "3": require('@/assets/images/town-icons/love_spoons.png'),
  "4": require('@/assets/images/town-icons/llanfairpg.png'),
  "5": require('@/assets/images/town-icons/welsh_cakes.png'),
  "6": require('@/assets/images/town-icons/portmeirion.png'),
  "7": require('@/assets/images/town-icons/pembrokeshire-coast.png'),
  "8": require('@/assets/images/town-icons/st-davids.png'),
  "9": require('@/assets/images/town-icons/swansea.png'),
  "10": require('@/assets/images/town-icons/cardiff.png'),
  "default": require('@/assets/images/adaptive-icon.png')
};

const { width, height } = Dimensions.get('window');
const viewportWidth = width;
const viewportHeight = height;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Define the original image aspect ratio (width/height)
const imgWidth = 2481;
const imgHeight = 3508;
const IMAGE_ASPECT_RATIO = imgWidth / imgHeight // Your welsh-map-background.jpeg aspect ratio

// Calculate initial map dimensions
const mapHeight = viewportHeight;
const mapWidth = mapHeight * IMAGE_ASPECT_RATIO;

const scaleX = mapWidth / imgWidth;
const scaleY = mapHeight / imgHeight;


const ICON_SIZE = 20;
const ICON_HALF = ICON_SIZE / 2;


// Navbar adjustment
const NAVBAR_HEIGHT = 0;
const EFFECTIVE_HEIGHT = viewportHeight;

// Caravan settings
const CARAVAN_SIZE = 40;
const CARAVAN_SPEED = 100; // pixels per second (in unscaled map coordinates)

// Town data with descriptions
const towns: Town[] = rawTowns
  .map(town => ({
    ...town, 
  }))
  .slice(0, 5);

const bottomSheetHeight = height * 0.5; // 40% of screen height


export default function Map() {
  const mapContainerRef = useRef(null);
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Caravan state and animation values - much simpler now!
  const [targetPosition, setTargetPosition] = useState<Position>({ x: 150, y: 150 });
  const [isMoving, setIsMoving] = useState(false);
  const [isFacingLeft, setIsFacingLeft] = useState(false);
  const caravanX = useSharedValue(400);
  const caravanY = useSharedValue(150);
  
  // Selected town state
  const [selectedTown, setSelectedTown] = useState<Town | null>(null);
  const [isTownPopup, setIsTownPopup] = useState(false);
  
  // Debug state - simplified
  const [lastTap, setLastTap] = useState<Position | null>(null);
  const [lastCalculatedMapPosition, setLastCalculatedMapPosition] = useState<Position | null>(null);

  // Move caravan effect - unchanged
  useEffect(() => {
    if (isMoving) {
      const currentX = caravanX.value;
      const currentY = caravanY.value;
      const dx = targetPosition.x - currentX;
      const dy = targetPosition.y - currentY;
      
      // Determine facing direction
      if (dx > 0) {
        setIsFacingLeft(true);
      } else if (dx < 0) {
        setIsFacingLeft(false);
      }
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = (distance / CARAVAN_SPEED) * 1000;
      
      caravanX.value = withTiming(targetPosition.x, { 
        duration,
        easing: Easing.linear
      }, (finished) => {
        if (finished) {
          runOnJS(setIsMoving)(false);
        }
      });
      
      caravanY.value = withTiming(targetPosition.y, { 
        duration,
        easing: Easing.linear
      });
    }
  }, [targetPosition, isMoving]);

  const screenToMapCoordinates = (screenX: number, screenY: number) => {
    // Since we're inside the transformed container, we need to account for the map's position
    // The map is centered in the animated container
    const mapCenterX = mapWidth / 2;
    const mapCenterY = mapHeight / 2;
    
    // Convert screen coordinates relative to the animated container to map coordinates
    const mapX = screenX;
    const mapY = screenY;
    
    return { x: mapX, y: mapY };
  };

  const handleMapTap = (event: TapGestureEvent) => {
    if (selectedTown) {
      setIsTownPopup(false);
      setSelectedTown(null);
      // return;
    }
    
    setLastTap({ x: event.x, y: event.y });
    
    // Much simpler - event coordinates are already in map coordinate space!
    const mapX = Math.round(event.x);
    const mapY = Math.round(event.y);
    
    // Check bounds
    if (mapX < 0 || mapX > mapWidth || mapY < 0 || mapY > mapHeight) {
      return;
    }
    
    // Check if tap is on a town
    const tappedTown = findTownAtPosition(mapX, mapY);
    if (tappedTown) {
      onTownPress(tappedTown);
      return;
    }
    
    setLastCalculatedMapPosition({ x: mapX, y: mapY });
    setTargetPosition({ x: mapX, y: mapY });
    setIsMoving(true);
  };

  // Gestures remain the same
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // if (selectedTown) return;
      
      const currentScale = scale.value;
      const scaledMapWidth = mapWidth * currentScale;
      const scaledMapHeight = mapHeight * currentScale;
      
      const horizontalExcess = Math.max(0, scaledMapWidth - viewportWidth);
      const verticalExcess = Math.max(0, scaledMapHeight - EFFECTIVE_HEIGHT);
      
      const maxTranslateX = horizontalExcess / 2;
      const minTranslateX = -maxTranslateX;
      const maxTranslateY = verticalExcess / 2;
      const adjustedMaxY = maxTranslateY + (NAVBAR_HEIGHT / 2) * currentScale;
      
      translateX.value = clamp(
        savedTranslateX.value + event.translationX,
        minTranslateX,
        maxTranslateX
      );
      
      translateY.value = clamp(
        savedTranslateY.value + event.translationY,
        -adjustedMaxY,
        maxTranslateY
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const mapBackgroundTapGesture = Gesture.Tap()
    .maxDuration(600)
    .onEnd((event) => {
      runOnJS(handleMapTap)(event as unknown as TapGestureEvent);
    });

  const combinedGesture = Gesture.Exclusive(
    Gesture.Simultaneous(pinchGesture, panGesture),
    mapBackgroundTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const caravanStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: CARAVAN_SIZE,
    height: CARAVAN_SIZE,
    left: caravanX.value - CARAVAN_SIZE / 2,
    top: caravanY.value - CARAVAN_SIZE / 2,
    transform: [
      { scaleX: isFacingLeft ? -1 : 1 },
    ],
    zIndex: 30,
  }));

  // Helper functions remain the same
  const findTownAtPosition = (mapX: number, mapY: number): Town | null => {
    const tapThreshold = 5;
    for (const town of towns) {
      const distanceX = Math.abs(town.x - mapX);
      const distanceY = Math.abs(town.y - mapY);
      if (distanceX <= tapThreshold && distanceY <= tapThreshold) {
        return town;
      }
    }
    return null;
  };

  const onTownPress = (town: Town) => {
    console.log(`Town selected: ${town.name}`);
    setIsTownPopup(true);
    setSelectedTown(town);
  };

  const townAction = (town: Town) => {
    setSelectedTown(null);
    setIsTownPopup(false);
    setTargetPosition({ x: town.x, y: town.y });
    setIsMoving(true);
  };

  const getTownImage = (town: Town) => {
    return townImages[town.stage] || townImages.default;
  };

  // Simple debug overlay
  const renderDebugOverlay = () => {
    if (!lastCalculatedMapPosition) return null;
    
    return (
      <View style={{
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: 'rgba(0, 0, 255, 0.5)',
        left: lastCalculatedMapPosition.x - 7,
        top: lastCalculatedMapPosition.y - 7,
        zIndex: 15,
      }} />
    );
  };

  return (
    <View style={styles.container} ref={mapContainerRef}>
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[styles.animatedContainer, animatedStyle]}>
          <ImageBackground
            source={require('@/assets/images/welsh-map-background.png')}
            style={[styles.imageBackground, { width: mapWidth, height: mapHeight }]}
            resizeMode="contain"
          >
            {/* Town markers */}
            {towns.map((town, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.townMarker, 
                  { 
                    
                    top: town.y * scaleY - ICON_HALF,
                    left: town.x * scaleX - ICON_HALF,
                    // backgroundColor: getStageColor(town.stage),
                    zIndex: 20
                  }
                ]}
                onPress={() => onTownPress(town)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image
                  source={getTownImage(town)}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
            
            <Animated.Image
              source={require('@/assets/images/caravan_new.png')}
              style={caravanStyle}
              resizeMode="contain"
            />
          </ImageBackground>
        </Animated.View>
      </GestureDetector>
      
      <BottomSheet bottomSheetHeight={bottomSheetHeight} isBottomSheetUp={isTownPopup} setIsTownPopup={setIsTownPopup}>
        {selectedTown && (
          <TownInfo town={selectedTown} action={townAction} />
        )}
      </BottomSheet>
    </View>
  );
}

function getStageColor(stage: number): string {
  switch (stage) {
    case 0:
      return '#ccc';
    case 1:
      return '#ffcc00';
    case 2:
      return '#3399ff';
    case 3:
      return '#33cc66';
    default:
      return '#ccc';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Background color for areas not covered by the map
  },
  animatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  townMarker: {
    position: 'absolute',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    elevation: 5, // Android elevation
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  townText: {
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageBackground: {
    // Dimensions are set dynamically in the component
  },
});