import { Word } from '@/constants/Types';
import { View } from '@/components/Themed';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
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



type BottomSheetProps = {
    bottomSheetHeight: number;
    closeSheet: () => void;
};

export default function BottomSheet ({ bottomSheetHeight, closeSheet }: BottomSheetProps) {
    
    const bottomSheetTranslateY = useSharedValue(bottomSheetHeight);

    // Function to close the bottom sheet
      const closeBottomSheet = () => {
        bottomSheetTranslateY.value = withSpring(bottomSheetHeight, {
          damping: 15,
          stiffness: 150,
        });
        closeSheet();
        // setSelectedTown(null);
      };

    return (<GestureDetector gesture={bottomSheetGesture}>
            <Animated.View style={[styles.bottomSheet, bottomSheetStyle]}>
              <View style={styles.bottomSheetHandle} />
              
              {selectedTown && (
                <View style={styles.townDetailsContainer}>
                  <View style={styles.townHeader}>
                    <Text style={styles.townName}>{selectedTown.name}</Text>
                    <View style={[styles.stageBadge, { backgroundColor: getStageColor(selectedTown.stage) }]}>
                      <Text style={styles.stageText}>Checkpoint {selectedTown.stage}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.townImageContainer}>
                    <Image
                      source={selectedTown.image ? { uri: selectedTown.image } : getTownPlaceholderImage(selectedTown.stage)}
                      style={styles.townImage}
                      resizeMode="cover"
                    />
                  </View>
                  
                  <Text style={styles.townDescription}>{selectedTown.description}</Text>
                  
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        closeBottomSheet();
                        // Set caravan to move to this town
                        setTargetPosition({ x: selectedTown.x, y: selectedTown.y });
                        setIsMoving(true);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Travel Here</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.secondaryButton]}
                      onPress={closeBottomSheet}
                    >
                      <Text style={styles.secondaryButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>
          </GestureDetector>)
};

const styles = StyleSheet.create({
    stageBar: {
        height: 15,
        width: 55,
        flex: 1,
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
        position: 'relative',
      },
      
    progressGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        borderRadius: 10,
    }
});