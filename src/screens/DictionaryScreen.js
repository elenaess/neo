import React,{useMemo,useState} from 'react';
import {View,Text,TextInput,Pressable,FlatList,ScrollView,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import {COLORS,RADIUS} from '../theme';
import {searchLexicon,DOMAINS} from '../engine/neoEngine';

const featured=['Todos','Saudações/Conversa','Internet/Tecnologia','Acadêmico/Geral','Acadêmico/Psicologia','Acadêmico/Filosofia','Sexo/Relacionamentos','Gramática/Numerais'];

export default function DictionaryScreen(){
  const [query,setQuery]=useState('');
  const [domain,setDomain]=useState('Todos');
  const rows=useMemo(()=>searchLexicon(query,{domain:domain==='Todos'?null:domain}).slice(0,140),[query,domain]);
  const filters=featured.filter(x=>x==='Todos'||DOMAINS.includes(x));

  const header=<View>
    <ScreenHeader title="Dicionário" subtitle="10 mil+ entradas offline"/>
    <View style={styles.search}>
      <MaterialCommunityIcons name="magnify" size={22} color={COLORS.muted}/>
      <TextInput value={query} onChangeText={setQuery} placeholder="Busque em Português ou Neo" placeholderTextColor={COLORS.muted} style={styles.searchInput}/>
      {query?<Pressable onPress={()=>setQuery('')}><MaterialCommunityIcons name="close-circle" size={21} color={COLORS.orangeStrong}/></Pressable>:null}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {filters.map(item=><Pressable key={item} onPress={()=>setDomain(item)} style={({pressed})=>[styles.filter,domain===item&&styles.filterActive,pressed&&styles.pressed]}>
        <Text style={[styles.filterText,domain===item&&styles.filterTextActive]}>{item.replace('Acadêmico/','').replace('Gramática/','')}</Text>
      </Pressable>)}
    </ScrollView>
    <View style={styles.infoRow}>
      <Text style={styles.infoStrong}>{rows.length} resultados</Text>
      <Text style={styles.infoMuted}>{domain==='Todos'?'todos os domínios':domain.replace('Acadêmico/','').replace('Gramática/','')}</Text>
    </View>
  </View>;

  return <SafeAreaView edges={['top']} style={styles.safe}>
    <FlatList
      data={rows}
      keyExtractor={(x,i)=>`${x.neo}-${i}`}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.page}
      ListHeaderComponent={header}
      renderItem={({item,index})=><SurfaceCard style={styles.row} delay={Math.min(index,6)*10}>
        <View style={styles.rowTop}>
          <Text style={styles.neo}>{item.neo}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.classe}</Text></View>
        </View>
        <Text style={styles.pt}>{item.pt}</Text>
        <Text style={styles.meta}>{item.dominio} · {item.registro||'neutro'} · raiz {item.raiz}</Text>
      </SurfaceCard>}
      ListEmptyComponent={<SurfaceCard style={styles.empty}>
        <MaterialCommunityIcons name="book-search-outline" size={44} color={COLORS.orange}/>
        <Text style={styles.emptyTitle}>Nada encontrado</Text>
        <Text style={styles.emptyText}>Tente outra palavra ou outro domínio.</Text>
      </SurfaceCard>}
    />
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.cream},
  page:{padding:18,paddingBottom:36},
  search:{height:54,borderRadius:20,backgroundColor:COLORS.paper,borderWidth:1,borderColor:COLORS.line,paddingHorizontal:15,flexDirection:'row',alignItems:'center',gap:10},
  searchInput:{flex:1,fontSize:16,color:COLORS.ink},
  filters:{gap:8,paddingVertical:12,paddingRight:10},
  filter:{paddingHorizontal:13,paddingVertical:8,borderRadius:999,backgroundColor:COLORS.paper,borderWidth:1,borderColor:COLORS.line},
  filterActive:{backgroundColor:COLORS.orange,borderColor:COLORS.orange},
  filterText:{fontSize:12,fontWeight:'700',color:COLORS.muted},
  filterTextActive:{color:'#fff'},
  pressed:{opacity:.72,transform:[{scale:.98}]},
  infoRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:9},
  infoStrong:{fontSize:12,fontWeight:'800',color:COLORS.ink},
  infoMuted:{fontSize:12,color:COLORS.muted},
  row:{marginBottom:10,paddingVertical:16},
  rowTop:{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'},
  neo:{fontSize:20,fontWeight:'800',color:COLORS.ink},
  pt:{fontSize:16,color:COLORS.ink,marginTop:4},
  meta:{fontSize:12,color:COLORS.muted,marginTop:6,lineHeight:18},
  badge:{backgroundColor:COLORS.orangeSoft,paddingHorizontal:8,paddingVertical:4,borderRadius:RADIUS.sm},
  badgeText:{fontSize:10,color:COLORS.orangeStrong,fontWeight:'800'},
  empty:{alignItems:'center',paddingVertical:30},
  emptyTitle:{fontSize:17,fontWeight:'800',color:COLORS.ink,marginTop:10},
  emptyText:{color:COLORS.muted,marginTop:4,textAlign:'center'},
});
