import React,{useEffect,useMemo,useState} from "react";
import {Animated,Easing,StyleSheet,Text,View} from "react-native";
import {BlurView} from "expo-blur";
import {LinearGradient} from "expo-linear-gradient";
import {colors,fonts} from "../theme/theme";
import {useReducedMotion} from "../hooks/useReducedMotion";

const EMBLEM=34;
const time=(d:Date)=>`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
const date=(d:Date)=>d.toLocaleDateString("en-US",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase();

export default function HoloHeaderMobile(){
 const reduced=useReducedMotion(); const [now,setNow]=useState(new Date());
 useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t)},[]);
 const sweep=useMemo(()=>new Animated.Value(0),[]);
 const pulse=useMemo(()=>new Animated.Value(0),[]);
 const spin=useMemo(()=>new Animated.Value(0),[]);
 useEffect(()=>{
  if(reduced)return;
  const a=Animated.loop(Animated.timing(sweep,{toValue:1,duration:4200,easing:Easing.inOut(Easing.ease),useNativeDriver:true}));
  const b=Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1,duration:900,easing:Easing.inOut(Easing.ease),useNativeDriver:true}),Animated.timing(pulse,{toValue:0,duration:900,easing:Easing.inOut(Easing.ease),useNativeDriver:true})]));
  const c=Animated.loop(Animated.timing(spin,{toValue:1,duration:8000,easing:Easing.linear,useNativeDriver:true}));
  a.start();b.start();c.start(); return()=>{a.stop();b.stop();c.stop();}
 },[reduced,sweep,pulse,spin]);
 return <View style={s.wrap}><BlurView intensity={55} tint="dark" style={s.fill}/><View style={s.tint}/>
  <Animated.View style={[s.sweep,{transform:[{translateX:sweep.interpolate({inputRange:[0,1],outputRange:[-160,420]})}]}]}><LinearGradient colors={["rgba(0,234,255,0)","rgba(0,234,255,0.16)","rgba(0,234,255,0)"]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.fill}/></Animated.View>
  <View style={s.row}><View style={s.left}><Animated.View style={[s.ring,{transform:[{rotate:spin.interpolate({inputRange:[0,1],outputRange:["0deg","360deg"]})}]}]}/><View style={s.emblem}><Animated.View style={[s.core,{opacity:pulse.interpolate({inputRange:[0,1],outputRange:[.4,1]}),transform:[{scale:pulse.interpolate({inputRange:[0,1],outputRange:[.85,1.15]})}]}]}/></View></View>
  <View style={s.center}><Text style={s.title}>JARVIS</Text><Text style={s.sub}>MARK LXXXV OPERATING SYSTEM</Text></View>
  <View style={s.right}><Text style={s.clock}>{time(now)}</Text><Text style={s.date}>{date(now)}</Text><View style={s.pill}><Animated.View style={[s.dot,{opacity:pulse.interpolate({inputRange:[0,1],outputRange:[.5,1]})}]}/><Text style={s.online}>ONLINE</Text></View></View></View></View>
}
const s=StyleSheet.create({wrap:{height:76,overflow:"hidden",borderBottomWidth:1,borderBottomColor:colors.glassBorder},fill:{...StyleSheet.absoluteFill},tint:{...StyleSheet.absoluteFill,backgroundColor:"rgba(6,16,34,.6)"},sweep:{position:"absolute",top:0,bottom:0,width:140},row:{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:16},left:{width:46,height:46,alignItems:"center",justifyContent:"center"},ring:{position:"absolute",width:42,height:42,borderRadius:21,borderWidth:1,borderStyle:"dashed",borderColor:"rgba(0,234,255,.45)"},emblem:{width:EMBLEM,height:EMBLEM,borderRadius:17,borderWidth:1.5,borderColor:colors.cyan,alignItems:"center",justifyContent:"center"},core:{width:11,height:11,borderRadius:6,backgroundColor:colors.cyan},center:{flex:1,alignItems:"center"},title:{fontFamily:fonts.displayBlack,fontSize:17,letterSpacing:5,color:colors.textPrimary},sub:{fontFamily:fonts.body,fontSize:8,color:colors.textDim},right:{alignItems:"flex-end"},clock:{fontFamily:fonts.display,fontSize:12,color:colors.cyanSoft},date:{fontFamily:fonts.body,fontSize:8,color:colors.textDim},pill:{flexDirection:"row",alignItems:"center",gap:5,paddingHorizontal:7,paddingVertical:2,borderWidth:1,borderColor:colors.glassBorder,borderRadius:3},dot:{width:5,height:5,borderRadius:3,backgroundColor:colors.safeGreen},online:{fontFamily:fonts.display,fontSize:8,color:colors.safeGreen}})

