import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "./supabase.js"

// ── CONSTANTS ──
const EGRESO_CATS=["Salidas","Compras","Departamento","Auto","Apps","Entrenamiento","Transporte","Préstamo","Boca Juniors","Módulo","Cuidado Personal","Regalos","Comida laboral","Estudios","Pago deuda","Gastos Tarjeta","Otros"]
const EGRESO_SUBS={"Salidas":["Comidas / Bares","Boliches / Fiestas","Recitales","Otras"],"Compras":["Supermercado","Delivery","Ropa","Farmacia","Verdulería","Carnicería","Dietética","Departamento","Otros"],"Departamento":["Cuota Hipotecario","Metrogas","Edesur","Internet","Expensas","Seguro"],"Auto":["Nafta","Seguro","Peajes","Cochera","Lavadero","Multa","Cuota Préstamo"],"Apps":["Spotify","YouTube","Netflix","LinkedIn","Adobe"],"Entrenamiento":["Gimnasio"],"Transporte":["UBER","SUBE","Estacionamiento"],"Préstamo":["Préstamo","Fapa","Chino","Andi","Coco","Marcos","Gabriela","Andino"],"Boca Juniors":["Cuota Socio","Cancha"],"Módulo":["Módulo Sanitario"],"Cuidado Personal":["Proteína","Peluquería","Terapia","Creatina"],"Regalos":["Edgardo","Nancy","Otros"],"Comida laboral":["Almuerzo"],"Estudios":["Inglés","Coderhouse"],"Pago deuda":["Edgardo"],"Gastos Tarjeta":["Impuestos e intereses"],"Otros":["Apuestas","Otros"]}
const INGRESO_CATS=["Sueldo","Incentivado / SAC","Inversiones - Intereses Ganados","Otros Ingresos"]
const INV_TYPES=["Compra/venta USD","CEDEARs / Acciones","Caución / Plazo fijo","Crypto / Otros"]
const COLORS=["#3b82f6","#8b5cf6","#f59e0b","#ef4444","#10b981","#ec4899","#14b8a6","#f97316","#6366f1","#84cc16","#06b6d4","#e11d48","#a3e635","#7c3aed","#fb923c","#2dd4bf","#c084fc","#facc15","#f43f5e","#34d399"]

const f$=(n,u)=>{const a=Math.abs(n||0);return u?`USD ${a.toLocaleString("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2})}`:`$${a.toLocaleString("es-AR",{maximumFractionDigits:0})}`}
const fS=(n,u)=>{const p=u?"U$":"";return n>=1e6?`${p}${(n/1e6).toFixed(1)}M`:n>=1e3?`${p}${(n/1e3).toFixed(0)}K`:`${p}${Math.round(n)}`}
const today=()=>new Date().toISOString().split("T")[0]
const monthOf=d=>d?.slice(0,7)||""
const Ic=({d,s=20})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
const IC={home:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",plus:"M12 5v14M5 12h14",list:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",chart:"M18 20V10M12 20V4M6 20v-6",debt:"M1 4h22v16H1zM1 10h22",upload:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",left:"M15 18l-6-6 6-6",right:"M9 18l6-6-6-6",logout:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",eye:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",eyeOff:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22",edit:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",settings:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"}
const mo={fontFamily:"'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',monospace"}
// Category emoji icons for visual identification
const CAT_ICON={"Salidas":"🍻","Compras":"🛒","Departamento":"🏠","Auto":"🚗","Apps":"📱","Entrenamiento":"💪","Transporte":"🚇","Préstamo":"🤝","Boca Juniors":"⚽","Módulo":"🏗️","Cuidado Personal":"💇","Regalos":"🎁","Comida laboral":"🍽️","Estudios":"📚","Pago deuda":"💳","Gastos Tarjeta":"🏦","Otros":"📌","Sueldo":"💰","Inversiones":"📈","Traspaso":"↔️","Inversiones - Intereses Ganados":"📊","Incentivado / SAC":"🎯","Otros Ingresos":"💵"}
const catIcon=c=>{for(const[k,v] of Object.entries(CAT_ICON)){if(c?.includes(k))return v};return"📌"}
// Account logos as colored text badges
const ACC_LOGO={"Efectivo":"💵","BAPRO":"🏛️","Mercado Pago":"💜"}
const accLogo=name=>{for(const[k,v] of Object.entries(ACC_LOGO)){if(name?.includes(k))return v};return"💰"}
// Category color map for badges
const CAT_COLORS={"Salidas":"#f97316","Compras":"#3b82f6","Departamento":"#8b5cf6","Auto":"#ef4444","Apps":"#06b6d4","Entrenamiento":"#10b981","Transporte":"#f59e0b","Préstamo":"#64748b","Boca Juniors":"#facc15","Módulo":"#14b8a6","Cuidado Personal":"#ec4899","Regalos":"#a78bfa","Comida laboral":"#fb923c","Estudios":"#6366f1","Pago deuda":"#7f1d1d","Gastos Tarjeta":"#475569","Otros":"#334155","Sueldo":"#22c55e","Inversiones":"#eab308","Traspaso":"#60a5fa"}
const catColor=c=>CAT_COLORS[c]||"#475569"
const Badge=({text,color})=><span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:`${color||catColor(text)}22`,color:color||catColor(text),whiteSpace:"nowrap"}}>{text}</span>
const S={
  sec:{fontSize:14,fontWeight:700,letterSpacing:1,color:"#94a3b8",marginBottom:14},
  crd:{background:"linear-gradient(145deg,#131a2b,#0f1623)",borderRadius:20,border:"1px solid rgba(255,255,255,.06)",overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,.2)"},
  crdP:{background:"linear-gradient(145deg,#131a2b,#0f1623)",borderRadius:20,padding:20,border:"1px solid rgba(255,255,255,.06)",boxShadow:"0 4px 24px rgba(0,0,0,.2)"},
  lbl:{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:8,fontWeight:600},
  inp:{width:"100%",padding:"14px 18px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.1)",borderRadius:14,color:"#e2e8f0",fontSize:14,outline:"none",boxSizing:"border-box",transition:"border .2s"},
  btn:(active,color)=>({padding:"9px 16px",borderRadius:24,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:active?color:"rgba(255,255,255,.04)",color:active?"#fff":"#94a3b8",transition:"all .15s",boxShadow:active?`0 2px 12px ${color}44`:"none"}),
}

// ══════════════ AUTH ══════════════
function LoginPage({onLogin}){
  const[email,setEmail]=useState("")
  const[pass,setPass]=useState("")
  const[err,setErr]=useState("")
  const[loading,setLoading]=useState(false)
  const go=async()=>{
    setLoading(true);setErr("")
    const{error}=await supabase.auth.signInWithPassword({email,password:pass})
    if(error)setErr(error.message)
    setLoading(false)
  }
  return(
    <div style={{minHeight:"100vh",background:"#0b1120",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:360}}>
        <h1 style={{fontSize:32,fontWeight:800,textAlign:"center",marginBottom:8,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MisGastos</h1>
        <p style={{color:"#475569",textAlign:"center",fontSize:14,marginBottom:32}}>Iniciá sesión para continuar</p>
        {err&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:12,padding:"10px 14px",marginBottom:16,color:"#f87171",fontSize:13}}>{err}</div>}
        <div style={{marginBottom:16}}>
          <label style={S.lbl}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" style={S.inp}/>
        </div>
        <div style={{marginBottom:24}}>
          <label style={S.lbl}>Contraseña</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={S.inp} onKeyDown={e=>e.key==="Enter"&&go()}/>
        </div>
        <button onClick={go} disabled={loading} style={{width:"100%",padding:16,borderRadius:16,border:"none",fontSize:16,fontWeight:700,cursor:"pointer",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",opacity:loading?.6:1,boxShadow:"0 6px 20px rgba(59,130,246,.3)"}}>
          {loading?"Ingresando...":"Ingresar"}
        </button>
      </div>
    </div>
  )
}

// ══════════════ HOME ══════════════
function HomePage({cuentas,movimientos}){
  const[hide,setHide]=useState(false)
  const cuentasByNombre={}
  cuentas.forEach(c=>{cuentasByNombre[c.nombre]=c})
  const tP=(cuentasByNombre["Efectivo $"]?.saldo||0)+(cuentasByNombre["BAPRO $"]?.saldo||0)+(cuentasByNombre["Mercado Pago $"]?.saldo||0)
  const tU=(cuentasByNombre["Efectivo USD"]?.saldo||0)+(cuentasByNombre["BAPRO USD"]?.saldo||0)
  const curMonth=monthOf(today())
  const recent=movimientos.filter(m=>monthOf(m.fecha)<=curMonth).slice(0,12)
  const cuentaNombre=id=>cuentas.find(c=>c.id===id)?.nombre||""
  const h=v=>hide?"••••••":v

  return(
    <div className="page-inner">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={S.sec}>Patrimonio Total</div>
        <button onClick={()=>setHide(!hide)} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",padding:4}}>
          <Ic d={hide?IC.eyeOff:IC.eye} s={18}/>
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:28}}>
        <div style={{background:"linear-gradient(135deg,#0c1929 0%,#1e40af 50%,#7c3aed 100%)",borderRadius:20,padding:"22px 18px",border:"1px solid rgba(96,165,250,.15)",boxShadow:"0 8px 32px rgba(37,99,235,.15)"}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginBottom:6,fontWeight:600,letterSpacing:1}}>PESOS</div>
          <div style={{fontSize:24,fontWeight:800,color:"#fff",...mo}}>{h(f$(tP))}</div>
        </div>
        <div style={{background:"linear-gradient(135deg,#052e16 0%,#059669 50%,#14b8a6 100%)",borderRadius:20,padding:"22px 18px",border:"1px solid rgba(74,222,128,.15)",boxShadow:"0 8px 32px rgba(5,150,105,.15)"}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginBottom:6,fontWeight:600,letterSpacing:1}}>DÓLARES</div>
          <div style={{fontSize:24,fontWeight:800,color:"#fff",...mo}}>{h(f$(tU,true))}</div>
        </div>
      </div>

      <div style={S.sec}>Cuentas</div>
      <div style={{...S.crd,marginBottom:28}}>
        <div style={{display:"flex",padding:"10px 18px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{flex:"0 0 130px"}}/><div style={{flex:1,textAlign:"center",fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>Pesos</div><div style={{flex:1,textAlign:"center",fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>USD</div>
        </div>
        {[["Efectivo","Efectivo $","Efectivo USD","#f59e0b","💵"],["BAPRO","BAPRO $","BAPRO USD","#60a5fa","🏛️"]].map(([n,pk,uk,c,icon])=>(
          <div key={n} style={{display:"flex",alignItems:"center",padding:"16px 18px",gap:12,borderBottom:"1px solid rgba(255,255,255,.04)"}}>
            <div style={{width:36,height:36,borderRadius:10,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{icon}</div>
            <div style={{flex:"0 0 82px",fontSize:14,color:"#e2e8f0",fontWeight:600}}>{n}</div>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:15,fontWeight:700,color:"#e2e8f0",...mo}}>{h(f$(cuentasByNombre[pk]?.saldo||0))}</div></div>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:15,fontWeight:700,color:"#a7f3d0",...mo}}>{h(f$(cuentasByNombre[uk]?.saldo||0,true))}</div></div>
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",padding:"16px 18px",gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(167,139,250,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>💜</div>
          <div style={{flex:"0 0 82px",fontSize:14,color:"#e2e8f0",fontWeight:600}}>Mercado Pago</div>
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:15,fontWeight:700,color:"#e2e8f0",...mo}}>{h(f$(cuentasByNombre["Mercado Pago $"]?.saldo||0))}</div></div>
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:14,color:"#334155"}}>—</div></div>
        </div>
      </div>

      <div style={S.sec}>Últimos Movimientos</div>
      <div style={S.crd}>
        <div style={{display:"flex",alignItems:"center",padding:"10px 18px",borderBottom:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.02)"}}>
          <div style={{width:42,flexShrink:0}}/>
          <div style={{flex:1,fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>Detalle</div>
          <div style={{width:95,textAlign:"right",fontSize:11,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>$</div>
          <div style={{width:80,textAlign:"right",fontSize:11,color:"#34d399",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>USD</div>
        </div>
        {recent.length===0&&<div style={{padding:30,textAlign:"center",color:"#475569",fontSize:13}}>Sin movimientos. Cargá tu primer gasto.</div>}
        {recent.map((e,i)=>{
          const enUSD=cuentas.find(c=>c.id===e.cuenta_id)?.moneda==="USD"
          const devolucion=e.tipo==="egreso"&&e.monto<0
          const col=e.tipo==="ingreso"||devolucion?"#4ade80":e.tipo==="traspaso"?"#60a5fa":"#f87171"
          const sign=e.tipo==="ingreso"||devolucion?"+":e.tipo==="egreso"?"-":"↔"
          const formatted=sign+f$(Math.abs(e.monto),enUSD)
          return(
          <div key={e.id} style={{display:"flex",alignItems:"center",padding:"16px 18px",borderBottom:i<recent.length-1?"1px solid rgba(255,255,255,.04)":"none",gap:0}}>
            <div style={{width:42,height:42,borderRadius:12,background:`${catColor(e.categoria)}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
              {catIcon(e.categoria)}
            </div>
            <div style={{flex:1,minWidth:0,paddingLeft:14}}>
              <div style={{fontSize:14,color:"#f1f5f9",fontWeight:600,marginBottom:3}}>{e.subcategoria||e.categoria}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,color:"#475569"}}>{e.fecha?.slice(5)||""}</span>
                <Badge text={e.categoria}/>
              </div>
            </div>
            <div style={{width:95,textAlign:"right",fontSize:16,fontWeight:700,color:enUSD?"transparent":col,...mo,whiteSpace:"nowrap"}}>{hide?"••••":(enUSD?"—":formatted)}</div>
            <div style={{width:80,textAlign:"right",fontSize:16,fontWeight:700,color:enUSD?col:"transparent",...mo,whiteSpace:"nowrap"}}>{hide?"••••":(enUSD?formatted:"—")}</div>
          </div>)
        })}
      </div>
    </div>
  )
}

// ══════════════ CARGAR ══════════════
function AddPage({cuentas,userId,onSaved,egresoCats,egresoSubs,ingresoCats,invTypes}){
  const[mt,setMt]=useState("egreso")
  const[fm,setFm]=useState({date:today(),cat:"",sub:"",tc:"",cuenta:"",amt:"",it:"",from:"",to:""})
  const[ok,setOk]=useState(false)
  const[saving,setSaving]=useState(false)
  const[usdCalc,setUsdCalc]=useState(null)
  const[showConfirm,setShowConfirm]=useState(false)
  const subs=egresoSubs[fm.cat]||[]
  const isUSD=mt==="inversion"&&fm.it.toLowerCase().includes("usd")

  useEffect(()=>{
    if(cuentas.length>0&&!fm.cuenta){
      const bapro=cuentas.find(c=>c.nombre==="BAPRO $")
      const usdAcc=cuentas.find(c=>c.nombre==="Efectivo USD")||cuentas.find(c=>c.moneda==="USD")||cuentas[0]
      setFm(f=>({...f,cuenta:bapro?.id||cuentas[0].id,from:bapro?.id||cuentas[0].id,to:usdAcc?.id||cuentas[1]?.id||""}))
    }
  },[cuentas])

  const go=async()=>{
    if(saving)return;setSaving(true)
    try{
      if(mt==="traspaso"){
        if(!fm.amt||fm.from===fm.to){setSaving(false);return}
        const amt=parseFloat(fm.amt)
        await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:"traspaso",categoria:"Traspaso",subcategoria:`${cuentas.find(c=>c.id===fm.from)?.nombre} → ${cuentas.find(c=>c.id===fm.to)?.nombre}`,monto:amt,cuenta_id:fm.from,cuenta_destino_id:fm.to})
        const{data:fromFresh}=await supabase.from("cuentas").select("saldo").eq("id",fm.from).single()
        const{data:toFresh}=await supabase.from("cuentas").select("saldo").eq("id",fm.to).single()
        if(fromFresh)await supabase.from("cuentas").update({saldo:fromFresh.saldo-amt}).eq("id",fm.from)
        if(toFresh)await supabase.from("cuentas").update({saldo:toFresh.saldo+amt}).eq("id",fm.to)
      }else if(mt==="inversion"){
        if(!fm.amt||!fm.it){setSaving(false);return}
        await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:"inversion",categoria:"Inversiones",subcategoria:fm.it,monto:parseFloat(fm.amt),cuenta_id:fm.cuenta})
      }else{
        if(!fm.amt||!fm.cat){setSaving(false);return}
        const amt=parseFloat(fm.amt)
        await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:mt,categoria:fm.cat,subcategoria:fm.sub||null,monto:amt,cuenta_id:fm.cuenta,tc:fm.tc||null})
        const{data:fresh}=await supabase.from("cuentas").select("saldo").eq("id",fm.cuenta).single()
        if(fresh){
          const delta=mt==="egreso"?-amt:amt
          await supabase.from("cuentas").update({saldo:fresh.saldo+delta}).eq("id",fm.cuenta)
        }
        if(mt==="egreso"&&fm.cat==="Pago deuda"&&fm.sub==="Edgardo"){
          const{data:lastDeuda}=await supabase.from("deuda_edgardo").select("saldo").order("fecha",{ascending:false}).limit(1)
          const lastSaldo=lastDeuda?.[0]?.saldo||0
          await supabase.from("deuda_edgardo").insert({user_id:userId,fecha:fm.date,descripcion:"Pago por deuda",monto:-amt,saldo:lastSaldo-amt})
        }
      }
      setOk(true);await onSaved()
      setTimeout(()=>{setOk(false);setFm(f=>({...f,cat:"",sub:"",amt:"",tc:"",it:""}))},1200)
    }catch(e){console.error(e)}
    setSaving(false)
  }

  const calcularUSD=()=>{
    if(!fm.amt||!fm.tc||parseFloat(fm.tc)<=0)return
    setUsdCalc(parseFloat(fm.amt)/parseFloat(fm.tc))
    setShowConfirm(true)
  }

  const confirmarUSD=async()=>{
    if(saving)return;setSaving(true);setShowConfirm(false)
    try{
      const importePesos=parseFloat(fm.amt)
      const importeUSD=usdCalc
      await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:"inversion",categoria:"Inversiones",subcategoria:fm.it,monto:importePesos,cuenta_id:fm.from,cuenta_destino_id:fm.to,detalle:`TC:${fm.tc}`})
      const{data:fromFresh}=await supabase.from("cuentas").select("saldo").eq("id",fm.from).single()
      if(fromFresh)await supabase.from("cuentas").update({saldo:fromFresh.saldo-importePesos}).eq("id",fm.from)
      const{data:toFresh}=await supabase.from("cuentas").select("saldo").eq("id",fm.to).single()
      if(toFresh)await supabase.from("cuentas").update({saldo:toFresh.saldo+importeUSD}).eq("id",fm.to)
      setOk(true);setUsdCalc(null);await onSaved()
      setTimeout(()=>{setOk(false);setFm(f=>({...f,amt:"",tc:"",it:""}))},1200)
    }catch(e){console.error(e)}
    setSaving(false)
  }

  const cn=id=>cuentas.find(c=>c.id===id)?.nombre||""
  const tabC={egreso:"#dc2626",ingreso:"#16a34a",traspaso:"#3b82f6",inversion:"#f59e0b"}
  const tabL={egreso:"Egreso",ingreso:"Ingreso",traspaso:"Traspaso",inversion:"Inversiones"}

  return(
    <div style={{className:"page-inner"}}>
      {/* Confirm modal for Compra USD */}
      {showConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:"#141c28",borderRadius:20,padding:28,width:"100%",maxWidth:360,border:"1px solid rgba(245,158,11,.2)"}}>
          <div style={{fontSize:16,fontWeight:700,color:"#f59e0b",marginBottom:20,textAlign:"center"}}>Confirmar Compra USD</div>
          <div style={{background:"#0b1120",borderRadius:12,padding:16,marginBottom:16,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:"#64748b"}}>Debitás</span>
              <span style={{fontSize:15,fontWeight:700,color:"#f87171",...mo}}>- {f$(parseFloat(fm.amt))}</span>
            </div>
            <div style={{fontSize:11,color:"#475569",textAlign:"right"}}>{cn(fm.from)}</div>
            <div style={{borderTop:"1px solid rgba(255,255,255,.05)",paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:"#64748b"}}>Acreditás</span>
              <span style={{fontSize:15,fontWeight:700,color:"#4ade80",...mo}}>+ {f$(usdCalc,true)}</span>
            </div>
            <div style={{fontSize:11,color:"#475569",textAlign:"right"}}>{cn(fm.to)}</div>
            <div style={{borderTop:"1px solid rgba(255,255,255,.05)",paddingTop:10,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:13,color:"#64748b"}}>TC</span>
              <span style={{fontSize:13,color:"#94a3b8",...mo}}>{f$(parseFloat(fm.tc))}</span>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={()=>setShowConfirm(false)} style={{padding:14,borderRadius:12,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#94a3b8",fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
            <button onClick={confirmarUSD} disabled={saving} style={{padding:14,borderRadius:12,border:"none",background:"linear-gradient(135deg,#f59e0b,#b45309)",color:"#000",fontSize:14,fontWeight:700,cursor:"pointer"}}>{saving?"Guardando...":"Confirmar"}</button>
          </div>
        </div>
      </div>}

      <div style={S.sec}>Nuevo Movimiento</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:20}}>
        {["egreso","ingreso","traspaso","inversion"].map(t=><button key={t} onClick={()=>{setMt(t);setFm(f=>({...f,cat:"",sub:"",it:""}));setUsdCalc(null)}} style={{padding:"11px 0",borderRadius:12,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:mt===t?tabC[t]:"#141c28",color:mt===t?"#fff":"#64748b"}}>{tabL[t]}</button>)}
      </div>

      {/* Generic fields for non-inversion tabs */}
      {mt!=="inversion"&&<>
        <div style={{marginBottom:16}}><label style={S.lbl}>Importe</label><input type="number" inputMode="decimal" value={fm.amt} onChange={e=>setFm(f=>({...f,amt:e.target.value}))} placeholder="0" style={{...S.inp,fontSize:24,fontWeight:700,...mo}}/></div>
        <div style={{marginBottom:16}}><label style={S.lbl}>Fecha</label><input type="date" value={fm.date} onChange={e=>setFm(f=>({...f,date:e.target.value}))} style={S.inp}/></div>
      </>}

      {mt==="egreso"&&<>
        <div style={{marginBottom:16}}><label style={S.lbl}>Categoría</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{egresoCats.map(c=><button key={c} onClick={()=>setFm(f=>({...f,cat:c,sub:""}))} style={S.btn(fm.cat===c,"#3b82f6")}>{c}</button>)}</div></div>
        {subs.length>0&&<div style={{marginBottom:16}}><label style={S.lbl}>Detalle</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{subs.map(s=><button key={s} onClick={()=>setFm(f=>({...f,sub:s}))} style={S.btn(fm.sub===s,"#8b5cf6")}>{s}</button>)}</div></div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12,marginBottom:16}}>
          <div><label style={S.lbl}>TC</label><select value={fm.tc} onChange={e=>setFm(f=>({...f,tc:e.target.value}))} style={S.inp}><option value="">—</option><option value="V">V</option><option value="M">M</option></select></div>
          <div><label style={S.lbl}>Cuenta</label><select value={fm.cuenta} onChange={e=>setFm(f=>({...f,cuenta:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
        </div>
      </>}
      {mt==="ingreso"&&<>
        <div style={{marginBottom:16}}><label style={S.lbl}>Categoría</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ingresoCats.map(c=><button key={c} onClick={()=>setFm(f=>({...f,cat:c}))} style={S.btn(fm.cat===c,"#16a34a")}>{c}</button>)}</div></div>
        <div style={{marginBottom:16}}><label style={S.lbl}>Cuenta destino</label><select value={fm.cuenta} onChange={e=>setFm(f=>({...f,cuenta:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
      </>}
      {mt==="traspaso"&&<div style={{marginBottom:16}}>
        <label style={S.lbl}>Cuenta Origen</label><select value={fm.from} onChange={e=>setFm(f=>({...f,from:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select>
        <div style={{textAlign:"center",padding:"10px 0",color:"#3b82f6",fontSize:20}}>↓</div>
        <label style={S.lbl}>Cuenta Destino</label><select value={fm.to} onChange={e=>setFm(f=>({...f,to:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select>
      </div>}

      {mt==="inversion"&&<>
        {/* Step 1: Type selector */}
        <div style={{marginBottom:20}}>
          <label style={S.lbl}>Tipo de Inversión</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {invTypes.map(t=><button key={t} onClick={()=>{setFm(f=>({...f,it:t,amt:"",tc:""}));setUsdCalc(null)}} style={{...S.btn(fm.it===t,"#f59e0b"),padding:"12px 16px",fontSize:13}}>{t}</button>)}
          </div>
        </div>

        {/* Step 2a: Standard inversion form */}
        {fm.it&&!isUSD&&<>
          <div style={{marginBottom:16}}><label style={S.lbl}>Importe</label><input type="number" inputMode="decimal" value={fm.amt} onChange={e=>setFm(f=>({...f,amt:e.target.value}))} placeholder="0" style={{...S.inp,fontSize:24,fontWeight:700,...mo}}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Fecha</label><input type="date" value={fm.date} onChange={e=>setFm(f=>({...f,date:e.target.value}))} style={S.inp}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Cuenta</label><select value={fm.cuenta} onChange={e=>setFm(f=>({...f,cuenta:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
        </>}

        {/* Step 2b: Compra USD form */}
        {fm.it&&isUSD&&<>
          <div style={{marginBottom:16}}><label style={S.lbl}>Fecha</label><input type="date" value={fm.date} onChange={e=>setFm(f=>({...f,date:e.target.value}))} style={S.inp}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Importe en Pesos</label><input type="number" inputMode="decimal" value={fm.amt} onChange={e=>{setFm(f=>({...f,amt:e.target.value}));setUsdCalc(null)}} placeholder="0" style={{...S.inp,fontSize:24,fontWeight:700,...mo}}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Tipo de Cambio</label><input type="number" inputMode="decimal" value={fm.tc} onChange={e=>{setFm(f=>({...f,tc:e.target.value}));setUsdCalc(null)}} placeholder="0" style={{...S.inp,fontSize:20,fontWeight:700,...mo}}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Cuenta a Debitar</label><select value={fm.from} onChange={e=>setFm(f=>({...f,from:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
          <div style={{marginBottom:20}}><label style={S.lbl}>Cuenta a Acreditar</label><select value={fm.to} onChange={e=>setFm(f=>({...f,to:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
          {usdCalc!==null&&<div style={{...S.crdP,marginBottom:16,textAlign:"center",border:"1px solid rgba(245,158,11,.25)"}}>
            <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",marginBottom:4}}>Resultado</div>
            <div style={{fontSize:26,fontWeight:800,color:"#f59e0b",...mo}}>{f$(usdCalc,true)}</div>
          </div>}
          <button onClick={calcularUSD} disabled={!fm.amt||!fm.tc||!fm.from||fm.from===fm.to} style={{width:"100%",padding:16,borderRadius:14,border:"none",fontSize:16,fontWeight:700,cursor:"pointer",background:"linear-gradient(135deg,#f59e0b,#b45309)",color:"#000",opacity:fm.amt&&fm.tc?1:.4,marginBottom:8}}>Calcular</button>
        </>}
      </>}

      {/* Save button (hidden for Compra USD — uses modal confirm instead) */}
      {!isUSD&&<button onClick={go} disabled={saving} style={{width:"100%",padding:16,borderRadius:14,border:"none",fontSize:16,fontWeight:700,cursor:"pointer",background:ok?"#16a34a":"linear-gradient(135deg,#3b82f6,#2563eb)",color:"#fff",opacity:ok||fm.amt?1:.4}}>{ok?"✓ Guardado":saving?"Guardando...":"Guardar"}</button>}
    </div>
  )
}

// ══════════════ DASHBOARD ══════════════
function DashboardPage({movimientos,onViewMonth,onViewMonthInv,cuentas}){
  const[pi,setPi]=useState(0)
  const[expandedCat,setExpandedCat]=useState(null)
  const isUSDCuenta=id=>cuentas.find(c=>c.id===id)?.moneda==="USD"
  // Group by month — pesos only for non-USD egresos
  const monthly={}
  movimientos.forEach(m=>{const k=monthOf(m.fecha);if(!monthly[k])monthly[k]={pesos:0,usd:0,inv:0,ing:0};if(m.tipo==="egreso"&&m.categoria!=="Inversiones"&&!isUSDCuenta(m.cuenta_id))monthly[k].pesos+=m.monto;if(m.tipo==="egreso"&&m.categoria!=="Inversiones"&&isUSDCuenta(m.cuenta_id))monthly[k].usd+=m.monto;if(m.tipo==="inversion"||(m.tipo==="egreso"&&m.categoria==="Inversiones"))monthly[k].inv+=m.monto;if(m.tipo==="ingreso")monthly[k].ing+=m.monto})
  const months=Object.keys(monthly).sort()
  const[bo,setBo]=useState(0)
  const vb=6,si=Math.max(0,months.length-vb-bo),ei=si+vb
  const vis=months.slice(si,ei)
  const maxP=Math.max(...Object.values(monthly).map(m=>m.pesos),1)
  const maxU=Math.max(...Object.values(monthly).map(m=>m.usd),1)
  const maxI=Math.max(...Object.values(monthly).map(m=>m.inv),1)

  // Pie chart
  const allMonths=months.length>0?months:[monthOf(today())]
  const pieIdx=Math.max(0,Math.min(pi,allMonths.length-1))
  const pk=allMonths[pieIdx]||monthOf(today())
  const pe=movimientos.filter(m=>m.tipo==="egreso"&&m.categoria!=="Inversiones"&&monthOf(m.fecha)===pk)
  const pc={};pe.forEach(e=>{pc[e.categoria]=(pc[e.categoria]||0)+e.monto})
  const ps=Object.entries(pc).sort((a,b)=>b[1]-a[1])
  const pt=ps.reduce((s,[,v])=>s+v,0)
  let ca=-Math.PI/2
  const arcs=ps.map(([cat,val],i)=>{const ang=(val/Math.max(pt,1))*Math.PI*2;const x1=70*Math.cos(ca),y1=70*Math.sin(ca),x2=70*Math.cos(ca+ang),y2=70*Math.sin(ca+ang);const r={cat,val,c:COLORS[i%COLORS.length],d:`M0,0 L${x1},${y1} A70,70 0 ${ang>Math.PI?1:0},1 ${x2},${y2} Z`};ca+=ang;return r})

  const fmtMonth=k=>{const[y,m]=k.split("-");const ml=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];return`${ml[parseInt(m)-1]} ${y.slice(2)}`}
  const NavBtn=({dir,dis,fn})=><button onClick={fn} disabled={dis} style={{width:28,height:28,borderRadius:8,border:"none",background:dis?"transparent":"#1e293b",color:dis?"#1e293b":"#94a3b8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={dir==="l"?IC.left:IC.right} s={14}/></button>

  useEffect(()=>{setPi(allMonths.length-1)},[allMonths.length])

  return(
    <div style={{className:"page-inner"}}>
      <div style={S.sec}>Dashboard</div>

      {/* Gastos Mensuales — dual bar */}
      <div style={{...S.crdP,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>Gastos mensuales</div>
            <div style={{display:"flex",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:8,height:8,borderRadius:2,background:"#3b82f6"}}/><span style={{fontSize:10,color:"#64748b"}}>$</span></div>
              <div style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:8,height:8,borderRadius:2,background:"#34d399"}}/><span style={{fontSize:10,color:"#64748b"}}>USD</span></div>
            </div>
          </div>
          <div style={{display:"flex",gap:4}}>
            <NavBtn dir="l" dis={si<=0} fn={()=>setBo(o=>Math.min(o+4,months.length-vb))}/>
            <NavBtn dir="r" dis={bo<=0} fn={()=>setBo(o=>Math.max(o-4,0))}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:8,height:210}}>
          {vis.map((k,i)=>{
            const last=si+i===months.length-1
            const hP=Math.max(4,(monthly[k].pesos/maxP)*160)
            const hasUSD=monthly[k]?.usd>0
            const hU=hasUSD?Math.max(4,(monthly[k].usd/maxU)*160):0
            return(
              <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{display:"flex",gap:2,justifyContent:"center",width:"100%"}}>
                  <span style={{fontSize:10,color:last?"#60a5fa":"#94a3b8",fontWeight:600,...mo}}>{fS(monthly[k].pesos)}</span>
                  {hasUSD&&<span style={{fontSize:10,color:"#34d399",fontWeight:600,...mo}}>/{fS(monthly[k].usd,true)}</span>}
                </div>
                <div style={{display:"flex",gap:3,width:"100%",alignItems:"flex-end",height:160}}>
                  <div onClick={()=>onViewMonth(k)} style={{flex:1,height:hP,borderRadius:"4px 4px 2px 2px",cursor:"pointer",background:last?"linear-gradient(180deg,#3b82f6,#1d4ed8)":"linear-gradient(180deg,#1e3a5f,#0f2440)"}}/>
                  <div onClick={()=>onViewMonth(k)} style={{flex:1,height:hasUSD?hU:0,borderRadius:"4px 4px 2px 2px",cursor:hasUSD?"pointer":"default",background:hasUSD?"linear-gradient(180deg,#34d399,#059669)":"transparent"}}/>
                </div>
                <div style={{fontSize:11,color:last?"#60a5fa":"#94a3b8",fontWeight:last?700:500}}>{fmtMonth(k)}</div>
              </div>
            )
          })}
        </div>
        {vis.length>0&&<div style={{fontSize:10,color:"#334155",textAlign:"center",marginTop:8}}>Tocá una barra para ver movimientos</div>}
      </div>

      {/* Inversiones - same months as gastos */}
      {vis.some(k=>monthly[k]?.inv>0)&&<div style={{...S.crdP,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>Inversiones mensuales</div>
          <div style={{display:"flex",gap:4}}>
            <NavBtn dir="l" dis={si<=0} fn={()=>setBo(o=>Math.min(o+4,months.length-vb))}/>
            <NavBtn dir="r" dis={bo<=0} fn={()=>setBo(o=>Math.max(o-4,0))}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:140}}>
          {vis.map(k=>{
            const invH=monthly[k]?.inv>0?(monthly[k].inv/maxI)*110:4
            return(
            <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}} onClick={()=>onViewMonthInv(k)}>
              {monthly[k]?.inv>0&&<div style={{fontSize:13,color:"#f59e0b",fontWeight:600,...mo}}>{fS(monthly[k].inv)}</div>}
              <div style={{width:"100%",height:invH,borderRadius:"6px 6px 2px 2px",background:monthly[k]?.inv>0?"linear-gradient(180deg,#f59e0b,#b45309)":"#0f1a2a"}}/>
              <div style={{fontSize:12,color:"#94a3b8",fontWeight:500}}>{fmtMonth(k)}</div>
            </div>)
          })}
        </div>
        {vis.length>0&&<div style={{fontSize:10,color:"#334155",textAlign:"center",marginTop:8}}>Tocá una barra para ver inversiones del mes</div>}
      </div>}

      {/* Inversión como % del ingreso */}
      {vis.some(k=>monthly[k]?.inv>0&&monthly[k]?.ing>0)&&<div style={{...S.crdP,marginBottom:20}}>
        <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>Inversión vs Ingreso</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:8,height:180}}>
          {vis.map(k=>{
            const ing=monthly[k]?.ing||0
            const inv=monthly[k]?.inv||0
            const pct=ing>0?Math.round((inv/ing)*100):0
            const isGood=pct>=20
            const barH=Math.max(4,Math.min(pct,100)/100*130)
            return(
              <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:13,fontWeight:700,color:pct===0?"#334155":isGood?"#4ade80":"#f87171"}}>{pct}%</div>
                <div style={{width:"100%",position:"relative",height:130,display:"flex",alignItems:"flex-end"}}>
                  <div style={{position:"absolute",top:130-130*0.2,left:0,right:0,height:1,borderTop:"1px dashed rgba(74,222,128,.3)"}}/>
                  <div style={{width:"100%",height:barH,borderRadius:"4px 4px 2px 2px",background:pct===0?"#0f1a2a":isGood?"linear-gradient(180deg,#4ade80,#16a34a)":"linear-gradient(180deg,#f87171,#dc2626)"}}/>
                </div>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>{fmtMonth(k)}</div>
              </div>
            )
          })}
        </div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:12,marginTop:10}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:1,borderTop:"1px dashed rgba(74,222,128,.4)"}}/><span style={{fontSize:10,color:"#64748b"}}>Meta 20%</span></div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:"#4ade80"}}/><span style={{fontSize:10,color:"#64748b"}}>≥20%</span></div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:"#f87171"}}/><span style={{fontSize:10,color:"#64748b"}}>&lt;20%</span></div>
        </div>
      </div>}

      {/* Pie */}
      <div style={S.crdP}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>Gastos por categoría</div>
          <select value={pieIdx} onChange={e=>setPi(parseInt(e.target.value))} style={{...S.inp,width:"auto",padding:"8px 14px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,.04)"}}>
            {allMonths.map((m,idx)=><option key={m} value={idx}>{fmtMonth(m)}</option>)}
          </select>
        </div>
        {ps.length===0?<div style={{textAlign:"center",color:"#475569",padding:30,fontSize:13}}>Sin datos</div>:<>
          <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
            <svg width="260" height="260" viewBox="-95 -95 190 190">
              {arcs.map((a,i)=><path key={i} d={a.d} fill={a.c} stroke="#0b1120" strokeWidth="1"/>)}
              <circle cx="0" cy="0" r="40" fill="#141c28"/>
              <text x="0" y="-6" textAnchor="middle" fill="#e2e8f0" fontSize="17" fontWeight="700" style={mo}>{f$(pt)}</text>
              <text x="0" y="14" textAnchor="middle" fill="#64748b" fontSize="11">TOTAL</text>
            </svg>
          </div>
          {ps.map(([cat,total],i)=>{
            const pct=pt>0?((total/pt)*100).toFixed(1):0
            const isExpanded=expandedCat===cat
            // Get subcategory breakdown
            const subTotals={}
            pe.filter(e=>e.categoria===cat).forEach(e=>{const s=e.subcategoria||"Sin detalle";subTotals[s]=(subTotals[s]||0)+e.monto})
            const subSorted=Object.entries(subTotals).sort((a,b)=>b[1]-a[1])
            return(
            <div key={cat} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,cursor:"pointer"}} onClick={()=>setExpandedCat(isExpanded?null:cat)}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:16}}>{catIcon(cat)}</div>
                  <div style={{width:12,height:12,borderRadius:3,background:COLORS[i%COLORS.length]}}/>
                  <span style={{fontSize:15,color:"#e2e8f0",fontWeight:500}}>{cat}</span>
                  <Ic d={isExpanded?IC.left:IC.right} s={12}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:14,color:"#94a3b8",fontWeight:500}}>{pct}%</span>
                  <span style={{fontSize:16,fontWeight:700,color:"#e2e8f0",...mo}}>{f$(total)}</span>
                </div>
              </div>
              <div style={{height:6,background:"#0f1a2a",borderRadius:3}}><div style={{width:`${pct}%`,height:"100%",background:COLORS[i%COLORS.length],borderRadius:3}}/></div>
              {isExpanded&&<div style={{marginTop:10,marginLeft:38,borderLeft:`2px solid ${COLORS[i%COLORS.length]}33`,paddingLeft:14}}>
                {subSorted.map(([sub,subTotal])=>{
                  const subPct=total>0?((subTotal/total)*100).toFixed(0):0
                  return(
                    <div key={sub} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:13,color:"#94a3b8"}}>{sub}</span>
                        <span style={{fontSize:11,color:"#475569"}}>{subPct}%</span>
                      </div>
                      <span style={{fontSize:14,fontWeight:600,color:"#cbd5e1",...mo}}>{f$(subTotal)}</span>
                    </div>
                  )
                })}
              </div>}
            </div>
          )})}
        </>}
      </div>
    </div>
  )
}

// ══════════════ MONTH DETAIL ══════════════
function MonthDetail({monthKey:mk2,filterTipo,movimientos,cuentas,onBack}){
  const isInv=filterTipo==="inversion"
  const isUSDCuenta=id=>cuentas.find(c=>c.id===id)?.moneda==="USD"
  const allMonth=movimientos.filter(m=>monthOf(m.fecha)===mk2).sort((a,b)=>b.fecha.localeCompare(a.fecha)||(b.created_at||"").localeCompare(a.created_at||""))
  const me=isInv
    ?allMonth.filter(m=>m.tipo==="inversion"||(m.tipo==="egreso"&&m.categoria==="Inversiones"))
    :allMonth.filter(m=>m.tipo==="egreso"&&m.categoria!=="Inversiones")
  const mePesos=me.filter(e=>!isUSDCuenta(e.cuenta_id))
  const meUSD=me.filter(e=>isUSDCuenta(e.cuenta_id))
  const totalPesos=mePesos.reduce((s,m)=>s+m.monto,0)
  const totalUSD=meUSD.reduce((s,m)=>s+m.monto,0)
  const totalInv=me.reduce((s,m)=>s+m.monto,0)
  const cuentaNombre=id=>cuentas.find(c=>c.id===id)?.nombre||""
  const fmtMonth=k=>{const[y,m]=k.split("-");const ml=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];return`${ml[parseInt(m)-1]} ${y}`}

  return(
    <div style={{className:"page-inner"}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#60a5fa",fontSize:13,cursor:"pointer",marginBottom:16,padding:0}}><Ic d={IC.left} s={16}/> Dashboard</button>
      <div style={S.sec}>{isInv?"Inversiones":"Gastos"} — {fmtMonth(mk2)}</div>
      {isInv
        ?<div style={{...S.crdP,marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>Total inversiones</div>
            <div style={{fontSize:22,fontWeight:700,color:"#f59e0b",...mo,marginTop:4}}>{f$(totalInv)}</div>
          </div>
        :<div style={{display:"grid",gridTemplateColumns:totalUSD>0?"1fr 1fr":"1fr",gap:10,marginBottom:20}}>
            <div style={{...S.crdP,textAlign:"center"}}>
              <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>Total pesos</div>
              <div style={{fontSize:20,fontWeight:700,color:"#e2e8f0",...mo,marginTop:4}}>{f$(totalPesos)}</div>
            </div>
            {totalUSD>0&&<div style={{...S.crdP,textAlign:"center",border:"1px solid rgba(52,211,153,.15)"}}>
              <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>Total USD</div>
              <div style={{fontSize:20,fontWeight:700,color:"#34d399",...mo,marginTop:4}}>{f$(totalUSD,true)}</div>
            </div>}
          </div>
      }
      <div style={S.crd}>
        {me.length===0&&<div style={{padding:30,textAlign:"center",color:"#475569",fontSize:13}}>Sin {isInv?"inversiones":"gastos"}</div>}
        {me.map((e,i)=>{
          const enUSD=isUSDCuenta(e.cuenta_id)
          return(
          <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:i<me.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:13,color:"#e2e8f0",fontWeight:500}}>{e.subcategoria||e.categoria}</span>
                {enUSD&&<span style={{fontSize:9,fontWeight:700,color:"#34d399",background:"rgba(52,211,153,.12)",padding:"2px 5px",borderRadius:4}}>USD</span>}
              </div>
              <div style={{fontSize:11,color:"#475569"}}>{e.fecha} · {e.categoria} · {cuentaNombre(e.cuenta_id)}</div>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:isInv?"#f59e0b":e.monto<0?"#4ade80":"#f87171",...mo}}>
              {isInv?"📈":e.monto<0?"+":"-"}{f$(Math.abs(e.monto),enUSD)}
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}

// ══════════════ DEUDA ══════════════
function DebtPage({deuda}){
  const hist=[...deuda].sort((a,b)=>a.fecha.localeCompare(b.fecha))
  const cb=hist[hist.length-1]?.saldo||0
  const tp=Math.abs(hist.filter(e=>e.monto<0).reduce((s,p)=>s+p.monto,0))
  const tb=hist.filter(e=>e.monto>0).reduce((s,p)=>s+p.monto,0)

  return(
    <div className="page-inner">
      <div style={S.sec}>Deuda Edgardo</div>
      <div style={{background:"linear-gradient(135deg,#450a0a 0%,#991b1b 100%)",borderRadius:24,padding:32,marginBottom:24,border:"1px solid rgba(239,68,68,.2)",textAlign:"center",boxShadow:"0 8px 40px rgba(153,27,27,.2)"}}>
        <div style={{fontSize:14,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:3,marginBottom:12,fontWeight:600}}>Saldo Actual</div>
        <div style={{fontSize:48,fontWeight:800,color:"#fca5a5",...mo,letterSpacing:-1}}>{f$(cb)}</div>
        <div style={{display:"flex",justifyContent:"center",gap:48,marginTop:24}}>
          <div><div style={{fontSize:13,color:"rgba(255,255,255,.4)",textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Prestado</div><div style={{fontSize:24,fontWeight:700,color:"#ef4444",...mo}}>{f$(tb)}</div></div>
          <div><div style={{fontSize:13,color:"rgba(255,255,255,.4)",textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Pagado</div><div style={{fontSize:24,fontWeight:700,color:"#4ade80",...mo}}>{f$(tp)}</div></div>
        </div>
      </div>
      <div style={{...S.crdP,marginBottom:16,background:"#0f1724",border:"1px solid rgba(255,255,255,.03)"}}><div style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>Los pagos se cargan desde <span style={{color:"#60a5fa"}}>Cargar → Egreso → Pago deuda → Edgardo</span></div></div>
      <div style={S.crd}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,.04)",fontSize:13,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1}}>Historial</div>
        <div style={{maxHeight:500,overflowY:"auto"}}>
          {[...hist].reverse().map((e,i)=>(
            <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,.02)"}}>
              <div><div style={{fontSize:15,color:"#e2e8f0",fontWeight:500}}>{e.descripcion}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{e.fecha}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:700,color:e.monto>0?"#f87171":"#4ade80",...mo}}>{e.monto>0?"+":""}{f$(e.monto)}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>Saldo: {f$(e.saldo)}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════ MOVIMIENTOS ══════════════
function MovimientosPage({movimientos,cuentas,userId,onSaved}){
  const[selMonth,setSelMonth]=useState(monthOf(today()))
  const[filterTipo,setFilterTipo]=useState("")
  const[filterCat,setFilterCat]=useState("")
  const[filterFrom,setFilterFrom]=useState("")
  const[filterTo,setFilterTo]=useState("")
  const[searched,setSearched]=useState(false)
  const[editId,setEditId]=useState(null)
  const[editForm,setEditForm]=useState({})
  const cuentaNombre=id=>cuentas.find(c=>c.id===id)?.nombre||""
  const isUSDCuenta=id=>cuentas.find(c=>c.id===id)?.moneda==="USD"

  const allMonths=[...new Set(movimientos.map(m=>monthOf(m.fecha)))].sort().reverse()
  const fmtMonthFull=k=>{const[y,m]=k.split("-");const ml=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];return`${ml[parseInt(m)-1]} ${y}`}

  const prevMonth=(k)=>{const[y,m]=k.split("-").map(Number);const pm=m===1?12:m-1;const py=m===1?y-1:y;return`${py}-${String(pm).padStart(2,"0")}`}

  let filtered=movimientos.filter(m=>monthOf(m.fecha)===selMonth)
  if(searched){
    if(filterTipo) filtered=filtered.filter(m=>m.tipo===filterTipo)
    if(filterCat) filtered=filtered.filter(m=>m.categoria===filterCat)
    if(filterFrom) filtered=filtered.filter(m=>m.fecha>=filterFrom)
    if(filterTo) filtered=filtered.filter(m=>m.fecha<=filterTo)
  }
  filtered.sort((a,b)=>b.fecha.localeCompare(a.fecha)||(b.created_at||"").localeCompare(a.created_at||""))

  const cats=[...new Set(movimientos.filter(m=>monthOf(m.fecha)===selMonth&&(!filterTipo||m.tipo===filterTipo)).map(m=>m.categoria))].sort()
  const egresosFiltrados=filtered.filter(m=>m.tipo==="egreso")
  const totalEgresos=egresosFiltrados.filter(m=>!isUSDCuenta(m.cuenta_id)).reduce((s,m)=>s+m.monto,0)
  const totalEgresosUSD=egresosFiltrados.filter(m=>isUSDCuenta(m.cuenta_id)).reduce((s,m)=>s+m.monto,0)

  const prevMk=prevMonth(selMonth)
  const allThisMonth=movimientos.filter(m=>monthOf(m.fecha)===selMonth)
  // Último sueldo del mes anterior (se cobra a fin de mes, se usa el mes siguiente)
  const sueldosPrev=movimientos.filter(m=>monthOf(m.fecha)===prevMk&&m.tipo==="ingreso"&&m.categoria==="Sueldo").sort((a,b)=>b.fecha.localeCompare(a.fecha))
  const sueldoPrevMonth=sueldosPrev.length>0?sueldosPrev[0].monto:0
  // Último sueldo del mes actual (se excluye porque corresponde al mes siguiente)
  const sueldosThis=allThisMonth.filter(m=>m.tipo==="ingreso"&&m.categoria==="Sueldo").sort((a,b)=>b.fecha.localeCompare(a.fecha))
  const ultimoSueldoThisId=sueldosThis.length>0?sueldosThis[0].id:null
  // Todos los ingresos del mes actual excepto el último sueldo
  const ingresosThisMonth=allThisMonth.filter(m=>m.tipo==="ingreso"&&m.id!==ultimoSueldoThisId).reduce((s,m)=>s+m.monto,0)
  const totalIngresos=sueldoPrevMonth+ingresosThisMonth

  const startEdit=(e)=>{setEditId(e.id);setEditForm({fecha:e.fecha,tipo:e.tipo,categoria:e.categoria,subcategoria:e.subcategoria||"",monto:e.monto,esUSD:isUSDCuenta(e.cuenta_id),cuenta_id:e.cuenta_id})}
  const cancelEdit=()=>{setEditId(null);setEditForm({})}
  const saveEdit=async()=>{
    const orig=movimientos.find(m=>m.id===editId)
    const newMonto=parseFloat(editForm.monto)
    const cambioMoneda=editForm.esUSD!==isUSDCuenta(orig.cuenta_id)
    const newCuentaId=cambioMoneda?(cuentas.find(c=>c.moneda===(editForm.esUSD?"USD":"ARS"))?.id||orig.cuenta_id):orig.cuenta_id
    // Reverse old effect on original account
    if(orig?.cuenta_id){
      const{data:fresh}=await supabase.from("cuentas").select("saldo").eq("id",orig.cuenta_id).single()
      if(fresh){
        const reversal=orig.tipo==="egreso"?orig.monto:orig.tipo==="ingreso"?-orig.monto:0
        const newDelta=cambioMoneda?0:(editForm.tipo==="egreso"?-newMonto:editForm.tipo==="ingreso"?newMonto:0)
        if(reversal!==0||newDelta!==0)
          await supabase.from("cuentas").update({saldo:fresh.saldo+reversal+newDelta}).eq("id",orig.cuenta_id)
      }
    }
    // If currency changed, apply new effect on new account
    if(cambioMoneda){
      const{data:freshNew}=await supabase.from("cuentas").select("saldo").eq("id",newCuentaId).single()
      if(freshNew){
        const newDelta=editForm.tipo==="egreso"?-newMonto:editForm.tipo==="ingreso"?newMonto:0
        if(newDelta!==0)
          await supabase.from("cuentas").update({saldo:freshNew.saldo+newDelta}).eq("id",newCuentaId)
      }
    }
    await supabase.from("movimientos").update({fecha:editForm.fecha,tipo:editForm.tipo,categoria:editForm.categoria,subcategoria:editForm.subcategoria||null,monto:newMonto,cuenta_id:newCuentaId}).eq("id",editId)
    setEditId(null);setEditForm({});onSaved()
  }
  const deleteRow=async(id)=>{
    if(!confirm("¿Eliminar este movimiento?"))return
    // Find the movement to reverse its saldo impact
    const mov=movimientos.find(m=>m.id===id)
    if(mov&&mov.cuenta_id){
      const{data:fresh}=await supabase.from("cuentas").select("saldo").eq("id",mov.cuenta_id).single()
      if(fresh){
        let reversal=0
        if(mov.tipo==="egreso") reversal=mov.monto  // egreso was -monto, so add it back
        else if(mov.tipo==="ingreso") reversal=-mov.monto  // ingreso was +monto, so subtract
        if(reversal!==0) await supabase.from("cuentas").update({saldo:fresh.saldo+reversal}).eq("id",mov.cuenta_id)
      }
      // If traspaso, also reverse the destination
      if(mov.tipo==="traspaso"&&mov.cuenta_destino_id){
        const{data:freshDest}=await supabase.from("cuentas").select("saldo").eq("id",mov.cuenta_destino_id).single()
        if(freshDest) await supabase.from("cuentas").update({saldo:freshDest.saldo-mov.monto}).eq("id",mov.cuenta_destino_id)
      }
    }
    await supabase.from("movimientos").delete().eq("id",id);onSaved()
  }

  const doSearch=()=>setSearched(true)
  const clearFilters=()=>{setFilterTipo("");setFilterCat("");setFilterFrom("");setFilterTo("");setSearched(false)}

  return(
    <div className="page-inner">
      <div style={S.sec}>Movimientos</div>

      <div style={{marginBottom:16}}>
        <select value={selMonth} onChange={e=>{setSelMonth(e.target.value);setSearched(false)}} style={{...S.inp,fontSize:16,fontWeight:600}}>
          {allMonths.map(m=><option key={m} value={m}>{fmtMonthFull(m)}</option>)}
        </select>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{...S.crdP,textAlign:"center"}}>
          <div style={{fontSize:11,color:"#f87171",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Egresos $</div>
          <div style={{fontSize:22,fontWeight:700,color:"#f87171",...mo}}>{f$(totalEgresos)}</div>
        </div>
        <div style={{...S.crdP,textAlign:"center",border:"1px solid rgba(248,113,113,.15)"}}>
          <div style={{fontSize:11,color:"#f87171",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Egresos USD</div>
          <div style={{fontSize:22,fontWeight:700,color:"#f87171",...mo}}>{f$(totalEgresosUSD,true)}</div>
        </div>
        <div style={{...S.crdP,textAlign:"center"}}>
          <div style={{fontSize:11,color:"#4ade80",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Ingresos</div>
          <div style={{fontSize:22,fontWeight:700,color:"#4ade80",...mo}}>{f$(totalIngresos)}</div>
        </div>
      </div>

      <div style={{...S.crdP,marginBottom:20}}>
        <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Filtros</div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[{v:"",l:"Todos"},{v:"egreso",l:"Egresos"},{v:"ingreso",l:"Ingresos"},{v:"traspaso",l:"Traspasos"},{v:"inversion",l:"Inversiones"}].map(t=>(
            <button key={t.v} onClick={()=>setFilterTipo(t.v)} style={{flex:1,padding:"8px 0",borderRadius:10,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",
              background:filterTipo===t.v?(t.v==="egreso"?"#dc2626":t.v==="ingreso"?"#16a34a":t.v==="traspaso"?"#3b82f6":t.v==="inversion"?"#f59e0b":"#3b82f6"):"rgba(255,255,255,.04)",
              color:filterTipo===t.v?"#fff":"#64748b"}}>{t.l}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <div>
            <label style={S.lbl}>Categoría</label>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...S.inp,fontSize:12}}>
              <option value="">Todas</option>
              {cats.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>Desde</label>
            <input type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} style={{...S.inp,fontSize:12}}/>
          </div>
          <div>
            <label style={S.lbl}>Hasta</label>
            <input type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)} style={{...S.inp,fontSize:12}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={doSearch} style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"linear-gradient(135deg,#3b82f6,#2563eb)",color:"#fff"}}>Buscar</button>
          {searched&&<button onClick={clearFilters} style={{padding:"10px 16px",borderRadius:10,border:"none",fontSize:12,cursor:"pointer",background:"#1e293b",color:"#94a3b8"}}>Limpiar</button>}
        </div>
      </div>

      <div style={{fontSize:13,color:"#64748b",marginBottom:12}}>{filtered.length} movimientos</div>

      <div style={S.crd}>
        <div style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.02)"}}>
          <div style={{width:36,flexShrink:0}}/>
          <div style={{flex:1,fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>Detalle</div>
          <div style={{width:90,textAlign:"right",fontSize:11,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>$</div>
          <div style={{width:80,textAlign:"right",fontSize:11,color:"#34d399",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>USD</div>
          <div style={{width:28,flexShrink:0}}/>
        </div>
        {filtered.length===0&&<div style={{padding:30,textAlign:"center",color:"#475569",fontSize:14}}>Sin movimientos</div>}
        {filtered.map((e,i)=>(
          editId===e.id?
          <div key={e.id} style={{padding:16,borderBottom:"1px solid rgba(255,255,255,.04)",background:"rgba(59,130,246,.05)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <input type="date" value={editForm.fecha} onChange={ev=>setEditForm(f=>({...f,fecha:ev.target.value}))} style={{...S.inp,fontSize:12}}/>
              <input type="number" value={editForm.monto} onChange={ev=>setEditForm(f=>({...f,monto:ev.target.value}))} style={{...S.inp,fontSize:12,...mo}} placeholder="Monto (negativo = devolución)"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
              <select value={editForm.tipo} onChange={ev=>setEditForm(f=>({...f,tipo:ev.target.value}))} style={{...S.inp,fontSize:12}}>
                <option value="egreso">Egreso</option>
                <option value="ingreso">Ingreso</option>
                <option value="traspaso">Traspaso</option>
                <option value="inversion">Inversión</option>
              </select>
              <input value={editForm.categoria} onChange={ev=>setEditForm(f=>({...f,categoria:ev.target.value}))} style={{...S.inp,fontSize:12}} placeholder="Categoría"/>
              <input value={editForm.subcategoria} onChange={ev=>setEditForm(f=>({...f,subcategoria:ev.target.value}))} style={{...S.inp,fontSize:12}} placeholder="Detalle"/>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,cursor:"pointer",fontSize:13,color:editForm.esUSD?"#34d399":"#94a3b8"}}>
              <input type="checkbox" checked={editForm.esUSD||false} onChange={ev=>setEditForm(f=>({...f,esUSD:ev.target.checked}))} style={{accentColor:"#34d399"}}/>
              <span style={{fontWeight:600}}>{editForm.esUSD?"USD 💵":"Pesos $"}</span>
              <span style={{fontSize:11,color:"#64748b"}}>(cambiar moneda)</span>
            </label>
            <div style={{display:"flex",gap:8}}>
              <button onClick={saveEdit} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:"#16a34a",color:"#fff"}}>Guardar</button>
              <button onClick={cancelEdit} style={{padding:"8px 16px",borderRadius:8,border:"none",fontSize:12,cursor:"pointer",background:"#1e293b",color:"#94a3b8"}}>Cancelar</button>
              <button onClick={()=>deleteRow(e.id)} style={{padding:"8px 16px",borderRadius:8,border:"none",fontSize:12,cursor:"pointer",background:"#7f1d1d",color:"#f87171"}}>Eliminar</button>
            </div>
          </div>
          :<div key={e.id} style={{display:"flex",alignItems:"center",padding:"14px 16px",borderBottom:i<filtered.length-1?"1px solid rgba(255,255,255,.04)":"none",gap:0}}>
            <div style={{width:36,height:36,borderRadius:10,background:`${catColor(e.categoria)}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{catIcon(e.categoria)}</div>
            <div style={{flex:1,minWidth:0,paddingLeft:10}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span style={{fontSize:14,color:"#e2e8f0",fontWeight:600}}>{e.subcategoria||e.categoria}</span>
                <Badge text={e.categoria}/>
              </div>
              <div style={{fontSize:12,color:"#64748b"}}>{e.fecha?.slice(5)||""} · {cuentaNombre(e.cuenta_id)}{e.tc?` · ${e.tc}`:""}</div>
            </div>
            {(()=>{
              const enUSD=isUSDCuenta(e.cuenta_id)
              const devolucion=e.tipo==="egreso"&&e.monto<0
              const col=e.tipo==="ingreso"||devolucion?"#4ade80":e.tipo==="traspaso"?"#60a5fa":"#f87171"
              const sign=e.tipo==="ingreso"||devolucion?"+":e.tipo==="egreso"?"-":"↔"
              const formatted=sign+f$(Math.abs(e.monto),enUSD)
              return<>
                <div style={{width:90,textAlign:"right",fontSize:14,fontWeight:700,color:enUSD?"transparent":col,...mo,whiteSpace:"nowrap"}}>{enUSD?"—":formatted}</div>
                <div style={{width:80,textAlign:"right",fontSize:14,fontWeight:700,color:enUSD?col:"transparent",...mo,whiteSpace:"nowrap"}}>{enUSD?formatted:"—"}</div>
              </>
            })()}
            <button onClick={()=>startEdit(e)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",padding:4,flexShrink:0,width:28}}><Ic d={IC.edit} s={14}/></button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════ EXTRACTO (PDF PARSER REAL) ══════════════
function ExtractPage({cuentas,userId,onSaved,egresoCats}){
  const[visaItems,setVisaItems]=useState([])
  const[masterItems,setMasterItems]=useState([])
  const[visaVto,setVisaVto]=useState("")
  const[masterVto,setMasterVto]=useState("")
  const[saving,setSaving]=useState("")
  const[done,setDone]=useState("")
  const visaRef=useRef(null)
  const masterRef=useRef(null)

  const MM={"Ene":"01","Feb":"02","Mar":"03","Abr":"04","May":"05","Jun":"06","Jul":"07","Ago":"08","Sep":"09","Oct":"10","Nov":"11","Dic":"12","Enero":"01","Febrero":"02","Marzo":"03","Abril":"04","Mayo":"05","Junio":"06","Julio":"07","Agosto":"08","Septiembre":"09","Octubre":"10","Noviembre":"11","Diciembre":"12","Noviem":"11","Diciem":"12","Setiem":"09"}
  const catMap={"SPOTIFY":"Apps","NETFLIX":"Apps","YOUTUBE":"Apps","GOOGLE":"Apps","APPLE":"Apps","LINKEDIN":"Apps","ADOBE":"Apps","OPENAI":"Apps","CLAUDE":"Apps","EMOVA":"Transporte","SUBTE":"Transporte","AUTOPISTA":"Auto","MAPFRE":"Auto","UBER":"Transporte","DIDI":"Transporte","RAPPI":"Compras","COTO":"Compras","DISCO":"Compras","SUPERMERCADO":"Compras","FARMACITY":"Compras","ZARA":"Compras","GRIMOLDI":"Compras","DEXTER":"Compras","NIKE":"Compras","ADIDAS":"Compras","MC DONALD":"Salidas","BURGER":"Salidas","RESTAURANT":"Salidas","GRILL":"Salidas","SUSHI":"Salidas","BIRRA":"Salidas","ALMIRO":"Salidas","ESTACIONAMIENTO":"Transporte","PARKING":"Transporte","CLUB ATLETICO BO":"Boca Juniors","SPORT CLUB":"Entrenamiento","TELEPEAJ":"Auto","VIALES":"Auto","AUBASA":"Auto","CODERHOUSE":"Estudios","PERSFLOW":"Departamento","URBA":"Auto","FUNDACIO":"Regalos","VIVARIUM":"Salidas"}
  const autoCat=desc=>{const u=desc.toUpperCase();for(const[k,v] of Object.entries(catMap)){if(u.includes(k))return v};return""}

  const parseMC=(text)=>{
    const vtoMatch=text.match(/Vencimiento actual:\s+(\d{2})-(\w+)-(\d{2})/)
    let vto=""
    if(vtoMatch){const[,d,m,y]=vtoMatch;vto=`20${y}-${MM[m]||"01"}-${d}`}
    const results=[];const lines=text.split("\n");let inSection=false
    for(const line of lines){
      if(line.includes("COMPRAS DEL MES")||line.includes("DEBITOS AUTOMATICOS")||line.includes("CUOTAS DEL MES"))inSection=true
      if(line.includes("TOTAL TITULAR"))break
      if(!inSection)continue
      const m2=line.match(/^(\d{2})-(\w{3})-(\d{2})\s+(.+?)\s+(\d{5})\s+([\d.,-]+)?\s*([\d.,-]+)?$/)
      if(m2){const[,,,,,, pesos,usd]=m2;const desc=m2[4].trim();const parseN=s=>s?parseFloat(s.replace(/\./g,"").replace(",",".")):0;const amtP=parseN(pesos);if(amtP!==0)results.push({desc,pesos:amtP,status:"pending",cat:autoCat(desc)})}
    }
    return{vto,results}
  }

  const parseVisa=(text)=>{
    const vtoMatch=text.match(/VENCIMIENTO\s+(\d{2})\s+(\w+)\s+(\d{2})/)
    let vto=""
    if(vtoMatch){const[,d,m,y]=vtoMatch;vto=`20${y}-${MM[m]||"01"}-${d}`}
    const results=[];const lines=text.split("\n")
    for(const line of lines){
      if(line.includes("Total Consumos de"))break
      if(line.includes("SALDO ANTERIOR")||line.includes("SU PAGO")||line.includes("DEV")||line.includes("CANCEL")||line.includes("INTERESES")||line.includes("IIBB")||line.includes("IVA RG")||line.includes("DB.RG"))continue
      const m2=line.match(/^\s*(\d{2})\s+(\w+\.?)\s+(\d{2})\s+(\d{6})\s+([*KVPU])\s+(.+?)\s+([\d.,-]+)\s*([\d,.]+)?$/)
      if(m2){const desc=m2[6].trim().replace(/\s+C\.\d+\/\d+$/,"");const parseN=s=>s?parseFloat(s.replace(/\./g,"").replace(",",".")):0;const amtP=parseN(m2[7]);if(amtP!==0)results.push({desc,pesos:amtP,status:"pending",cat:autoCat(desc)})}
    }
    return{vto,results}
  }

  const handleFile=(type)=>(e)=>{
    const file=e.target.files[0];if(!file)return
    const reader=new FileReader()
    reader.onload=(ev)=>{
      const text=ev.target.result
      if(type==="visa"){const r=parseVisa(text);setVisaItems(r.results);setVisaVto(r.vto)}
      else{const r=parseMC(text);setMasterItems(r.results);setMasterVto(r.vto)}
    }
    reader.readAsText(file)
  }

  const setStatus=(type,i,s)=>{
    const setter=type==="visa"?setVisaItems:setMasterItems
    setter(prev=>{const n=[...prev];n[i]={...n[i],status:s};return n})
  }
  const setCat=(type,i,c)=>{
    const setter=type==="visa"?setVisaItems:setMasterItems
    setter(prev=>{const n=[...prev];n[i]={...n[i],cat:c};return n})
  }
  const editDesc=(type,i,d)=>{
    const setter=type==="visa"?setVisaItems:setMasterItems
    setter(prev=>{const n=[...prev];n[i]={...n[i],desc:d};return n})
  }

  const doConfirm=async(type)=>{
    setSaving(type)
    const items=type==="visa"?visaItems:masterItems
    const vto=type==="visa"?visaVto:masterVto
    const tc=type==="visa"?"V":"M"
    const bapro=cuentas.find(c=>c.nombre==="BAPRO $")
    const accepted=items.filter(p=>p.status==="accepted"&&p.pesos!==0)
    const rows=accepted.map(p=>({user_id:userId,fecha:vto||today(),tipo:"egreso",categoria:p.cat||"Otros",subcategoria:p.desc,monto:Math.abs(p.pesos),cuenta_id:bapro?.id,tc}))
    if(rows.length>0){
      await supabase.from("movimientos").insert(rows)
      // Read fresh balance
      const{data:fresh}=await supabase.from("cuentas").select("saldo").eq("id",bapro?.id).single()
      if(fresh){
        const totalDelta=rows.reduce((s,r)=>s-r.monto,0)
        await supabase.from("cuentas").update({saldo:fresh.saldo+totalDelta}).eq("id",bapro.id)
      }
    }
    onSaved();setDone(type);setSaving("")
    setTimeout(()=>{setDone("");if(type==="visa")setVisaItems([]);else setMasterItems([])},2000)
  }

  const renderCard=(type,items,vto,setVto,fileRef)=>{
    const accepted=items.filter(p=>p.status==="accepted").length
    const pending=items.filter(p=>p.status==="pending").length
    const isVisa=type==="visa"
    const color=isVisa?"#3b82f6":"#f59e0b"
    const label=isVisa?"VISA":"MASTERCARD"

    return(
      <div style={{...S.crdP,marginBottom:20,border:`1px solid ${color}22`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:700,color}}>{label}</div>
          {vto&&<div style={{fontSize:12,color:"#64748b"}}>Vto: {vto}</div>}
        </div>

        {items.length===0?<>
          <input ref={fileRef} type="file" accept=".pdf,.txt" onChange={handleFile(type)} style={{display:"none"}}/>
          <button onClick={()=>fileRef.current?.click()} style={{width:"100%",padding:20,borderRadius:14,border:`2px dashed ${color}33`,background:`${color}08`,color,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Ic d={IC.upload} s={20}/> Subir PDF {label}
          </button>
        </>:<>
          {vto&&<div style={{marginBottom:12}}><label style={S.lbl}>Fecha de débito</label><input type="date" value={vto} onChange={e=>setVto(e.target.value)} style={{...S.inp,fontSize:12}}/></div>}

          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{flex:1,textAlign:"center",padding:8,borderRadius:10,background:"rgba(245,158,11,.08)"}}>
              <div style={{fontSize:16,fontWeight:700,color:"#f59e0b",...mo}}>{pending}</div>
              <div style={{fontSize:10,color:"#64748b"}}>Pendientes</div>
            </div>
            <div style={{flex:1,textAlign:"center",padding:8,borderRadius:10,background:"rgba(74,222,128,.08)"}}>
              <div style={{fontSize:16,fontWeight:700,color:"#4ade80",...mo}}>{accepted}</div>
              <div style={{fontSize:10,color:"#64748b"}}>Aceptados</div>
            </div>
          </div>

          <div style={{maxHeight:400,overflowY:"auto",borderRadius:12,border:"1px solid rgba(255,255,255,.04)"}}>
            {items.map((p,i)=>p.status==="rejected"?null:(
              <div key={i} style={{padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,.03)",background:p.status==="accepted"?"rgba(74,222,128,.03)":"transparent"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <input value={p.desc} onChange={e=>editDesc(type,i,e.target.value)} style={{...S.inp,fontSize:12,padding:"6px 10px",flex:1,background:"transparent"}}/>
                  <span style={{fontSize:14,fontWeight:700,color:p.pesos<0?"#4ade80":"#f87171",...mo,whiteSpace:"nowrap"}}>{p.pesos<0?"+":"-"}{f$(Math.abs(p.pesos))}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <select value={p.cat} onChange={e=>setCat(type,i,e.target.value)} style={{...S.inp,fontSize:11,padding:"4px 8px",flex:1,color:p.cat?"#e2e8f0":"#475569"}}>
                    <option value="">Categoría...</option>
                    {(egresoCats||EGRESO_CATS).map(c=><option key={c}>{c}</option>)}
                  </select>
                  {p.status==="pending"?<>
                    <button onClick={()=>setStatus(type,i,"accepted")} style={{padding:"4px 12px",borderRadius:8,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:"#16a34a",color:"#fff"}}>✓</button>
                    <button onClick={()=>setStatus(type,i,"rejected")} style={{padding:"4px 12px",borderRadius:8,border:"none",fontSize:11,cursor:"pointer",background:"#7f1d1d",color:"#f87171"}}>✗</button>
                  </>:<button onClick={()=>setStatus(type,i,"pending")} style={{padding:"4px 12px",borderRadius:8,border:"none",fontSize:11,cursor:"pointer",background:"#1e293b",color:"#94a3b8"}}>↩</button>}
                </div>
              </div>
            ))}
          </div>

          {accepted>0&&<button onClick={()=>doConfirm(type)} disabled={saving===type} style={{marginTop:14,width:"100%",padding:14,borderRadius:12,border:"none",fontSize:14,fontWeight:700,cursor:"pointer",background:done===type?"#16a34a":`linear-gradient(135deg,${color},${isVisa?"#1d4ed8":"#b45309"})`,color:"#fff"}}>
            {done===type?"✓ Confirmado":saving===type?"Guardando...":`Confirmar ${accepted} gastos de ${label}`}
          </button>}
        </>}
      </div>
    )
  }

  return(
    <div className="page-inner">
      <div style={S.sec}>Importar Extractos de Tarjeta</div>
      <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Subí cada PDF por separado. Revisá y aceptá concepto por concepto. Recién al confirmar se impactan en tus movimientos y saldos.</div>
      {renderCard("visa",visaItems,visaVto,setVisaVto,visaRef)}
      {renderCard("master",masterItems,masterVto,setMasterVto,masterRef)}
    </div>
  )
}

// ══════════════ ABM CONFIGURACIÓN ══════════════
function ABMPage({cuentas,userId,onSaved}){
  const[tab,setTab]=useState("cuentas")
  const[catEgreso,setCatEgreso]=useState([])
  const[subEgreso,setSubEgreso]=useState([])
  const[catIngreso,setCatIngreso]=useState([])
  const[tiposInv,setTiposInv]=useState([])
  const[newVal,setNewVal]=useState("")
  const[newSub,setNewSub]=useState("")
  const[selCatId,setSelCatId]=useState("")
  const[newCuenta,setNewCuenta]=useState({nombre:"",moneda:"ARS",saldo:""})

  const loadABM=useCallback(async()=>{
    const[{data:ce},{data:se},{data:ci},{data:ti}]=await Promise.all([
      supabase.from("categorias_egreso").select("*").order("nombre"),
      supabase.from("subcategorias_egreso").select("*").order("nombre"),
      supabase.from("categorias_ingreso").select("*").order("nombre"),
      supabase.from("tipos_inversion").select("*").order("nombre"),
    ])
    setCatEgreso(ce||[]);setSubEgreso(se||[]);setCatIngreso(ci||[]);setTiposInv(ti||[])
  },[])

  useEffect(()=>{loadABM()},[loadABM])

  const addCatEgreso=async()=>{if(!newVal.trim())return;await supabase.from("categorias_egreso").insert({user_id:userId,nombre:newVal.trim()});setNewVal("");loadABM();onSaved()}
  const delCatEgreso=async(id)=>{await supabase.from("categorias_egreso").delete().eq("id",id);loadABM();onSaved()}
  const addSubEgreso=async()=>{if(!newSub.trim()||!selCatId)return;await supabase.from("subcategorias_egreso").insert({user_id:userId,categoria_id:selCatId,nombre:newSub.trim()});setNewSub("");loadABM();onSaved()}
  const delSubEgreso=async(id)=>{await supabase.from("subcategorias_egreso").delete().eq("id",id);loadABM();onSaved()}
  const addCatIngreso=async()=>{if(!newVal.trim())return;await supabase.from("categorias_ingreso").insert({user_id:userId,nombre:newVal.trim()});setNewVal("");loadABM();onSaved()}
  const delCatIngreso=async(id)=>{await supabase.from("categorias_ingreso").delete().eq("id",id);loadABM();onSaved()}
  const addTipoInv=async()=>{if(!newVal.trim())return;await supabase.from("tipos_inversion").insert({user_id:userId,nombre:newVal.trim()});setNewVal("");loadABM();onSaved()}
  const delTipoInv=async(id)=>{await supabase.from("tipos_inversion").delete().eq("id",id);loadABM();onSaved()}
  const addCuenta=async()=>{if(!newCuenta.nombre.trim())return;await supabase.from("cuentas").insert({user_id:userId,nombre:newCuenta.nombre.trim(),moneda:newCuenta.moneda,saldo:parseFloat(newCuenta.saldo)||0});setNewCuenta({nombre:"",moneda:"ARS",saldo:""});onSaved()}
  const delCuenta=async(id)=>{if(!confirm("¿Eliminar esta cuenta?"))return;await supabase.from("cuentas").delete().eq("id",id);onSaved()}

  const tabs=[{id:"cuentas",l:"Cuentas"},{id:"egresos",l:"Egresos"},{id:"ingresos",l:"Ingresos"},{id:"inversiones",l:"Inversiones"}]
  const DelBtn=({fn})=><button onClick={fn} style={{background:"none",border:"none",color:"#7f1d1d",cursor:"pointer",padding:4,fontSize:16}}>×</button>

  return(
    <div className="page-inner">
      <div style={S.sec}>Configuración</div>

      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setNewVal("")}} style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:tab===t.id?"#3b82f6":"#141c28",color:tab===t.id?"#fff":"#64748b"}}>{t.l}</button>)}
      </div>

      {tab==="cuentas"&&<>
        <div style={S.crd}>
          {cuentas.map((c,i)=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:i<cuentas.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
              <div><div style={{fontSize:15,color:"#e2e8f0",fontWeight:500}}>{c.nombre}</div><div style={{fontSize:12,color:"#64748b"}}>{c.moneda} · Saldo: {f$(c.saldo,c.moneda==="USD")}</div></div>
              <DelBtn fn={()=>delCuenta(c.id)}/>
            </div>
          ))}
        </div>
        <div style={{...S.crdP,marginTop:16}}>
          <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Nueva Cuenta</div>
          <input value={newCuenta.nombre} onChange={e=>setNewCuenta(p=>({...p,nombre:e.target.value}))} placeholder="Nombre" style={{...S.inp,marginBottom:8}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <select value={newCuenta.moneda} onChange={e=>setNewCuenta(p=>({...p,moneda:e.target.value}))} style={S.inp}><option value="ARS">ARS</option><option value="USD">USD</option></select>
            <input type="number" value={newCuenta.saldo} onChange={e=>setNewCuenta(p=>({...p,saldo:e.target.value}))} placeholder="Saldo inicial" style={{...S.inp,...mo}}/>
          </div>
          <button onClick={addCuenta} style={{width:"100%",padding:12,borderRadius:10,border:"none",fontSize:14,fontWeight:600,cursor:"pointer",background:"#3b82f6",color:"#fff"}}>Agregar Cuenta</button>
        </div>
      </>}

      {tab==="egresos"&&<>
        <div style={S.crd}>
          {catEgreso.map((c,i)=>{
            const subs=subEgreso.filter(s=>s.categoria_id===c.id)
            return(
              <div key={c.id} style={{borderBottom:i<catEgreso.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px"}}>
                  <div style={{fontSize:15,color:"#e2e8f0",fontWeight:600}}>{c.nombre}</div>
                  <DelBtn fn={()=>delCatEgreso(c.id)}/>
                </div>
                {subs.length>0&&<div style={{padding:"0 16px 8px",display:"flex",flexWrap:"wrap",gap:6}}>
                  {subs.map(s=>(
                    <span key={s.id} style={{display:"flex",alignItems:"center",gap:2,padding:"4px 10px",borderRadius:12,background:"#1e293b",fontSize:11,color:"#94a3b8"}}>{s.nombre}<button onClick={()=>delSubEgreso(s.id)} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:12,padding:0,marginLeft:4}}>×</button></span>
                  ))}
                </div>}
              </div>
            )
          })}
        </div>
        <div style={{...S.crdP,marginTop:16}}>
          <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Nueva Categoría</div>
          <div style={{display:"flex",gap:8}}>
            <input value={newVal} onChange={e=>setNewVal(e.target.value)} placeholder="Nombre categoría" style={{...S.inp,flex:1}}/>
            <button onClick={addCatEgreso} style={{padding:"0 20px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"#3b82f6",color:"#fff"}}>+</button>
          </div>
        </div>
        <div style={{...S.crdP,marginTop:12}}>
          <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Nueva Subcategoría</div>
          <select value={selCatId} onChange={e=>setSelCatId(e.target.value)} style={{...S.inp,marginBottom:8}}>
            <option value="">Elegir categoría padre...</option>
            {catEgreso.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <div style={{display:"flex",gap:8}}>
            <input value={newSub} onChange={e=>setNewSub(e.target.value)} placeholder="Nombre subcategoría" style={{...S.inp,flex:1}}/>
            <button onClick={addSubEgreso} style={{padding:"0 20px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"#8b5cf6",color:"#fff"}}>+</button>
          </div>
        </div>
      </>}

      {tab==="ingresos"&&<>
        <div style={S.crd}>
          {catIngreso.map((c,i)=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:i<catIngreso.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
              <div style={{fontSize:15,color:"#e2e8f0"}}>{c.nombre}</div>
              <DelBtn fn={()=>delCatIngreso(c.id)}/>
            </div>
          ))}
        </div>
        <div style={{...S.crdP,marginTop:16}}>
          <div style={{display:"flex",gap:8}}>
            <input value={newVal} onChange={e=>setNewVal(e.target.value)} placeholder="Nueva categoría de ingreso" style={{...S.inp,flex:1}}/>
            <button onClick={addCatIngreso} style={{padding:"0 20px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"#16a34a",color:"#fff"}}>+</button>
          </div>
        </div>
      </>}

      {tab==="inversiones"&&<>
        <div style={S.crd}>
          {tiposInv.map((t,i)=>(
            <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:i<tiposInv.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
              <div style={{fontSize:15,color:"#e2e8f0"}}>{t.nombre}</div>
              <DelBtn fn={()=>delTipoInv(t.id)}/>
            </div>
          ))}
        </div>
        <div style={{...S.crdP,marginTop:16}}>
          <div style={{display:"flex",gap:8}}>
            <input value={newVal} onChange={e=>setNewVal(e.target.value)} placeholder="Nuevo tipo de inversión" style={{...S.inp,flex:1}}/>
            <button onClick={addTipoInv} style={{padding:"0 20px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:"#f59e0b",color:"#000"}}>+</button>
          </div>
        </div>
      </>}
    </div>
  )
}

// ══════════════ MAIN APP ══════════════
export default function App(){
  const[user,setUser]=useState(null)
  const[loading,setLoading]=useState(true)
  const[pg,setPg]=useState("home")
  const[cuentas,setCuentas]=useState([])
  const[movimientos,setMovimientos]=useState([])
  const[deuda,setDeuda]=useState([])
  const[detailMonth,setDetailMonth]=useState(null)
  const[detailTipo,setDetailTipo]=useState(null)
  const[catEgreso,setCatEgreso]=useState([])
  const[subEgreso,setSubEgreso]=useState([])
  const[catIngreso,setCatIngreso]=useState([])
  const[tiposInv,setTiposInv]=useState([])

  // Auth listener
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user||null);setLoading(false)})
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{setUser(session?.user||null)})
    return()=>subscription.unsubscribe()
  },[])

  // Load data
  const loadData=useCallback(async()=>{
    if(!user)return
    const[{data:c},{data:m},{data:d},{data:ce},{data:se},{data:ci},{data:ti}]=await Promise.all([
      supabase.from("cuentas").select("*").order("nombre"),
      supabase.from("movimientos").select("*").order("fecha",{ascending:false}).order("created_at",{ascending:false}),
      supabase.from("deuda_edgardo").select("*").order("fecha",{ascending:true}),
      supabase.from("categorias_egreso").select("*").order("nombre"),
      supabase.from("subcategorias_egreso").select("*").order("nombre"),
      supabase.from("categorias_ingreso").select("*").order("nombre"),
      supabase.from("tipos_inversion").select("*").order("nombre"),
    ])
    setCuentas(c||[]);setMovimientos(m||[]);setDeuda(d||[])
    setCatEgreso(ce||[]);setSubEgreso(se||[]);setCatIngreso(ci||[]);setTiposInv(ti||[])
  },[user])

  useEffect(()=>{loadData()},[loadData])

  const logout=async()=>{await supabase.auth.signOut();setUser(null)}

  if(loading)return<div style={{minHeight:"100vh",background:"#0b1120",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>Cargando...</div>
  if(!user)return<LoginPage/>

  // Build dynamic categories from ABM tables (fallback to hardcoded if empty)
  const dynEgresoCats=catEgreso.length>0?catEgreso.map(c=>c.nombre):EGRESO_CATS
  const dynEgresoSubs=catEgreso.length>0?Object.fromEntries(catEgreso.map(c=>[c.nombre,subEgreso.filter(s=>s.categoria_id===c.id).map(s=>s.nombre)])):EGRESO_SUBS
  const dynIngresoCats=catIngreso.length>0?catIngreso.map(c=>c.nombre):INGRESO_CATS
  const dynInvTypes=tiposInv.length>0?tiposInv.map(t=>t.nombre):INV_TYPES

  const nav=[{id:"home",ic:IC.home,l:"Inicio"},{id:"add",ic:IC.plus,l:"Cargar"},{id:"mov",ic:IC.list,l:"Movimientos"},{id:"dash",ic:IC.chart,l:"Dashboard"},{id:"debt",ic:IC.debt,l:"Deuda"},{id:"ext",ic:IC.upload,l:"Extracto"},{id:"abm",ic:IC.settings,l:"Configuración"}]
  const viewMonth=k=>{setDetailMonth(k);setDetailTipo(null);setPg("md")}
  const viewMonthInv=k=>{setDetailMonth(k);setDetailTipo("inversion");setPg("md")}
  const onSaved=()=>loadData()

  let C
  if(pg==="home")C=<HomePage cuentas={cuentas} movimientos={movimientos}/>
  else if(pg==="add")C=<AddPage cuentas={cuentas} userId={user.id} onSaved={onSaved} egresoCats={dynEgresoCats} egresoSubs={dynEgresoSubs} ingresoCats={dynIngresoCats} invTypes={dynInvTypes}/>
  else if(pg==="mov")C=<MovimientosPage movimientos={movimientos} cuentas={cuentas} userId={user.id} onSaved={onSaved}/>
  else if(pg==="dash")C=<DashboardPage movimientos={movimientos} cuentas={cuentas} onViewMonth={viewMonth} onViewMonthInv={viewMonthInv}/>
  else if(pg==="md")C=<MonthDetail monthKey={detailMonth} filterTipo={detailTipo} movimientos={movimientos} cuentas={cuentas} onBack={()=>setPg("dash")}/>
  else if(pg==="debt")C=<DebtPage deuda={deuda}/>
  else if(pg==="ext")C=<ExtractPage cuentas={cuentas} userId={user.id} onSaved={onSaved} egresoCats={dynEgresoCats}/>
  else if(pg==="abm")C=<ABMPage cuentas={cuentas} userId={user.id} onSaved={onSaved}/>

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#070b14 0%,#0b1120 30%,#0d1525 60%,#091018 100%)",color:"#e2e8f0",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* Desktop sidebar */}
      <div className="sidebar">
        <div style={{padding:"28px 20px 24px"}}>
          <h1 style={{fontSize:24,fontWeight:800,margin:0,letterSpacing:-.5,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MisGastos</h1>
          <div style={{fontSize:11,color:"#475569",marginTop:6}}>{user.email}</div>
        </div>
        <nav style={{flex:1,padding:"8px 12px"}}>
          {nav.map(n=>{const a=pg===n.id||(pg==="md"&&n.id==="dash");return(
            <button key={n.id} onClick={()=>setPg(n.id)} style={{
              display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 16px",marginBottom:4,
              borderRadius:14,border:"none",cursor:"pointer",transition:"all .15s",
              background:a?"linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.1))":"transparent",
              color:a?"#60a5fa":"#64748b",
              boxShadow:a?"0 2px 12px rgba(59,130,246,.08)":"none"
            }}>
              <Ic d={n.ic} s={20}/>
              <span style={{fontSize:14,fontWeight:a?600:400}}>{n.l}</span>
            </button>
          )})}
        </nav>
        <div style={{padding:"16px 12px",borderTop:"1px solid rgba(255,255,255,.04)"}}>
          <button onClick={logout} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 16px",borderRadius:12,border:"none",cursor:"pointer",background:"transparent",color:"#475569",fontSize:14}}>
            <Ic d={IC.logout} s={18}/> Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Mobile header */}
        <div className="mobile-header">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><h1 style={{fontSize:22,fontWeight:800,margin:0,letterSpacing:-.5,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MisGastos</h1><div style={{fontSize:11,color:"#475569",marginTop:2}}>{user.email}</div></div>
            <button onClick={logout} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",padding:8}}><Ic d={IC.logout} s={18}/></button>
          </div>
        </div>

        {/* Desktop header */}
        <div className="desktop-header">
          <h2 style={{fontSize:18,fontWeight:700,color:"#f1f5f9",margin:0}}>
            {pg==="home"?"Inicio":pg==="add"?"Cargar Movimiento":pg==="mov"?"Movimientos":pg==="dash"?"Dashboard":pg==="md"?"Detalle Mensual":pg==="debt"?"Deuda Edgardo":pg==="ext"?"Importar Extracto":pg==="abm"?"Configuración":""}
          </h2>
        </div>

        <div className="page-content">{C}</div>

        {/* Mobile bottom nav */}
        <div className="mobile-nav">
          <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"0 8px"}}>
            {nav.map(n=>{const a=pg===n.id||(pg==="md"&&n.id==="dash");return(
              <button key={n.id} onClick={()=>setPg(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",padding:"8px 12px",color:a?"#3b82f6":"#475569"}}>
                {n.id==="add"?<div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 20px rgba(59,130,246,.35)",color:"#fff"}}><Ic d={n.ic} s={24}/></div>:<Ic d={n.ic} s={20}/>}
                <span style={{fontSize:10,fontWeight:a?600:400}}>{n.l}</span>
              </button>
            )})}
          </div>
        </div>
      </div>

      <style>{`
        *{box-sizing:border-box}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(.7)}
        select{appearance:auto;background-color:#131a2b!important;color:#e2e8f0}
        select option{background:#131a2b;color:#e2e8f0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:5px}
        input:focus,select:focus,textarea:focus{border-color:rgba(59,130,246,.4)!important;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
        button:active{transform:scale(.97)}

        .page-inner{padding:0 16px 100px}

        .sidebar{display:none}
        .mobile-header{padding:20px 16px 12px;border-bottom:1px solid rgba(255,255,255,.04)}
        .desktop-header{display:none}
        .main-content{max-width:480px;margin:0 auto;position:relative}
        .page-content{padding-top:16px}
        .mobile-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:linear-gradient(180deg,rgba(11,17,32,0) 0%,rgba(11,17,32,.97) 25%,#0b1120 45%);padding-top:24px;padding-bottom:14px;backdrop-filter:blur(12px)}

        @media(min-width:768px){
          .sidebar{
            display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;width:240px;
            background:linear-gradient(180deg,#080d18,#0a1020);border-right:1px solid rgba(255,255,255,.06);z-index:10;
          }
          .mobile-header{display:none}
          .mobile-nav{display:none}
          .desktop-header{
            display:block;padding:28px 36px 20px;border-bottom:1px solid rgba(255,255,255,.04);
          }
          .main-content{
            margin-left:240px;max-width:none;padding-bottom:32px;
          }
          .page-content{
            padding:20px 36px 36px;max-width:920px;
          }
          .page-inner{padding:0!important}
        }

        @media(min-width:1200px){
          .sidebar{width:280px}
          .main-content{margin-left:280px}
          .page-content{max-width:1000px;padding:28px 48px 48px}
        }
      `}</style>
    </div>
  )
}
