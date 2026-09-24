import React from 'react';
import {View, StyleSheet} from 'react-native';
import {COLORS, RADIUS, SHADOW} from '../theme';
export default function SurfaceCard({children, style}) {
  return <View style={[styles.card, style]}>{children}</View>;
}
const styles=StyleSheet.create({card:{backgroundColor:COLORS.paper,borderWidth:1,borderColor:COLORS.line,borderRadius:RADIUS.lg,padding:18,...SHADOW}});
