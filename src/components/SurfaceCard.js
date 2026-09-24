import React,{useEffect,useRef} from 'react';
import {Animated,StyleSheet} from 'react-native';
import {COLORS,RADIUS,SHADOW} from '../theme';

export default function SurfaceCard({children,style,delay=0}){
  const opacity=useRef(new Animated.Value(0)).current;
  const translateY=useRef(new Animated.Value(6)).current;

  useEffect(()=>{
    Animated.parallel([
      Animated.timing(opacity,{toValue:1,duration:80,delay,useNativeDriver:true}),
      Animated.timing(translateY,{toValue:0,duration:80,delay,useNativeDriver:true}),
    ]).start();
  },[delay,opacity,translateY]);

  return <Animated.View style={[styles.card,style,{opacity,transform:[{translateY}]}]}>{children}</Animated.View>;
}
const styles=StyleSheet.create({card:{backgroundColor:COLORS.paper,borderWidth:1,borderColor:COLORS.line,borderRadius:RADIUS.lg,padding:18,...SHADOW}});
