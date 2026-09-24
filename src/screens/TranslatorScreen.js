import React,{useMemo,useState} from 'react';
import {View,Text,TextInput,Pressable,ScrollView,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SurfaceCard from '../components/SurfaceCard';
import ScreenHeader from '../components/ScreenHeader';
import {COLORS,RADIUS} from '../theme';
import {translatePtToNeo,translateNeoToPt} from '../engine/neoEngine';

export default function TranslatorScreen(){
  const [direction,setDirection]=useState('pt-neo');
  const [input,setInput]=useState('');
  const result=useMemo(()=>direction==='pt-neo'?translatePtToNeo(input):translateNeoToPt(input),[direction,input]);
  const swap=()=>{setInput(result.text||'');setDirection(x=>x==='pt-neo'?'neo-pt':'pt-neo')};

  return <SafeAreaView edges={['top']} style={styles.safe}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Tradutor" subtitle="Português e Neo, sem internet"/>
      <View style={styles.languageRow}>
        <Text style={styles.language}>{direction==='pt-neo'?'Português':'Neo'}</Text>
        <Pressable onPress={swap} style={({pressed})=>[styles.swap,pressed&&styles.pressed]}>
          <MaterialCommunityIcons name="swap-horizontal" size={24} color="#fff"/>
        </Pressable>
        <Text style={[styles.language,{textAlign:'right'}]}>{direction==='pt-neo'?'Neo':'Português'}</Text>
      </View>

      <SurfaceCard style={styles.editor}>
        <TextInput
          multiline
          value={input}
          onChangeText={setInput}
          placeholder={direction==='pt-neo'?'Escreva em português…':'Escreva em Neo…'}
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />
        <View style={styles.editorFoot}>
          <Text style={styles.label}>Entrada</Text>
          {input?<Pressable onPress={()=>setInput('')} style={({pressed})=>[styles.clear,pressed&&styles.pressed]}>
            <MaterialCommunityIcons name="close" size={18} color={COLORS.ink}/>
            <Text style={styles.clearText}>Limpar</Text>
          </Pressable>:null}
        </View>
      </SurfaceCard>

      <SurfaceCard style={[styles.editor,styles.outputCard]} delay={20}>
        <Text selectable style={styles.output}>{result.text||'A tradução aparece aqui.'}</Text>
        <View style={styles.editorFoot}>
          <Text style={styles.label}>Saída</Text>
          <MaterialCommunityIcons name="content-copy" size={19} color={COLORS.orangeStrong}/>
        </View>
      </SurfaceCard>

      {result.analysis?.length?<View style={styles.analysis}>
        <Text style={styles.sectionTitle}>Análise</Text>
        <View style={styles.chips}>
          {result.analysis.filter(x=>x.type!=='punct').slice(0,12).map((x,i)=><View key={i} style={styles.chip}>
            <Text style={styles.chipNeo}>{x.neo||x.neoBase||x.raw}</Text>
            <Text style={styles.chipPt}>{x.pt||x.lemma||x.entry?.pt||x.raw} · {x.pos||x.type}</Text>
          </View>)}
        </View>
      </View>:null}
    </ScrollView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.cream},
  page:{padding:18,paddingBottom:36},
  languageRow:{flexDirection:'row',alignItems:'center',marginBottom:12},
  language:{flex:1,fontSize:17,fontWeight:'800',color:COLORS.ink},
  swap:{width:48,height:48,borderRadius:18,backgroundColor:COLORS.orange,alignItems:'center',justifyContent:'center'},
  pressed:{opacity:.72,transform:[{scale:.97}]},
  editor:{marginBottom:12,padding:0,overflow:'hidden'},
  input:{minHeight:160,padding:18,fontSize:21,color:COLORS.ink,textAlignVertical:'top'},
  output:{minHeight:130,padding:18,fontSize:21,color:COLORS.ink},
  outputCard:{backgroundColor:'#FFFDFC'},
  editorFoot:{borderTopWidth:1,borderTopColor:COLORS.line,paddingHorizontal:16,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  label:{fontSize:12,color:COLORS.muted,fontWeight:'700'},
  clear:{flexDirection:'row',gap:6,alignItems:'center',backgroundColor:COLORS.orangeSoft,paddingHorizontal:10,paddingVertical:7,borderRadius:RADIUS.sm},
  clearText:{color:COLORS.ink,fontWeight:'700'},
  analysis:{marginTop:6},
  sectionTitle:{fontSize:17,fontWeight:'800',color:COLORS.ink,marginBottom:10},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:8},
  chip:{backgroundColor:COLORS.orangeSoft,borderRadius:16,paddingHorizontal:12,paddingVertical:10},
  chipNeo:{fontWeight:'800',color:COLORS.ink},
  chipPt:{fontSize:12,color:COLORS.muted,marginTop:2},
});
