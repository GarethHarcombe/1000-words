import { TouchableOpacity, TouchableOpacityProps } from './Themed';

export function SubmitButton(props: TouchableOpacityProps) {
  return <TouchableOpacity {...props} style={[props.style, { backgroundColor: '#aaa' }]} />;
}