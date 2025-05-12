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
} from 'react-native-reanimated';
import { Town } from '@/constants/Types'
import rawTowns from '@/data/welsh-towns.json'
import BottomSheet from './BottomSheet'
import TownInfo from './mapComponents/TownInfo'


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

// Town data with descriptions
const towns: Town[] = rawTowns.map(town => ({
  ...town,
  // numCorrect: 0,
  // streak: 0,
  // stage: 0,
}));

export default function Map() {
  const mapContainerRef = useRef(null);
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Bottom sheet animation value
  const bottomSheetHeight = height * 0.4; // 40% of screen height
  // const bottomSheetTranslateY = useSharedValue(bottomSheetHeight);

  // Caravan state and animation values
  const [caravanPosition, setCaravanPosition] = useState<Position>({ x: 150, y: 150 });
  const [targetPosition, setTargetPosition] = useState<Position>({ x: 150, y: 150 });
  const [isMoving, setIsMoving] = useState(false);
  const [isFacingLeft, setIsFacingLeft] = useState(false);
  const caravanX = useSharedValue(150);
  const caravanY = useSharedValue(150);
  
  // Selected town state
  const [selectedTown, setSelectedTown] = useState<Town | null>(null);
  const [isTownPopup, setIsTownPopup] = useState(false);
  
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

  useEffect(() => {
    if(selectedTown)
    {
      setIsTownPopup(true);
    } else {
      setIsTownPopup(false);
    }
  }, [selectedTown])

  // Setting zIndex might not be sufficient on Android, so we need to improve tap handling
  // This function checks if a touch event is on a town and returns the town if found
  const findTownAtPosition = (mapX: number, mapY: number): Town | null => {
    // Create a larger hit area for towns to make them easier to tap
    const tapThreshold = 30; // pixels
    
    for (const town of towns) {
      const distanceX = Math.abs(town.x - mapX);
      const distanceY = Math.abs(town.y - mapY);
      
      // Check if tap is within the threshold distance of the town
      if (distanceX <= tapThreshold && distanceY <= tapThreshold) {
        return town;
      }
    }
    
    return null;
  };

  // Handle map tap to set caravan destination
  const handleMapTap = (event: TapGestureEvent) => {
    // Close the town popup if open
    if (selectedTown) {
      setIsTownPopup(false);
      return;
    }
    
    // Store raw tap location for debugging
    setLastTap({ x: event.x, y: event.y });
    
    // Calculate the center of the screen
    const screenCenterX = viewportWidth / 2;
    const screenCenterY = viewportHeight / 2;
    
    // Calculate how much the map has been moved from its default centered position
    const mapCenterOffsetX = translateX.value;
    const mapCenterOffsetY = translateY.value;
    
    // Calculate where the tap occurred relative to the map's origin
    const mapX = (event.x - screenCenterX - mapCenterOffsetX) / scale.value + (mapWidth / 2);
    const mapY = (event.y - screenCenterY - mapCenterOffsetY) / scale.value + (mapHeight / 2);
    
    // Check if tap is on a town
    const tappedTown = findTownAtPosition(mapX, mapY);
    
    // If tapped on a town, open its details instead of moving the caravan
    if (tappedTown) {
      console.log(`Map tap detected on town: ${tappedTown.name}`);
      onTownPress(tappedTown);
      return;
    }
    
    // Store calculated map position for debugging
    setLastCalculatedMapPosition({ x: mapX, y: mapY });
    
    // Set the new target position in map coordinates
    setTargetPosition({ x: mapX, y: mapY });
    setIsMoving(true);
  };

  // Function to handle town selection
  const handleTownSelect = (town: Town) => {
    setSelectedTown(town);
    setIsTownPopup(true);
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
      // Don't allow panning when bottom sheet is open
      if (selectedTown) return;
      
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


  // Create a comprehensive touch handler for our map background tap
  const mapBackgroundTapGesture = Gesture.Tap()
    .maxDuration(600) // Allow for slightly longer press to be recognized as tap
    .onStart(() => {
      // On Android, capturing the start can help with touch handling
      return false; // Don't consume the event yet
    })
    .onEnd((event) => {
      // Process the tap on end to avoid interfering with other gestures
      runOnJS(handleMapTap)(event as unknown as TapGestureEvent);
    });
    
  // Combine gestures with proper priority
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

  // New function to explicitly log and handle town selection
  const onTownPress = (town: Town) => {
    console.log(`Town selected: ${town.name}`);
    handleTownSelect(town);
  };

  const townAction = (town: Town) => {
    setSelectedTown(null);
    // Set caravan to move to this town
    setTargetPosition({ x: town.x, y: town.y });
    setIsMoving(true);
  }

  return (
    <View style={styles.container} ref={mapContainerRef}>
      {/* Main map layer with gestures */}
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[styles.animatedContainer, animatedStyle]}>
          <ImageBackground
            source={require('@/assets/images/welsh-map-background.jpeg')}
            style={[styles.imageBackground, { width: mapWidth, height: mapHeight }]}
            resizeMode="contain"
          >
            {/* Debug map position indicator (moves with the map) */}
            {lastCalculatedMapPosition && <View style={mapPositionIndicator} />}
            
            {/* Caravan image */}
            <Animated.Image
              source={require('@/assets/images/caravan.jpg')}
              style={caravanStyle}
              resizeMode="contain"
            />
            
            {/* Town markers are back in the main view but we'll use z-index to ensure proper interaction */}
            {towns.map((town, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.townMarker, 
                  { 
                    top: town.y, 
                    left: town.x, 
                    backgroundColor: getStageColor(town.stage),
                    zIndex: 20 // Ensure towns are above map elements but below UI
                  }
                ]}
                onPress={() => onTownPress(town)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Make touch target larger
              >
                <Text style={styles.townText}>{town.name}</Text>
              </TouchableOpacity>
            ))}
          </ImageBackground>
        </Animated.View>
      </GestureDetector>
      
      {/* Fixed debug overlay for raw tap position */}
      {renderDebugOverlay()}
      
      {/* Fixed debug overlay for raw tap position */}
      {renderDebugOverlay()}
      
      {/* Bottom sheet for town details */}
      <BottomSheet bottomSheetHeight={bottomSheetHeight} isBottomSheetUp={isTownPopup} setIsTownPopup={setIsTownPopup} >
          
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
    paddingHorizontal: 8,
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