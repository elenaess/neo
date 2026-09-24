import React,{useEffect,useRef} from 'react';
import {Animated} from 'react-native';
import {NavigationContainer,DefaultTheme} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TranslatorScreen from './src/screens/TranslatorScreen';
import DictionaryScreen from './src/screens/DictionaryScreen';
import VoiceScreen from './src/screens/VoiceScreen';
import {COLORS} from './src/theme';

const Tab=createBottomTabNavigator();
const icons={
  Tradutor:['translate','translate-variant'],
  Dicionário:['book-open-outline','book-open-page-variant'],
  Voz:['microphone-outline','microphone'],
};

function AnimatedTabIcon({route,focused,color,size}){
  const scale=useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    Animated.sequence([
      Animated.timing(scale,{toValue:focused?1.13:.96,duration:80,useNativeDriver:true}),
      Animated.timing(scale,{toValue:1,duration:80,useNativeDriver:true}),
    ]).start();
  },[focused,scale]);
  return <Animated.View style={{transform:[{scale}]}}>
    <MaterialCommunityIcons name={icons[route][focused?1:0]} color={color} size={size+2}/>
  </Animated.View>;
}

const navTheme={
  ...DefaultTheme,
  colors:{...DefaultTheme.colors,background:COLORS.cream,card:COLORS.paper,text:COLORS.ink,border:COLORS.line,primary:COLORS.orangeStrong},
};

export default function App(){
  return <NavigationContainer theme={navTheme}>
    <Tab.Navigator screenOptions={({route})=>({
      headerShown:false,
      tabBarHideOnKeyboard:true,
      tabBarActiveTintColor:COLORS.orangeStrong,
      tabBarInactiveTintColor:COLORS.muted,
      sceneStyle:{backgroundColor:COLORS.cream},
      tabBarStyle:{height:72,paddingTop:8,paddingBottom:10,borderTopColor:COLORS.line,backgroundColor:COLORS.paper},
      tabBarLabelStyle:{fontWeight:'700',fontSize:11},
      tabBarIcon:({color,size,focused})=><AnimatedTabIcon route={route.name} focused={focused} color={color} size={size}/>,
    })}>
      <Tab.Screen name="Tradutor" component={TranslatorScreen}/>
      <Tab.Screen name="Dicionário" component={DictionaryScreen}/>
      <Tab.Screen name="Voz" component={VoiceScreen}/>
    </Tab.Navigator>
  </NavigationContainer>;
}
