import { Text, TextProps } from './Themed';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono' }]} />;
}

export function Heading(props: TextProps) {
  return <Text {...props} style={[props.style, { 
    fontWeight: 600,
    fontSize: 64,
   }]} />;
}
