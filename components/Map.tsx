import React, { useState, useRef } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  clamp,
} from 'react-native-reanimated';
import { Town } from '@/constants/Types';
import rawTowns from '@/data/welsh-towns.json';
import BottomSheet from './BottomSheet';
import TownInfo from './mapComponents/townInfo';
import Caravan from './mapComponents/caravan';

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
  "1": require('@/assets/images/good-icons/CHURCH.png'),
  "2": require('@/assets/images/town-icons/armchair.png'),
  "3": require('@/assets/images/town-icons/love_spoons.png'),
  "4": require('@/assets/images/town-icons/llanfairpg.png'),
  "5": require('@/assets/images/town-icons/welsh_cakes.png'),
  "6": require('@/assets/images/town-icons/portmeirion.png'),
  "7": require('@/assets/images/town-icons/pembrokeshire-coast.png'),
  "8": require('@/assets/images/town-icons/st-davids.png'),
  "9": require('@/assets/images/town-icons/swansea.png'),
  "10": require('@/assets/images/town-icons/cardiff.png'),
  "default": require('@/assets/images/adaptive-icon.png'),
};

const { width, height } = Dimensions.get('window');
const viewportWidth = width;
const viewportHeight = height;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Original image aspect ratio
const imgWidth = 2481;
const imgHeight = 3508;
const IMAGE_ASPECT_RATIO = imgWidth / imgHeight;

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

// Town data
const towns: Town[] = rawTowns.map(town => ({ ...town })).slice(0, 5);

const bottomSheetHeight = height * 0.5;

export default function Map() {
  const mapContainerRef = useRef(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Caravan state
  const [targetPosition, setTargetPosition] = useState<Position>({ x: 150, y: 150 });
  const [isMoving, setIsMoving] = useState(false);

  // Selected town state
  const [selectedTown, setSelectedTown] = useState<Town | null>(null);
  const [isTownPopup, setIsTownPopup] = useState(false);

  // Debug state
  const [lastCalculatedMapPosition, setLastCalculatedMapPosition] = useState<Position | null>(null);

  const handleMapTap = (event: TapGestureEvent) => {
    if (selectedTown) {
      setIsTownPopup(false);
      setSelectedTown(null);
    }

    const mapX = Math.round(event.x);
    const mapY = Math.round(event.y);

    if (mapX < 0 || mapX > mapWidth || mapY < 0 || mapY > mapHeight) {
      return;
    }

    const tappedTown = findTownAtPosition(mapX, mapY);
    if (tappedTown) {
      onTownPress(tappedTown);
      return;
    }

    setLastCalculatedMapPosition({ x: mapX, y: mapY });
    setTargetPosition({ x: mapX, y: mapY });
    setIsMoving(true);
  };

  // Gestures
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
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
      handleMapTap(event as unknown as TapGestureEvent);
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
    setIsTownPopup(true);
    setSelectedTown(town);
    setTargetPosition({ x: town.x, y: town.y });
    setIsMoving(true);
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
                    zIndex: 20,
                  },
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

            {/* Caravan Component */}
            <Caravan
              targetPosition={targetPosition}
              isMoving={isMoving}
              setIsMoving={setIsMoving}
              scaleX={scaleX}
              scaleY={scaleY}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  imageBackground: {},
});
