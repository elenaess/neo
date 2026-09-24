import React,{useMemo,useRef,useState} from 'react';
import {View,Text,Pressable,StyleSheet,PermissionsAndroid,Platform,Animated} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import {COLORS} from '../theme';
import {translatePtToNeo} from '../engine/neoEngine';
import {loadPortugueseModel,startListening,stopListening,subscribeResults,subscribePartialResults,subscribeErrors} from '../speech/voskService';

async function ensureMicrophonePermission(){
  if(Platform.OS!=='android') return true;
  const result=await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,{
    title:'Microfone para tradução',
    message:'O Neo usa o microfone somente para reconhecer sua fala em português no próprio aparelho.',
    buttonPositive:'Permitir',
    buttonNegative:'Agora não',
  });
  return result===PermissionsAndroid.RESULTS.GRANTED;
}

export default function VoiceScreen(){
  const [ready,setReady]=useState(false);
  const [listening,setListening]=useState(false);
  const [text,setText]=useState('');
  const [partial,setPartial]=useState('');
  const [error,setError]=useState('');
  const pulse=useRef(new Animated.Value(1)).current;
  const speech=text||partial;
  const translation=useMemo(()=>translatePtToNeo(speech).text,[speech]);

  React.useEffect(()=>{
    let resultSub,partialSub,errorSub;
    let mounted=true;
    loadPortugueseModel()
      .then(()=>{
        if(!mounted) return;
        setReady(true);
        resultSub=subscribeResults(value=>{setText(value);setPartial('');});
        partialSub=subscribePartialResults(value=>setPartial(value||''));
        errorSub=subscribeErrors(value=>{if(value)setError(String(value));});
      })
      .catch(e=>setError(String(e)));
    return()=>{
      mounted=false;
      resultSub?.remove?.();
      partialSub?.remove?.();
      errorSub?.remove?.();
      stopListening().catch(()=>{});
    };
  },[]);

  React.useEffect(()=>{
    if(!listening){pulse.stopAnimation();pulse.setValue(1);return;}
    const loop=Animated.loop(Animated.sequence([
      Animated.timing(pulse,{toValue:1.045,duration:80,useNativeDriver:true}),
      Animated.timing(pulse,{toValue:1,duration:80,useNativeDriver:true}),
    ]));
    loop.start();
    return()=>loop.stop();
  },[listening,pulse]);

  const toggle=async()=>{
    try{
      setError('');
      if(listening){
        await stopListening();
        setListening(false);
        setPartial('');
        return;
      }
      const allowed=await ensureMicrophonePermission();
      if(!allowed){setError('Permissão do microfone não concedida.');return;}
      setText('');
      setPartial('');
      await startListening();
      setListening(true);
    }catch(e){
      setListening(false);
      setError(String(e));
    }
  };

  const status=error?error:(ready?(listening?'Ouvindo… fale em português':'Toque para falar'):'Carregando modelo de voz…');

  return <SafeAreaView edges={['top']} style={styles.safe}>
    <View style={styles.page}>
      <ScreenHeader title="Voz" subtitle="Reconhecimento em português, offline"/>
      <SurfaceCard style={styles.voiceCard}>
        <View style={styles.wave}><View style={styles.barSmall}/><View style={styles.bar}/><View style={styles.barTall}/><View style={styles.bar}/><View style={styles.barSmall}/></View>
        <Animated.View style={{transform:[{scale:pulse}]}}>
          <Pressable disabled={!ready} onPress={toggle} style={({pressed})=>[styles.mic,listening&&styles.micActive,!ready&&styles.disabled,pressed&&styles.pressed]}>
            <MaterialCommunityIcons name={listening?'stop':'microphone'} size={40} color="#fff"/>
          </Pressable>
        </Animated.View>
        <Text style={[styles.status,error&&styles.statusError]}>{status}</Text>
      </SurfaceCard>

      <SurfaceCard style={styles.textCard} delay={20}>
        <View style={styles.labelRow}><MaterialCommunityIcons name="text-box-outline" size={20} color={COLORS.orangeStrong}/><Text style={styles.label}>Português</Text></View>
        <Text style={styles.big}>{speech||'Sua fala aparece aqui.'}</Text>
      </SurfaceCard>
      <SurfaceCard style={styles.textCard} delay={40}>
        <View style={styles.labelRow}><MaterialCommunityIcons name="translate" size={20} color={COLORS.orangeStrong}/><Text style={styles.label}>Neo</Text></View>
        <Text style={styles.big}>{translation||'A tradução aparece aqui.'}</Text>
      </SurfaceCard>
    </View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.cream},
  page:{flex:1,padding:18},
  voiceCard:{alignItems:'center',paddingVertical:30},
  wave:{height:62,flexDirection:'row',alignItems:'center',gap:7,marginBottom:20},
  barSmall:{width:5,height:16,borderRadius:4,backgroundColor:COLORS.orangeSoft},
  bar:{width:5,height:32,borderRadius:4,backgroundColor:COLORS.orange},
  barTall:{width:5,height:52,borderRadius:4,backgroundColor:COLORS.orangeStrong},
  mic:{width:88,height:88,borderRadius:44,backgroundColor:COLORS.orange,alignItems:'center',justifyContent:'center'},
  micActive:{backgroundColor:COLORS.orangeStrong},
  disabled:{opacity:.45},
  pressed:{opacity:.8},
  status:{marginTop:14,color:COLORS.muted,fontWeight:'700',textAlign:'center',lineHeight:20},
  statusError:{color:COLORS.danger},
  textCard:{marginTop:12,minHeight:116},
  labelRow:{flexDirection:'row',alignItems:'center',gap:7},
  label:{fontSize:12,fontWeight:'800',color:COLORS.muted},
  big:{fontSize:20,color:COLORS.ink,marginTop:12},
});
