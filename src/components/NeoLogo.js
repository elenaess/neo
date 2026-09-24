import React from 'react';
import {View, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS} from '../theme';

export default function NeoLogo({size = 46}) {
  return (
    <View style={[styles.wrap, {width: size, height: size, borderRadius: size * 0.32}]}>
      <MaterialCommunityIcons name="web" size={size * 0.58} color="white" />
    </View>
  );
}
const styles = StyleSheet.create({wrap:{backgroundColor:COLORS.orange,alignItems:'center',justifyContent:'center'}});
