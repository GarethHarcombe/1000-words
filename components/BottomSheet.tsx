import { View, Text } from '@/components/Themed';
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import Colors from '@/constants/Colors';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { View as DefaultView } from 'react-native';



export type BottomSheetProps = {
        bottomSheetHeight: number;
        isBottomSheetUp: boolean;
        setIsTownPopup: (value: React.SetStateAction<boolean>) => void;
    } & DefaultView['props'];

    
export default function BottomSheet (props: BottomSheetProps) {
    const { style, bottomSheetHeight, isBottomSheetUp, setIsTownPopup, ...otherProps } = props;
    // const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

    const bottomSheetTranslateY = useSharedValue(bottomSheetHeight);


    // Function to close the bottom sheet
    const closeBottomSheet = () => {
        bottomSheetTranslateY.value = withSpring(bottomSheetHeight, {
        damping: 15,
        stiffness: 150,
    });
        setIsTownPopup(false);
    // setSelectedTown(null);
    };

    const openBottomSheet = () => {
        bottomSheetTranslateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
        });
    };

    useEffect(() => {
        if(isBottomSheetUp)
        {
            openBottomSheet();
        } else {
            closeBottomSheet();
        }
    }, [isBottomSheetUp])

    // Bottom sheet drag gesture
    const bottomSheetGesture = Gesture.Pan()
    .onUpdate((event) => {
        const newTranslateY = Math.max(0, event.translationY);
        bottomSheetTranslateY.value = newTranslateY;
    })
    .onEnd((event) => {
        if (event.translationY > bottomSheetHeight / 3) {
        // Close the sheet if dragged down more than 1/3
        runOnJS(closeBottomSheet)();
        } else {
        // Otherwise snap back to open position
        bottomSheetTranslateY.value = withSpring(0, {
            damping: 15,
            stiffness: 150,
        });
        }
    });

    // Animated style for the bottom sheet
    const bottomSheetStyle = useAnimatedStyle(() => {
        return {
        transform: [{ translateY: bottomSheetTranslateY.value }],
        };
    });
    
    return (
    <GestureDetector gesture={bottomSheetGesture}>
        <Animated.View style={[styles.bottomSheet, { height: bottomSheetHeight}, bottomSheetStyle]}>
            <View style={[styles.bottomSheetHandle]}/>
            
            <DefaultView style={[style]} {...otherProps} >


            </DefaultView>
        </Animated.View>
    </GestureDetector>
    )};

const styles = StyleSheet.create({
      // Bottom sheet styles
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 100,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    // marginBottom: 5,
  },
});