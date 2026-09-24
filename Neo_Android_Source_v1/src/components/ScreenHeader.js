import React from 'react';
import {View,Text,StyleSheet} from 'react-native';
import NeoLogo from './NeoLogo';
import {COLORS} from '../theme';
export default function ScreenHeader({title,subtitle}) {
  return <View style={styles.row}><NeoLogo/><View style={styles.copy}><Text style={styles.title}>{title}</Text>{subtitle?<Text style={styles.sub}>{subtitle}</Text>:null}</View></View>;
}
const styles=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:18},copy:{flex:1},title:{fontSize:24,fontWeight:'800',color:COLORS.ink,letterSpacing:-.5},sub:{fontSize:12,color:COLORS.muted,marginTop:2}});
