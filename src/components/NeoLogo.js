import React from 'react';
import {View,StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS,SHADOW} from '../theme';

export default function NeoLogo({size=52}){
  return <View style={[styles.wrap,{width:size,height:size,borderRadius:size*.31}]}>
    <View style={[styles.halo,{width:size*.78,height:size*.78,borderRadius:size}]}/>
    <View style={[styles.haloInner,{width:size*.58,height:size*.58,borderRadius:size}]}/>
    <MaterialCommunityIcons name="web" size={size*.56} color="#fff"/>
    <View style={[styles.spark,{width:size*.11,height:size*.11,borderRadius:size,top:size*.15,right:size*.15}]}/>
  </View>;
}
const styles=StyleSheet.create({
  wrap:{backgroundColor:COLORS.orange,alignItems:'center',justifyContent:'center',overflow:'hidden',...SHADOW},
  halo:{position:'absolute',borderWidth:1.2,borderColor:'rgba(255,255,255,.25)'},
  haloInner:{position:'absolute',borderWidth:1,borderColor:'rgba(255,255,255,.14)'},
  spark:{position:'absolute',backgroundColor:'rgba(255,255,255,.78)'},
});
