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
import Caravan, { Position } from './mapComponents/Caravan';

// Window and map geometry
const { width, height } = Dimensions.get('window');
const viewportWidth = width;
const viewportHeight = height;

const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Background image intrinsic size
const imgWidth = 2481;
const imgHeight = 3508;
const IMAGE_ASPECT_RATIO = imgWidth / imgHeight;

// Rendered size of the map at base scale 1
const mapHeight = viewportHeight;
const mapWidth = mapHeight * IMAGE_ASPECT_RATIO;

// Convert from image pixel coords -> rendered coords
const scaleX = mapWidth / imgWidth;
const scaleY = mapHeight / imgHeight;

// UI sizes
const ICON_SIZE = 20;
const ICON_HALF = ICON_SIZE / 2;

// Bottom sheet height
const bottomSheetHeight = height * 0.5;

// Town data
const towns: Town[] = rawTowns
  .map(t => ({ ...t }))
  .slice(0, 5);

// Per-stage icon mapping restored
const townImages: Record<string, any> = {
  '1': require('@/assets/images/good-icons/CHURCH.png'),
  '2': require('@/assets/images/town-icons/armchair.png'),
  '3': require('@/assets/images/town-icons/love_spoons.png'),
  '4': require('@/assets/images/town-icons/llanfairpg.png'),
  '5': require('@/assets/images/town-icons/welsh_cakes.png'),
  '6': require('@/assets/images/town-icons/portmeirion.png'),
  '7': require('@/assets/images/town-icons/pembrokeshire-coast.png'),
  '8': require('@/assets/images/town-icons/st-davids.png'),
  '9': require('@/assets/images/town-icons/swansea.png'),
  '10': require('@/assets/images/town-icons/cardiff.png'),
  default: require('@/assets/images/adaptive-icon.png'),
};

export default function Map() {
  const mapContainerRef = useRef(null);

  // Pan and zoom
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Caravan movement intent is owned by Map
  const [targetPosition, setTargetPosition] = useState<Position>({ x: 150, y: 150 });
  const [isMoving, setIsMoving] = useState(false);

  // Town selection state
  const [selectedTown, setSelectedTown] = useState<Town | null>(null);
  const [isTownPopup, setIsTownPopup] = useState(false);

  // Helpers to convert towns to rendered space
  const townToRendered = (t: Town) => ({
    x: t.x * scaleX,
    y: t.y * scaleY,
  });

  const getTownImage = (t: Town) => {
    // If stage can be number or string, coerce to string for lookup
    const key = String((t as any).stage ?? 'default');
    return townImages[key] || townImages.default;
  };

  // Hit testing in rendered space to match how markers are placed and caravan moves
  const findTownAtRenderedPoint = (rx: number, ry: number): Town | null => {
    const tapThreshold = 10; // pixels in rendered space
    for (const t of towns) {
      const { x, y } = townToRendered(t);
      if (Math.abs(x - rx) <= tapThreshold && Math.abs(y - ry) <= tapThreshold) {
        return t;
      }
    }
    return null;
  };

  // Taps arrive with event.x, event.y relative to the GestureDetector child.
  // Since we render markers and caravan in that same coordinate space,
  // we can use event.x, event.y directly as "rendered" coordinates.
  const handleMapTap = (event: { x: number; y: number }) => {
    if (selectedTown) {
      setIsTownPopup(false);
      setSelectedTown(null);
    }

    const rx = Math.round(event.x);
    const ry = Math.round(event.y);

    const tappedTown = findTownAtRenderedPoint(rx, ry);
    if (tappedTown) {
      onTownPress(tappedTown);
      return;
    }

    // Move caravan to tap location in rendered space
    setTargetPosition({ x: rx, y: ry });
    setIsMoving(true);
  };

  // Gestures
  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      const currentScale = scale.value;
      const scaledMapWidth = mapWidth * currentScale;
      const scaledMapHeight = mapHeight * currentScale;

      const horizontalExcess = Math.max(0, scaledMapWidth - viewportWidth);
      const verticalExcess = Math.max(0, scaledMapHeight - viewportHeight);

      const maxTranslateX = horizontalExcess / 2;
      const minTranslateX = -maxTranslateX;
      const maxTranslateY = verticalExcess / 2;

      translateX.value = clamp(
        savedTranslateX.value + e.translationX,
        minTranslateX,
        maxTranslateX
      );
      translateY.value = clamp(
        savedTranslateY.value + e.translationY,
        -maxTranslateY,
        maxTranslateY
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const mapBackgroundTapGesture = Gesture.Tap()
    .maxDuration(600)
    .onEnd(e => {
      handleMapTap(e as any);
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

  const onTownPress = (town: Town) => {
    setIsTownPopup(true);
    setSelectedTown(town);

    const rendered = townToRendered(town);
    setTargetPosition(rendered);
    setIsMoving(true);
  };

  // When user chooses to go to a town from the bottom sheet, move caravan to the town’s rendered position
  const townAction = (town: Town) => {
    setSelectedTown(null);
    setIsTownPopup(false);

    const rendered = townToRendered(town);
    setTargetPosition(rendered);
    setIsMoving(true);
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
            {/* Town markers in rendered coordinates */}
            {towns.map((town, idx) => {
              const rendered = townToRendered(town);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.townMarker,
                    {
                      top: rendered.y - ICON_HALF,
                      left: rendered.x - ICON_HALF,
                      zIndex: 20,
                    },
                  ]}
                  onPress={() => onTownPress(town)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Image
                    source={getTownImage(town)}
                    style={{ width: ICON_SIZE, height: ICON_SIZE }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              );
            })}

            {/* Caravan renders in the same space as markers */}
            <Caravan
              targetPosition={targetPosition}
              isMoving={isMoving}
              setIsMoving={setIsMoving}
              caravanSize={40}
              speed={100}
              initialPosition={{ x: 400, y: 150 }}
            />
          </ImageBackground>
        </Animated.View>
      </GestureDetector>

      <BottomSheet
        bottomSheetHeight={bottomSheetHeight}
        isBottomSheetUp={isTownPopup}
        setIsTownPopup={setIsTownPopup}
      >
        {selectedTown && <TownInfo town={selectedTown} action={townAction} />}
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
    backgroundColor: 'transparent',
  },
  imageBackground: {
    // width and height set dynamically
  },
});
