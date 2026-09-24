import React,{useMemo,useState} from 'react';
import {SafeAreaView,View,Text,Pressable,StyleSheet,PermissionsAndroid,Platform} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import {COLORS} from '../theme';
import {translatePtToNeo} from '../engine/neoEngine';
import {loadPortugueseModel,startListening,stopListening,subscribeResults} from '../speech/voskService';

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
  const [ready,setReady]=useState(false),[listening,setListening]=useState(false),[text,setText]=useState(''),[error,setError]=useState('');
  const translation=useMemo(()=>translatePtToNeo(text).text,[text]);

  React.useEffect(()=>{
    let sub;
    loadPortugueseModel()
      .then(()=>{setReady(true);sub=subscribeResults(setText)})
      .catch(e=>setError(String(e)));
    return()=>sub?.remove?.();
  },[]);

  const toggle=async()=>{
    try{
      setError('');
      if(listening){
        await stopListening();
        setListening(false);
        return;
      }
      const allowed=await ensureMicrophonePermission();
      if(!allowed){
        setError('Permissão do microfone não concedida.');
        return;
      }
      await startListening();
      setListening(true);
    }catch(e){
      setListening(false);
      setError(String(e));
    }
  };

  return <SafeAreaView style={styles.safe}><View style={styles.page}><ScreenHeader title="Voz" subtitle="Reconhecimento em português, offline"/>
    <SurfaceCard style={styles.voiceCard}><View style={styles.wave}><View style={styles.barSmall}/><View style={styles.bar}/><View style={styles.barTall}/><View style={styles.bar}/><View style={styles.barSmall}/></View><Pressable disabled={!ready} onPress={toggle} style={[styles.mic,listening&&styles.micActive,!ready&&styles.disabled]}><MaterialCommunityIcons name={listening?'stop':'microphone'} size={40} color="#fff"/></Pressable><Text style={styles.status}>{error?error:(ready?(listening?'Ouvindo…':'Toque para falar'):'Carregando modelo de voz…')}</Text></SurfaceCard>
    <SurfaceCard style={styles.textCard}><View style={styles.labelRow}><MaterialCommunityIcons name="text-box-outline" size={20} color={COLORS.orangeStrong}/><Text style={styles.label}>Português</Text></View><Text style={styles.big}>{text||'Sua fala aparece aqui.'}</Text></SurfaceCard>
    <SurfaceCard style={styles.textCard}><View style={styles.labelRow}><MaterialCommunityIcons name="translate" size={20} color={COLORS.orangeStrong}/><Text style={styles.label}>Neo</Text></View><Text style={styles.big}>{translation||'A tradução aparece aqui.'}</Text></SurfaceCard>
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:COLORS.cream},page:{flex:1,padding:18},voiceCard:{alignItems:'center',paddingVertical:30},wave:{height:62,flexDirection:'row',alignItems:'center',gap:7,marginBottom:20},barSmall:{width:5,height:16,borderRadius:4,backgroundColor:COLORS.orangeSoft},bar:{width:5,height:32,borderRadius:4,backgroundColor:COLORS.orange},barTall:{width:5,height:52,borderRadius:4,backgroundColor:COLORS.orangeStrong},mic:{width:86,height:86,borderRadius:43,backgroundColor:COLORS.orange,alignItems:'center',justifyContent:'center'},micActive:{backgroundColor:COLORS.orangeStrong},disabled:{opacity:.45},status:{marginTop:13,color:COLORS.muted,fontWeight:'700',textAlign:'center'},textCard:{marginTop:12,minHeight:116},labelRow:{flexDirection:'row',alignItems:'center',gap:7},label:{fontSize:12,fontWeight:'800',color:COLORS.muted},big:{fontSize:20,color:COLORS.ink,marginTop:12}});
