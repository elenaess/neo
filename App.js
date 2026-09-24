import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TranslatorScreen from './src/screens/TranslatorScreen';
import DictionaryScreen from './src/screens/DictionaryScreen';
import VoiceScreen from './src/screens/VoiceScreen';
import {COLORS} from './src/theme';

const Tab=createBottomTabNavigator();
const icons={Tradutor:'translate',Dicionário:'book-open-variant',Voz:'microphone'};
export default function App(){
  return <NavigationContainer><Tab.Navigator screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:COLORS.orangeStrong,tabBarInactiveTintColor:COLORS.muted,tabBarStyle:{height:68,paddingTop:8,paddingBottom:9,borderTopColor:COLORS.line,backgroundColor:COLORS.paper},tabBarLabelStyle:{fontWeight:'700',fontSize:11},tabBarIcon:({color,size})=><MaterialCommunityIcons name={icons[route.name]} color={color} size={size+2}/>})}>
    <Tab.Screen name="Tradutor" component={TranslatorScreen}/>
    <Tab.Screen name="Dicionário" component={DictionaryScreen}/>
    <Tab.Screen name="Voz" component={VoiceScreen}/>
  </Tab.Navigator></NavigationContainer>;
}
