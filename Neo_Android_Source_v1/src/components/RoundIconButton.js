import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS} from '../theme';
export default function RoundIconButton({icon,onPress,size=48,active=false,accessibilityLabel}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({pressed})=>[styles.button,active&&styles.active,pressed&&styles.pressed,{width:size,height:size,borderRadius:size/2}]}><MaterialCommunityIcons name={icon} size={size*0.47} color={active?'#fff':COLORS.orangeStrong}/></Pressable>;
}
const styles=StyleSheet.create({button:{backgroundColor:COLORS.paper,borderWidth:1,borderColor:COLORS.line,alignItems:'center',justifyContent:'center'},active:{backgroundColor:COLORS.orange,borderColor:COLORS.orange},pressed:{opacity:.72}});
