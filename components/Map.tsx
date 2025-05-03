import React, { useState, useEffect, useRef } from 'react';
import { View, ImageBackground, StyleSheet, Dimensions, Text, TouchableOpacity, Image } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  clamp,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

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

const { width, height } = Dimensions.get('window');
const viewportWidth = width;
const viewportHeight = height;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Define the original image aspect ratio (width/height)
const IMAGE_ASPECT_RATIO = 205 / 246; // Your welsh-map-background.jpeg aspect ratio

// Calculate initial map dimensions
const mapHeight = viewportHeight;
const mapWidth = mapHeight * IMAGE_ASPECT_RATIO;

// Navbar adjustment
const NAVBAR_HEIGHT = 40;
const EFFECTIVE_HEIGHT = viewportHeight;

// Caravan settings
const CARAVAN_SIZE = 40;
const CARAVAN_SPEED = 100; // pixels per second (in unscaled map coordinates)

const towns = [
  { name: 'Aberlyn', x: 100, y: 200, stage: 0 },
  { name: 'Cardale', x: 250, y: 400, stage: 1 },
  { name: 'Dunreach', x: 180, y: 650, stage: 2 },
  { name: 'Fynmere', x: 300, y: 300, stage: 3 },
  // Add more towns here
];

export default function Map() {
  const mapContainerRef = useRef(null);
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Caravan state and animation values
  const [caravanPosition, setCaravanPosition] = useState<Position>({ x: 150, y: 150 });
  const [targetPosition, setTargetPosition] = useState<Position>({ x: 150, y: 150 });
  const [isMoving, setIsMoving] = useState(false);
  const [isFacingLeft, setIsFacingLeft] = useState(false);
  const caravanX = useSharedValue(150);
  const caravanY = useSharedValue(150);
  
  // Debug state
  const [lastTap, setLastTap] = useState<Position | null>(null);
  const [lastCalculatedMapPosition, setLastCalculatedMapPosition] = useState<Position | null>(null);
  
  // Calculate the distance and move the caravan
  useEffect(() => {
    if (isMoving) {
      const dx = targetPosition.x - caravanPosition.x;
      const dy = targetPosition.y - caravanPosition.y;
      
      // Determine facing direction based only on horizontal movement
      if (dx < 0) {
        setIsFacingLeft(true);
      } else if (dx > 0) {
        setIsFacingLeft(false);
      }
      // If dx is 0, keep the current direction
      
      // Calculate the straight-line distance in map coordinates
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate duration based on distance and speed - consistent regardless of scale
      const duration = (distance / CARAVAN_SPEED) * 1000;
      
      // Animate the caravan to the target position with consistent speed
      caravanX.value = withTiming(targetPosition.x, { 
        duration,
        easing: Easing.linear
      }, (finished) => {
        if (finished) {
          runOnJS(setIsMoving)(false);
          runOnJS(setCaravanPosition)(targetPosition);
        }
      });
      
      caravanY.value = withTiming(targetPosition.y, { 
        duration,
        easing: Easing.linear
      });
    }
  }, [targetPosition, isMoving]);

  // Handle map tap to set caravan destination
  const handleMapTap = (event: TapGestureEvent) => {
    // Store raw tap location for debugging
    setLastTap({ x: event.x, y: event.y });
    
    // FIXED COORDINATE TRANSFORMATION
    // This is the critical fix for the coordinate system mismatch issue
    
    // Calculate the center of the screen
    const screenCenterX = viewportWidth / 2;
    const screenCenterY = viewportHeight / 2;
    
    // Calculate how much the map has been moved from its default centered position
    // This is where the problem was - we need to correctly calculate map position
    const mapCenterOffsetX = translateX.value;
    const mapCenterOffsetY = translateY.value;
    
    // Calculate where the tap occurred relative to the map's origin
    // The important part is accounting for both translation and scale correctly
    const mapX = (event.x - screenCenterX - mapCenterOffsetX) / scale.value + (mapWidth / 2);
    const mapY = (event.y - screenCenterY - mapCenterOffsetY) / scale.value + (mapHeight / 2);
    
    // Store calculated map position for debugging
    setLastCalculatedMapPosition({ x: mapX, y: mapY });
    
    // Set the new target position in map coordinates
    setTargetPosition({ x: mapX, y: mapY });
    setIsMoving(true);
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const scaledMapWidth = mapWidth * scale.value;
      const scaledMapHeight = mapHeight * scale.value;
      
      // Calculate the boundaries to ensure map stays visible
      const horizontalExcess = Math.max(0, scaledMapWidth - viewportWidth);
      const verticalExcess = Math.max(0, scaledMapHeight - EFFECTIVE_HEIGHT);
      
      // Calculate maximum translations
      const maxTranslateX = horizontalExcess / 2;
      const minTranslateX = -maxTranslateX;
      const maxTranslateX2 = maxTranslateX;
      
      const maxTranslateY = verticalExcess / 2;
      const adjustedMaxY = maxTranslateY + (NAVBAR_HEIGHT / 2) * scale.value;
      
      translateX.value = clamp(
        savedTranslateX.value + event.translationX,
        minTranslateX,
        maxTranslateX2
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

  // Tap gesture for caravan movement
  const tapGesture = Gesture.Tap().onEnd((event) => {
    runOnJS(handleMapTap)(event as unknown as TapGestureEvent);
  });

  // Combine gestures with proper priority
  const combinedGesture = Gesture.Exclusive(
    Gesture.Simultaneous(pinchGesture, panGesture),
    tapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Animated style for the caravan
  const caravanStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      width: CARAVAN_SIZE,
      height: CARAVAN_SIZE,
      left: caravanX.value - CARAVAN_SIZE / 2,
      top: caravanY.value - CARAVAN_SIZE / 2,
      transform: [
        { scaleX: isFacingLeft ? -1 : 1 }, // Flip horizontally if facing left
      ],
      zIndex: 10, // Ensure caravan appears above other elements
    };
  });

  // Debug visualization
  const renderDebugOverlay = () => {
    if (!lastTap) return null;
    
    // Raw tap indicator (red)
    const tapIndicator = {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: 'rgba(255, 0, 0, 0.5)',
      left: lastTap.x - 5,
      top: lastTap.y - 5,
      zIndex: 1000,
    };
    
    return <View style={tapIndicator} />;
  };

  // Calculated position indicator (blue) - now part of the map
  const mapPositionIndicator = lastCalculatedMapPosition ? {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 0, 255, 0.5)',
    left: lastCalculatedMapPosition.x - 7, 
    top: lastCalculatedMapPosition.y - 7,
    zIndex: 15,
  } : null;

  return (
    <View style={styles.container} ref={mapContainerRef}>
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[styles.animatedContainer, animatedStyle]}>
          <ImageBackground
            source={require('@/assets/images/welsh-map-background.jpeg')}
            style={[styles.imageBackground, { width: mapWidth, height: mapHeight }]}
            resizeMode="contain"
          >
            {towns.map((town, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.townMarker, { top: town.y, left: town.x, backgroundColor: getStageColor(town.stage) }]}
                onPress={() => console.log(`Clicked ${town.name}`)}
              >
                <Text style={styles.townText}>{town.name}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Debug map position indicator (moves with the map) */}
            {lastCalculatedMapPosition && <View style={mapPositionIndicator} />}
            
            {/* Caravan image */}
            <Animated.Image
              source={require('@/assets/images/caravan.jpg')}
              style={caravanStyle}
              resizeMode="contain"
            />
          </ImageBackground>
        </Animated.View>
      </GestureDetector>
      
      {/* Fixed debug overlay for raw tap position */}
      {renderDebugOverlay()}
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
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  townText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  imageBackground: {
    // Dimensions are set dynamically in the component
  },
});