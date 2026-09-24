import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {View,Text,TextInput,Pressable,FlatList,ScrollView,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import {COLORS,RADIUS} from '../theme';
import {searchLexiconPage,DOMAINS} from '../engine/neoEngine';

const PAGE_SIZE=40;
const featured=['Todos','Saudações/Conversa','Internet/Tecnologia','Acadêmico/Geral','Acadêmico/Psicologia','Acadêmico/Filosofia','Sexo/Relacionamentos','Gramática/Numerais','Lugares/Geografia','Sociedade/Cultura'];

function domainOption(domain){
  return domain==='Todos'?null:domain;
}

export default function DictionaryScreen(){
  const [query,setQuery]=useState('');
  const [domain,setDomain]=useState('Todos');
  const [rows,setRows]=useState([]);
  const [total,setTotal]=useState(0);
  const [hasMore,setHasMore]=useState(false);
  const offsetRef=useRef(0);
  const loadingMoreRef=useRef(false);

  const filters=useMemo(()=>featured.filter(x=>x==='Todos'||DOMAINS.includes(x)),[]);

  useEffect(()=>{
    const page=searchLexiconPage(query,{
      domain:domainOption(domain),
      offset:0,
      limit:PAGE_SIZE,
    });
    setRows(page.items);
    setTotal(page.total);
    setHasMore(page.hasMore);
    offsetRef.current=page.items.length;
    loadingMoreRef.current=false;
  },[query,domain]);

  const loadMore=useCallback(()=>{
    if(!hasMore||loadingMoreRef.current) return;
    loadingMoreRef.current=true;
    const page=searchLexiconPage(query,{
      domain:domainOption(domain),
      offset:offsetRef.current,
      limit:PAGE_SIZE,
    });
    offsetRef.current+=page.items.length;
    setRows(current=>[...current,...page.items]);
    setHasMore(page.hasMore);
    loadingMoreRef.current=false;
  },[query,domain,hasMore]);

  const header=<View>
    <ScreenHeader title="Dicionário" subtitle="11 mil+ entradas offline"/>
    <View style={styles.search}>
      <MaterialCommunityIcons name="magnify" size={22} color={COLORS.muted}/>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Busque em Português ou Neo"
        placeholderTextColor={COLORS.muted}
        style={styles.searchInput}
        autoCorrect={false}
      />
      {query?<Pressable onPress={()=>setQuery('')}><MaterialCommunityIcons name="close-circle" size={21} color={COLORS.orangeStrong}/></Pressable>:null}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {filters.map(item=><Pressable key={item} onPress={()=>setDomain(item)} style={({pressed})=>[styles.filter,domain===item&&styles.filterActive,pressed&&styles.pressed]}>
        <Text style={[styles.filterText,domain===item&&styles.filterTextActive]}>{item.replace('Acadêmico/','').replace('Gramática/','')}</Text>
      </Pressable>)}
    </ScrollView>
    <View style={styles.infoRow}>
      <Text style={styles.infoStrong}>{total} resultados</Text>
      <Text style={styles.infoMuted}>{rows.length}{hasMore?' carregados':' exibidos'}</Text>
    </View>
  </View>;

  return <SafeAreaView edges={['top']} style={styles.safe}>
    <FlatList
      data={rows}
      keyExtractor={(x,i)=>`${x.neo}-${x.pt}-${i}`}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.page}
      ListHeaderComponent={header}
      onEndReached={loadMore}
      onEndReachedThreshold={0.45}
      initialNumToRender={14}
      maxToRenderPerBatch={14}
      updateCellsBatchingPeriod={32}
      windowSize={7}
      removeClippedSubviews
      renderItem={({item})=><View style={styles.row}>
        <View style={styles.rowTop}>
          <Text style={styles.neo}>{item.neo}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.classe}</Text></View>
        </View>
        <Text style={styles.pt}>{item.pt}</Text>
        <Text style={styles.meta}>{item.dominio} · {item.registro||'neutro'} · raiz {item.raiz}</Text>
      </View>}
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
  row:{marginBottom:9,paddingVertical:15,paddingHorizontal:16,backgroundColor:COLORS.paper,borderWidth:1,borderColor:COLORS.line,borderRadius:RADIUS.md},
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
