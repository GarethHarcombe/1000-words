import { TouchableOpacity, TouchableOpacityProps } from './Themed';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { StyleSheet } from 'react-native';



export function SubmitButton(props: TouchableOpacityProps) {
  return <TouchableOpacity {...props} style={[props.style, { backgroundColor: '#aaa' }]} />;
}


export function GradientButton(props: TouchableOpacityProps) {
  return (
    <TouchableOpacity {...props}>
      <LinearGradient
        colors={[
                    Colors['light']['upperButtonGradient'], 
                    Colors['light']['lowerButtonGradient']
                ]}
        style={[props.style, styles.gradient]}
      >
        {props.children}
      </LinearGradient>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
    gradient: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
});