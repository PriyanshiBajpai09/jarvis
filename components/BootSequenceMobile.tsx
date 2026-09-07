import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import ArcReactorMobile from "./ArcReactorMobile";
import GlassPanel from "./GlassPanel";

interface BootSequenceMobileProps { onComplete: () => void; }

const DIAG_LINES = [
  "Initializing Neural Core...",
  "Loading Cognitive Matrix...",
  "Calibrating Holographic Systems...",
];
const CHECKLIST = ["Prompt Shield","Memory Vault","Voice Engine","System Integrity"];

const TOTAL_MS=2900, REDUCED_TOTAL_MS=800, FADE_OUT_MS=450, REDUCED_FADE_OUT_MS=150;

function BootSequenceMobile({onComplete}:BootSequenceMobileProps){
 const reducedMotion=useReducedMotion();
 const duration=reducedMotion?REDUCED_TOTAL_MS:TOTAL_MS;
 const opacity=useMemo(()=>new Animated.Value(1),[]);
 const progressAnim=useMemo(()=>new Animated.Value(0),[]);
 const reactorScale=useMemo(()=>new Animated.Value(.85),[]);
 const bloomAnim=useMemo(()=>new Animated.Value(0),[]);
 const sweepAnim=useMemo(()=>new Animated.Value(0),[]);
 const [progress,setProgress]=useState(0);
 const [bloom,setBloom]=useState(0);
 const done=useRef(false);

 useEffect(()=>{
   const p=progressAnim.addListener(({value})=>setProgress(value));
   const b=bloomAnim.addListener(({value})=>setBloom(value));
   Animated.timing(progressAnim,{toValue:100,duration,easing:Easing.linear,useNativeDriver:false}).start(()=>{
     if(done.current)return; done.current=true;
     setTimeout(()=>Animated.timing(opacity,{toValue:0,duration:reducedMotion?REDUCED_FADE_OUT_MS:FADE_OUT_MS,easing:Easing.out(Easing.ease),useNativeDriver:true}).start(onComplete),reducedMotion?120:350);
   });
   Animated.loop(Animated.timing(sweepAnim,{toValue:1,duration:1400,easing:Easing.linear,useNativeDriver:false})).start();
   return()=>{progressAnim.removeListener(p); bloomAnim.removeListener(b);}
 },[]);

 const stage=progress<10?0:progress<22?1:progress<34?2:progress<70?3:progress<96?4:5;

 useEffect(()=>{
   if(stage>=4){
     Animated.sequence([
       Animated.timing(reactorScale,{toValue:1.05,duration:220,easing:Easing.out(Easing.ease),useNativeDriver:true}),
       Animated.timing(reactorScale,{toValue:1,duration:170,easing:Easing.out(Easing.ease),useNativeDriver:true}),
     ]).start();
     Animated.timing(bloomAnim,{toValue:1,duration:650,easing:Easing.out(Easing.ease),useNativeDriver:false}).start();
   }
 },[stage]);

 const sweep=sweepAnim.interpolate({inputRange:[0,1],outputRange:[-70,300]});

 return(
 <Animated.View style={[s.container,{opacity}]}>
  <View style={s.bgGrid}/>
  <View style={s.bgGlow}/>
  <View style={s.particles}>
    {Array.from({length:18}).map((_,i)=><View key={i} style={[s.dot,{left:(i*23)%320+20,top:(i*67)%620+60}]}/>)}
  </View>

  <View style={s.title}>
    <Text style={s.jarvis}>JARVIS</Text>
    <Text style={s.sub}>MARK LXXXV OPERATING SYSTEM</Text>
  </View>

  {stage===3&&<GlassPanel style={s.panel}>{DIAG_LINES.map((l,i)=>i<Math.ceil(((progress-34)/36)*3)&&<Text key={l} style={s.diag}>{"> "}{l}</Text>)}</GlassPanel>}

  {stage===4&&<>
    <Animated.View style={{transform:[{scale:reactorScale}]}}>
      <ArcReactorMobile size={110} showFloor={false} bloomBoost={bloom}/>
    </Animated.View>
    <GlassPanel style={s.panel}>{CHECKLIST.map((c,i)=>i<Math.ceil(((progress-70)/26)*4)&&<View key={c} style={s.row}><View style={s.circle}><Text style={s.tick}>✓</Text></View><Text style={s.label}>{c}</Text></View>)}</GlassPanel>
  </>}

  {stage===5&&<View style={s.welcome}><Animated.View style={{transform:[{scale:reactorScale}]}}><ArcReactorMobile size={90} showFloor={false} bloomBoost={bloom}/></Animated.View><Text style={s.w1}>WELCOME, PRIYANSHI.</Text><Text style={s.w2}>JARVIS ONLINE..</Text></View>}

  <View style={s.bottom}><Text style={s.percent}>{Math.floor(progress)}%</Text><View style={s.bar}><Animated.View style={[s.fill,{width:progressAnim.interpolate({inputRange:[0,100],outputRange:["0%","100%"]})}]}/><Animated.View style={[s.sweep,{transform:[{translateX:sweep}]}]}/></View></View>
 </Animated.View>);
}

const s=StyleSheet.create({
 container:{flex:1,backgroundColor:colors.bgBlack,justifyContent:"center",alignItems:"center",paddingHorizontal:26},
 bgGrid:{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:"#02060B"},
 bgGlow:{position:"absolute",top:-180,left:-180,right:-180,bottom:-180,borderRadius:500,backgroundColor:"rgba(0,234,255,0.08)"},
 particles:{position:"absolute",top:0,left:0,right:0,bottom:0},
 dot:{position:"absolute",width:4,height:4,borderRadius:2,backgroundColor:"rgba(0,234,255,0.55)"},
 title:{alignItems:"center",marginBottom:20},
 jarvis:{fontFamily:fonts.displayBlack,fontSize:36,letterSpacing:8,color:colors.textPrimary,textShadowColor:colors.cyan,textShadowRadius:18},
 sub:{marginTop:6,fontFamily:fonts.body,fontSize:10,letterSpacing:3,color:colors.cyanSoft},
 panel:{width:"100%",maxWidth:320},
 diag:{fontFamily:fonts.body,fontSize:13,color:colors.cyanSoft,marginBottom:8},
 row:{flexDirection:"row",alignItems:"center",marginBottom:10},
 circle:{width:18,height:18,borderRadius:9,borderWidth:1,borderColor:colors.cyan,alignItems:"center",justifyContent:"center",marginRight:10},
 tick:{color:colors.cyan,fontSize:10},
 label:{fontFamily:fonts.body,fontSize:13,color:colors.textPrimary},
 welcome:{alignItems:"center",gap:12},
 w1:{fontFamily:fonts.display,fontSize:16,letterSpacing:3,color:colors.textPrimary},
 w2:{fontFamily:fonts.display,fontSize:24,letterSpacing:3,color:colors.cyan},
 bottom:{width:"100%",maxWidth:320,alignItems:"center",marginTop:24},
 percent:{fontFamily:fonts.display,fontSize:28,color:colors.cyan,textShadowColor:colors.cyan,textShadowRadius:18,marginBottom:14},
 bar:{width:"100%",height:7,borderRadius:2,overflow:"hidden",borderWidth:1,borderColor:"rgba(0,234,255,.35)",backgroundColor:"rgba(0,234,255,.08)"},
 fill:{height:"100%",backgroundColor:colors.cyan},
 sweep:{position:"absolute",top:0,bottom:0,width:55,backgroundColor:"rgba(255,255,255,.35)"}
});

export default BootSequenceMobile;
