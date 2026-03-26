import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "./supabase.js"

// ── CONSTANTS ──
const EGRESO_CATS=["Salidas","Compras","Departamento","Auto","Apps","Entrenamiento","Transporte","Préstamo","Boca Juniors","Módulo","Cuidado Personal","Regalos","Comida laboral","Estudios","Pago deuda","Gastos Tarjeta","Otros"]
const EGRESO_SUBS={"Salidas":["Comidas / Bares","Boliches / Fiestas","Recitales","Otras"],"Compras":["Supermercado","Delivery","Ropa","Farmacia","Verdulería","Carnicería","Dietética","Departamento","Otros"],"Departamento":["Cuota Hipotecario","Metrogas","Edesur","Internet","Expensas","Seguro"],"Auto":["Nafta","Seguro","Peajes","Cochera","Lavadero","Multa","Cuota Préstamo"],"Apps":["Spotify","YouTube","Netflix","LinkedIn","Adobe"],"Entrenamiento":["Gimnasio"],"Transporte":["UBER","SUBE","Estacionamiento"],"Préstamo":["Préstamo","Fapa","Chino","Andi","Coco","Marcos","Gabriela","Andino"],"Boca Juniors":["Cuota Socio","Cancha"],"Módulo":["Módulo Sanitario"],"Cuidado Personal":["Proteína","Peluquería","Terapia","Creatina"],"Regalos":["Edgardo","Nancy","Otros"],"Comida laboral":["Almuerzo"],"Estudios":["Inglés","Coderhouse"],"Pago deuda":["Edgardo"],"Gastos Tarjeta":["Impuestos e intereses"],"Otros":["Apuestas","Otros"]}
const INGRESO_CATS=["Sueldo","Incentivado / SAC","Inversiones - Intereses Ganados","Otros Ingresos"]
const INV_TYPES=["Compra/venta USD","CEDEARs / Acciones","Caución / Plazo fijo","Crypto / Otros"]
const COLORS=["#3b82f6","#8b5cf6","#f59e0b","#ef4444","#10b981","#ec4899","#14b8a6","#f97316","#6366f1","#84cc16","#06b6d4","#e11d48","#a3e635","#7c3aed","#fb923c","#2dd4bf","#c084fc","#facc15","#f43f5e","#34d399"]

const f$=(n,u)=>{const a=Math.abs(n||0);return u?`USD ${a.toLocaleString("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2})}`:`$${a.toLocaleString("es-AR",{maximumFractionDigits:0})}`}
const fS=n=>n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1e3?`${(n/1e3).toFixed(0)}K`:`${n}`
const today=()=>new Date().toISOString().split("T")[0]
const monthOf=d=>d?.slice(0,7)||""
const Ic=({d,s=20})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
const IC={home:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",plus:"M12 5v14M5 12h14",list:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",chart:"M18 20V10M12 20V4M6 20v-6",debt:"M1 4h22v16H1zM1 10h22",upload:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",left:"M15 18l-6-6 6-6",right:"M9 18l6-6-6-6",logout:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",eye:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",eyeOff:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22",edit:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",settings:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"}
const mo={fontFamily:"'SF Mono',Consolas,monospace"}
const S={
  sec:{fontSize:13,textTransform:"uppercase",letterSpacing:2,color:"#8b9dc3",marginBottom:12},
  crd:{background:"#141c28",borderRadius:16,border:"1px solid rgba(255,255,255,.04)",overflow:"hidden"},
  crdP:{background:"#141c28",borderRadius:16,padding:16,border:"1px solid rgba(255,255,255,.04)"},
  lbl:{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6},
  inp:{width:"100%",padding:"12px 16px",background:"#141c28",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,color:"#e2e8f0",fontSize:14,outline:"none",boxSizing:"border-box"},
  btn:(active,color)=>({padding:"8px 14px",borderRadius:20,border:"none",fontSize:12,cursor:"pointer",background:active?color:"#141c28",color:active?"#fff":"#94a3b8",transition:"all .12s"}),
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
        <h1 style={{fontSize:28,fontWeight:800,color:"#f1f5f9",textAlign:"center",marginBottom:8}}>MisGastos</h1>
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
        <button onClick={go} disabled={loading} style={{width:"100%",padding:16,borderRadius:14,border:"none",fontSize:16,fontWeight:700,cursor:"pointer",background:"linear-gradient(135deg,#3b82f6,#2563eb)",color:"#fff",opacity:loading?.6:1}}>
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
        <div style={{background:"linear-gradient(135deg,#1a2332,#2a3f5f)",borderRadius:16,padding:"20px 16px",border:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{fontSize:11,color:"#6b8bb5",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Pesos</div>
          <div style={{fontSize:22,fontWeight:700,color:"#e8f0fe",...mo}}>{h(f$(tP))}</div>
        </div>
        <div style={{background:"linear-gradient(135deg,#1a2a1a,#2a4f2a)",borderRadius:16,padding:"20px 16px",border:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{fontSize:11,color:"#6bb56b",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Dólares</div>
          <div style={{fontSize:22,fontWeight:700,color:"#c8f0c8",...mo}}>{h(f$(tU,true))}</div>
        </div>
      </div>

      <div style={S.sec}>Cuentas</div>
      <div style={{...S.crd,marginBottom:24}}>
        <div style={{display:"flex",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{flex:"0 0 115px"}}/><div style={{flex:1,textAlign:"right",fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>Pesos</div><div style={{flex:1,textAlign:"right",fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>USD</div>
        </div>
        {[["Efectivo","Efectivo $","Efectivo USD","#f59e0b"],["BAPRO","BAPRO $","BAPRO USD","#60a5fa"]].map(([n,pk,uk,c])=>(
          <div key={n} style={{display:"flex",alignItems:"center",padding:"14px 16px",gap:12,borderBottom:"1px solid rgba(255,255,255,.04)"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:c,flexShrink:0}}/><div style={{flex:"0 0 103px",fontSize:13,color:"#94a3b8",fontWeight:500}}>{n}</div>
            <div style={{flex:1,textAlign:"right"}}><div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",...mo}}>{h(f$(cuentasByNombre[pk]?.saldo||0))}</div></div>
            <div style={{flex:1,textAlign:"right"}}><div style={{fontSize:14,fontWeight:600,color:"#a7f3d0",...mo}}>{h(f$(cuentasByNombre[uk]?.saldo||0,true))}</div></div>
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",padding:"14px 16px",gap:12}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#a78bfa",flexShrink:0}}/><div style={{flex:"0 0 103px",fontSize:13,color:"#94a3b8",fontWeight:500}}>Mercado Pago</div>
          <div style={{flex:1,textAlign:"right"}}><div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",...mo}}>{h(f$(cuentasByNombre["Mercado Pago $"]?.saldo||0))}</div></div>
          <div style={{flex:1,textAlign:"right"}}><div style={{fontSize:14,color:"#334155"}}>—</div></div>
        </div>
      </div>

      <div style={S.sec}>Últimos Movimientos</div>
      <div style={S.crd}>
        {recent.length===0&&<div style={{padding:30,textAlign:"center",color:"#475569",fontSize:13}}>Sin movimientos. Cargá tu primer gasto.</div>}
        {recent.map((e,i)=>(
          <div key={e.id} style={{display:"flex",alignItems:"center",padding:"14px 16px",borderBottom:i<recent.length-1?"1px solid rgba(255,255,255,.04)":"none",gap:12}}>
            <div style={{flex:"0 0 70px",fontSize:12,color:"#64748b"}}>{e.fecha?.slice(5)||""}</div>
            <div style={{flex:"0 0 100px",fontSize:13,color:"#94a3b8",fontWeight:500}}>{e.categoria}</div>
            <div style={{flex:1,fontSize:13,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.subcategoria||"—"}</div>
            <div style={{fontSize:16,fontWeight:700,color:e.tipo==="ingreso"?"#4ade80":e.tipo==="traspaso"?"#60a5fa":"#f87171",...mo,whiteSpace:"nowrap"}}>
              {hide?"••••":<>{e.tipo==="ingreso"?"+":e.tipo==="egreso"?"-":"↔"}{f$(e.monto)}</>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════ CARGAR ══════════════
function AddPage({cuentas,userId,onSaved}){
  const[mt,setMt]=useState("egreso")
  const[fm,setFm]=useState({date:today(),cat:"",sub:"",tc:"",cuenta:"",amt:"",it:"",from:"",to:""})
  const[ok,setOk]=useState(false)
  const[saving,setSaving]=useState(false)
  const subs=EGRESO_SUBS[fm.cat]||[]

  useEffect(()=>{
    if(cuentas.length>0&&!fm.cuenta){
      const bapro=cuentas.find(c=>c.nombre==="BAPRO $")
      setFm(f=>({...f,cuenta:bapro?.id||cuentas[0].id,from:bapro?.id||cuentas[0].id,to:cuentas.find(c=>c.nombre==="Mercado Pago $")?.id||cuentas[1]?.id||""}))
    }
  },[cuentas])

  const go=async()=>{
    if(saving)return;setSaving(true)
    try{
      if(mt==="traspaso"){
        if(!fm.amt||fm.from===fm.to){setSaving(false);return}
        const amt=parseFloat(fm.amt)
        await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:"traspaso",categoria:"Traspaso",subcategoria:`${cuentas.find(c=>c.id===fm.from)?.nombre} → ${cuentas.find(c=>c.id===fm.to)?.nombre}`,monto:amt,cuenta_id:fm.from,cuenta_destino_id:fm.to})
        await supabase.rpc("update_saldo",{p_cuenta_id:fm.from,p_delta:-amt}).catch(()=>{})
        await supabase.rpc("update_saldo",{p_cuenta_id:fm.to,p_delta:amt}).catch(()=>{})
        // Fallback: direct update if RPC not available
        const fromC=cuentas.find(c=>c.id===fm.from)
        const toC=cuentas.find(c=>c.id===fm.to)
        if(fromC)await supabase.from("cuentas").update({saldo:fromC.saldo-amt}).eq("id",fm.from)
        if(toC)await supabase.from("cuentas").update({saldo:toC.saldo+amt}).eq("id",fm.to)
      }else if(mt==="inversion"){
        if(!fm.amt||!fm.it){setSaving(false);return}
        await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:"inversion",categoria:"Inversiones",subcategoria:fm.it,monto:parseFloat(fm.amt),cuenta_id:fm.cuenta})
      }else{
        if(!fm.amt||!fm.cat){setSaving(false);return}
        const amt=parseFloat(fm.amt)
        await supabase.from("movimientos").insert({user_id:userId,fecha:fm.date,tipo:mt,categoria:fm.cat,subcategoria:fm.sub||null,monto:amt,cuenta_id:fm.cuenta,tc:fm.tc||null})
        // Update saldo
        const cuenta=cuentas.find(c=>c.id===fm.cuenta)
        if(cuenta){
          const delta=mt==="egreso"?-amt:amt
          await supabase.from("cuentas").update({saldo:cuenta.saldo+delta}).eq("id",fm.cuenta)
        }
        // If pago deuda edgardo, add to deuda table
        if(mt==="egreso"&&fm.cat==="Pago deuda"&&fm.sub==="Edgardo"){
          const{data:lastDeuda}=await supabase.from("deuda_edgardo").select("saldo").order("fecha",{ascending:false}).limit(1)
          const lastSaldo=lastDeuda?.[0]?.saldo||0
          await supabase.from("deuda_edgardo").insert({user_id:userId,fecha:fm.date,descripcion:"Pago por deuda",monto:-amt,saldo:lastSaldo-amt})
        }
      }
      setOk(true);onSaved()
      setTimeout(()=>{setOk(false);setFm(f=>({...f,cat:"",sub:"",amt:"",tc:"",it:""}))},1200)
    }catch(e){console.error(e)}
    setSaving(false)
  }

  const cuentaName=id=>cuentas.find(c=>c.id===id)?.nombre||""
  const tc={egreso:"#dc2626",ingreso:"#16a34a",traspaso:"#3b82f6",inversion:"#f59e0b"}
  const tl={egreso:"Egreso",ingreso:"Ingreso",traspaso:"Traspaso",inversion:"Inversiones"}

  return(
    <div style={{className:"page-inner"}}>
      <div style={S.sec}>Nuevo Movimiento</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:20}}>
        {["egreso","ingreso","traspaso","inversion"].map(t=><button key={t} onClick={()=>{setMt(t);setFm(f=>({...f,cat:"",sub:"",it:""}))}} style={{padding:"11px 0",borderRadius:12,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:mt===t?tc[t]:"#141c28",color:mt===t?"#fff":"#64748b"}}>{tl[t]}</button>)}
      </div>
      <div style={{marginBottom:16}}><label style={S.lbl}>Importe</label><input type="number" inputMode="decimal" value={fm.amt} onChange={e=>setFm(f=>({...f,amt:e.target.value}))} placeholder="0" style={{...S.inp,fontSize:24,fontWeight:700,...mo}}/></div>
      <div style={{marginBottom:16}}><label style={S.lbl}>Fecha</label><input type="date" value={fm.date} onChange={e=>setFm(f=>({...f,date:e.target.value}))} style={S.inp}/></div>

      {mt==="egreso"&&<>
        <div style={{marginBottom:16}}><label style={S.lbl}>Categoría</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{EGRESO_CATS.map(c=><button key={c} onClick={()=>setFm(f=>({...f,cat:c,sub:""}))} style={S.btn(fm.cat===c,"#3b82f6")}>{c}</button>)}</div></div>
        {subs.length>0&&<div style={{marginBottom:16}}><label style={S.lbl}>Detalle</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{subs.map(s=><button key={s} onClick={()=>setFm(f=>({...f,sub:s}))} style={S.btn(fm.sub===s,"#8b5cf6")}>{s}</button>)}</div></div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12,marginBottom:16}}>
          <div><label style={S.lbl}>TC</label><select value={fm.tc} onChange={e=>setFm(f=>({...f,tc:e.target.value}))} style={S.inp}><option value="">—</option><option value="V">V</option><option value="M">M</option></select></div>
          <div><label style={S.lbl}>Cuenta</label><select value={fm.cuenta} onChange={e=>setFm(f=>({...f,cuenta:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
        </div>
      </>}
      {mt==="ingreso"&&<>
        <div style={{marginBottom:16}}><label style={S.lbl}>Categoría</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{INGRESO_CATS.map(c=><button key={c} onClick={()=>setFm(f=>({...f,cat:c}))} style={S.btn(fm.cat===c,"#16a34a")}>{c}</button>)}</div></div>
        <div style={{marginBottom:16}}><label style={S.lbl}>Cuenta destino</label><select value={fm.cuenta} onChange={e=>setFm(f=>({...f,cuenta:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
      </>}
      {mt==="traspaso"&&<div style={{marginBottom:16}}>
        <label style={S.lbl}>Cuenta Origen</label><select value={fm.from} onChange={e=>setFm(f=>({...f,from:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select>
        <div style={{textAlign:"center",padding:"10px 0",color:"#3b82f6",fontSize:20}}>↓</div>
        <label style={S.lbl}>Cuenta Destino</label><select value={fm.to} onChange={e=>setFm(f=>({...f,to:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select>
      </div>}
      {mt==="inversion"&&<>
        <div style={{marginBottom:16}}><label style={S.lbl}>Tipo de Inversión</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{INV_TYPES.map(t=><button key={t} onClick={()=>setFm(f=>({...f,it:t}))} style={S.btn(fm.it===t,"#f59e0b")}>{t}</button>)}</div></div>
        <div style={{marginBottom:16}}><label style={S.lbl}>Cuenta</label><select value={fm.cuenta} onChange={e=>setFm(f=>({...f,cuenta:e.target.value}))} style={S.inp}>{cuentas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
      </>}
      <button onClick={go} disabled={saving} style={{width:"100%",padding:16,borderRadius:14,border:"none",fontSize:16,fontWeight:700,cursor:"pointer",background:ok?"#16a34a":"linear-gradient(135deg,#3b82f6,#2563eb)",color:"#fff",opacity:ok||fm.amt?1:.4}}>{ok?"✓ Guardado":saving?"Guardando...":"Guardar"}</button>
    </div>
  )
}

// ══════════════ DASHBOARD ══════════════
function DashboardPage({movimientos,onViewMonth}){
  const[pi,setPi]=useState(0)
  // Group by month
  const monthly={}
  movimientos.forEach(m=>{const k=monthOf(m.fecha);if(!monthly[k])monthly[k]={pesos:0,usd:0,inv:0};if(m.tipo==="egreso")monthly[k].pesos+=m.monto;if(m.tipo==="inversion")monthly[k].inv+=m.monto})
  const months=Object.keys(monthly).sort()
  const[bo,setBo]=useState(0)
  const vb=8,si=Math.max(0,months.length-vb-bo),ei=si+vb
  const vis=months.slice(si,ei)
  const maxP=Math.max(...Object.values(monthly).map(m=>m.pesos),1)
  const maxI=Math.max(...Object.values(monthly).map(m=>m.inv),1)

  // Pie chart
  const allMonths=months.length>0?months:[monthOf(today())]
  const pieIdx=Math.max(0,Math.min(pi,allMonths.length-1))
  const pk=allMonths[pieIdx]||monthOf(today())
  const pe=movimientos.filter(m=>m.tipo==="egreso"&&monthOf(m.fecha)===pk)
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

      {/* Gastos Mensuales */}
      <div style={{...S.crdP,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>Gastos mensuales</div>
          <div style={{display:"flex",gap:4}}>
            <NavBtn dir="l" dis={si<=0} fn={()=>setBo(o=>Math.min(o+4,months.length-vb))}/>
            <NavBtn dir="r" dis={bo<=0} fn={()=>setBo(o=>Math.max(o-4,0))}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:200}}>
          {vis.map((k,i)=>{const h=Math.max(4,(monthly[k].pesos/maxP)*160);const last=si+i===months.length-1;return(
            <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}} onClick={()=>onViewMonth(k)}>
              <div style={{fontSize:13,color:"#94a3b8",fontWeight:600,...mo}}>{fS(monthly[k].pesos)}</div>
              <div style={{width:"100%",height:h,borderRadius:"6px 6px 2px 2px",background:last?"linear-gradient(180deg,#3b82f6,#1d4ed8)":"linear-gradient(180deg,#1e3a5f,#0f2440)"}}/>
              <div style={{fontSize:12,color:last?"#60a5fa":"#94a3b8",fontWeight:last?700:500}}>{fmtMonth(k)}</div>
            </div>
          )})}
        </div>
        {vis.length>0&&<div style={{fontSize:10,color:"#334155",textAlign:"center",marginTop:8}}>Tocá una barra para ver movimientos</div>}
      </div>

      {/* Inversiones */}
      {months.some(k=>monthly[k].inv>0)&&<div style={{...S.crdP,marginBottom:20}}>
        <div style={{fontSize:12,color:"#64748b",marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Inversiones mensuales</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:100}}>
          {months.slice(-12).map(k=>(
            <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              {monthly[k].inv>0&&<div style={{fontSize:11,color:"#f59e0b",...mo}}>{fS(monthly[k].inv)}</div>}
              <div style={{width:"100%",height:monthly[k].inv>0?(monthly[k].inv/maxI)*80:4,borderRadius:"4px 4px 1px 1px",background:monthly[k].inv>0?"linear-gradient(180deg,#f59e0b,#b45309)":"#0f1a2a"}}/>
              <div style={{fontSize:10,color:"#94a3b8"}}>{fmtMonth(k).slice(0,3)}</div>
            </div>
          ))}
        </div>
      </div>}

      {/* Pie */}
      <div style={S.crdP}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>Gastos por categoría</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <NavBtn dir="l" dis={pieIdx<=0} fn={()=>setPi(i=>i-1)}/>
            <span style={{fontSize:13,color:"#e2e8f0",fontWeight:600,minWidth:60,textAlign:"center"}}>{fmtMonth(pk)}</span>
            <NavBtn dir="r" dis={pieIdx>=allMonths.length-1} fn={()=>setPi(i=>i+1)}/>
          </div>
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
          {ps.map(([cat,total],i)=>{const pct=pt>0?((total/pt)*100).toFixed(1):0;return(
            <div key={cat} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:12,height:12,borderRadius:3,background:COLORS[i%COLORS.length]}}/><span style={{fontSize:15,color:"#e2e8f0",fontWeight:500}}>{cat}</span></div>
                <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:14,color:"#94a3b8",fontWeight:500}}>{pct}%</span><span style={{fontSize:16,fontWeight:700,color:"#e2e8f0",...mo}}>{f$(total)}</span></div>
              </div>
              <div style={{height:6,background:"#0f1a2a",borderRadius:3}}><div style={{width:`${pct}%`,height:"100%",background:COLORS[i%COLORS.length],borderRadius:3}}/></div>
            </div>
          )})}
        </>}
      </div>
    </div>
  )
}

// ══════════════ MONTH DETAIL ══════════════
function MonthDetail({monthKey:mk2,movimientos,cuentas,onBack}){
  const me=movimientos.filter(m=>monthOf(m.fecha)===mk2).sort((a,b)=>b.fecha.localeCompare(a.fecha))
  const total=me.filter(m=>m.tipo==="egreso").reduce((s,m)=>s+m.monto,0)
  const cuentaNombre=id=>cuentas.find(c=>c.id===id)?.nombre||""
  const fmtMonth=k=>{const[y,m]=k.split("-");const ml=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];return`${ml[parseInt(m)-1]} ${y}`}

  return(
    <div style={{className:"page-inner"}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#60a5fa",fontSize:13,cursor:"pointer",marginBottom:16,padding:0}}><Ic d={IC.left} s={16}/> Dashboard</button>
      <div style={S.sec}>Movimientos — {fmtMonth(mk2)}</div>
      <div style={{...S.crdP,marginBottom:20,textAlign:"center"}}>
        <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>Total egresos</div>
        <div style={{fontSize:22,fontWeight:700,color:"#e2e8f0",...mo,marginTop:4}}>{f$(total)}</div>
      </div>
      <div style={S.crd}>
        {me.length===0&&<div style={{padding:30,textAlign:"center",color:"#475569",fontSize:13}}>Sin movimientos</div>}
        {me.map((e,i)=>(
          <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:i<me.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
            <div><div style={{fontSize:13,color:"#e2e8f0",fontWeight:500}}>{e.subcategoria||e.categoria}</div><div style={{fontSize:11,color:"#475569"}}>{e.fecha} · {e.categoria} · {cuentaNombre(e.cuenta_id)}</div></div>
            <div style={{fontSize:14,fontWeight:600,color:e.tipo==="ingreso"?"#4ade80":e.tipo==="traspaso"?"#60a5fa":"#f87171",...mo}}>{e.tipo==="ingreso"?"+":e.tipo==="egreso"?"-":"↔"}{f$(e.monto)}</div>
          </div>
        ))}
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
      <div style={{background:"linear-gradient(135deg,#2a1a1a,#4a1a1a)",borderRadius:16,padding:28,marginBottom:20,border:"1px solid rgba(239,68,68,.15)",textAlign:"center"}}>
        <div style={{fontSize:13,color:"#f87171",textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Saldo Actual</div>
        <div style={{fontSize:42,fontWeight:800,color:"#fca5a5",...mo}}>{f$(cb)}</div>
        <div style={{display:"flex",justifyContent:"center",gap:40,marginTop:20}}>
          <div><div style={{fontSize:12,color:"#7f1d1d",textTransform:"uppercase",marginBottom:4}}>Prestado</div><div style={{fontSize:20,fontWeight:700,color:"#ef4444",...mo}}>{f$(tb)}</div></div>
          <div><div style={{fontSize:12,color:"#14532d",textTransform:"uppercase",marginBottom:4}}>Pagado</div><div style={{fontSize:20,fontWeight:700,color:"#4ade80",...mo}}>{f$(tp)}</div></div>
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
  const[filterCat,setFilterCat]=useState("")
  const[filterFrom,setFilterFrom]=useState("")
  const[filterTo,setFilterTo]=useState("")
  const[searched,setSearched]=useState(false)
  const[editId,setEditId]=useState(null)
  const[editForm,setEditForm]=useState({})
  const cuentaNombre=id=>cuentas.find(c=>c.id===id)?.nombre||""

  const allMonths=[...new Set(movimientos.map(m=>monthOf(m.fecha)))].sort().reverse()
  const fmtMonthFull=k=>{const[y,m]=k.split("-");const ml=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];return`${ml[parseInt(m)-1]} ${y}`}

  // Previous month key
  const prevMonth=(k)=>{const[y,m]=k.split("-").map(Number);const pm=m===1?12:m-1;const py=m===1?y-1:y;return`${py}-${String(pm).padStart(2,"0")}`}

  let filtered=movimientos.filter(m=>monthOf(m.fecha)===selMonth)
  if(searched){
    if(filterCat) filtered=filtered.filter(m=>m.categoria===filterCat)
    if(filterFrom) filtered=filtered.filter(m=>m.fecha>=filterFrom)
    if(filterTo) filtered=filtered.filter(m=>m.fecha<=filterTo)
  }
  filtered.sort((a,b)=>b.fecha.localeCompare(a.fecha))

  const cats=[...new Set(movimientos.filter(m=>monthOf(m.fecha)===selMonth).map(m=>m.categoria))].sort()
  const totalEgresos=filtered.filter(m=>m.tipo==="egreso").reduce((s,m)=>s+m.monto,0)

  // Ingresos: sueldo del mes anterior + ingresos del mes actual (sin sueldo del mes actual)
  const prevMk=prevMonth(selMonth)
  const sueldoPrevMonth=movimientos.filter(m=>monthOf(m.fecha)===prevMk&&m.tipo==="ingreso"&&m.categoria==="Sueldo").reduce((s,m)=>s+m.monto,0)
  const ingresosThisMonth=filtered.filter(m=>m.tipo==="ingreso"&&m.categoria!=="Sueldo").reduce((s,m)=>s+m.monto,0)
  const totalIngresos=sueldoPrevMonth+ingresosThisMonth

  const startEdit=(e)=>{setEditId(e.id);setEditForm({fecha:e.fecha,categoria:e.categoria,subcategoria:e.subcategoria||"",monto:e.monto})}
  const cancelEdit=()=>{setEditId(null);setEditForm({})}
  const saveEdit=async()=>{
    await supabase.from("movimientos").update({fecha:editForm.fecha,categoria:editForm.categoria,subcategoria:editForm.subcategoria||null,monto:parseFloat(editForm.monto)}).eq("id",editId)
    setEditId(null);setEditForm({});onSaved()
  }
  const deleteRow=async(id)=>{
    if(!confirm("¿Eliminar este movimiento?"))return
    await supabase.from("movimientos").delete().eq("id",id);onSaved()
  }

  const doSearch=()=>setSearched(true)
  const clearFilters=()=>{setFilterCat("");setFilterFrom("");setFilterTo("");setSearched(false)}

  return(
    <div className="page-inner">
      <div style={S.sec}>Movimientos</div>

      <div style={{marginBottom:16}}>
        <select value={selMonth} onChange={e=>{setSelMonth(e.target.value);setSearched(false)}} style={{...S.inp,fontSize:16,fontWeight:600}}>
          {allMonths.map(m=><option key={m} value={m}>{fmtMonthFull(m)}</option>)}
        </select>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{...S.crdP,textAlign:"center"}}>
          <div style={{fontSize:11,color:"#f87171",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Egresos</div>
          <div style={{fontSize:22,fontWeight:700,color:"#f87171",...mo}}>{f$(totalEgresos)}</div>
        </div>
        <div style={{...S.crdP,textAlign:"center"}}>
          <div style={{fontSize:11,color:"#4ade80",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Ingresos</div>
          <div style={{fontSize:22,fontWeight:700,color:"#4ade80",...mo}}>{f$(totalIngresos)}</div>
        </div>
      </div>

      <div style={{...S.crdP,marginBottom:20}}>
        <div style={{fontSize:12,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Filtros</div>
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
        {filtered.length===0&&<div style={{padding:30,textAlign:"center",color:"#475569",fontSize:14}}>Sin movimientos</div>}
        {filtered.map((e,i)=>(
          editId===e.id?
          <div key={e.id} style={{padding:16,borderBottom:"1px solid rgba(255,255,255,.04)",background:"rgba(59,130,246,.05)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <input type="date" value={editForm.fecha} onChange={ev=>setEditForm(f=>({...f,fecha:ev.target.value}))} style={{...S.inp,fontSize:12}}/>
              <input type="number" value={editForm.monto} onChange={ev=>setEditForm(f=>({...f,monto:ev.target.value}))} style={{...S.inp,fontSize:12,...mo}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <input value={editForm.categoria} onChange={ev=>setEditForm(f=>({...f,categoria:ev.target.value}))} style={{...S.inp,fontSize:12}} placeholder="Categoría"/>
              <input value={editForm.subcategoria} onChange={ev=>setEditForm(f=>({...f,subcategoria:ev.target.value}))} style={{...S.inp,fontSize:12}} placeholder="Detalle"/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={saveEdit} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:"#16a34a",color:"#fff"}}>Guardar</button>
              <button onClick={cancelEdit} style={{padding:"8px 16px",borderRadius:8,border:"none",fontSize:12,cursor:"pointer",background:"#1e293b",color:"#94a3b8"}}>Cancelar</button>
              <button onClick={()=>deleteRow(e.id)} style={{padding:"8px 16px",borderRadius:8,border:"none",fontSize:12,cursor:"pointer",background:"#7f1d1d",color:"#f87171"}}>Eliminar</button>
            </div>
          </div>
          :<div key={e.id} style={{display:"flex",alignItems:"center",padding:"14px 16px",borderBottom:i<filtered.length-1?"1px solid rgba(255,255,255,.04)":"none",gap:10}}>
            <div style={{flex:"0 0 65px",fontSize:12,color:"#64748b"}}>{e.fecha?.slice(5)||""}</div>
            <div style={{flex:"0 0 95px",fontSize:13,color:"#94a3b8",fontWeight:500}}>{e.categoria}</div>
            <div style={{flex:1,fontSize:14,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.subcategoria||"—"}</div>
            <div style={{fontSize:16,fontWeight:700,color:e.tipo==="ingreso"?"#4ade80":e.tipo==="traspaso"?"#60a5fa":"#f87171",...mo,whiteSpace:"nowrap"}}>
              {e.tipo==="ingreso"?"+":e.tipo==="egreso"?"-":"↔"}{f$(e.monto)}
            </div>
            <button onClick={()=>startEdit(e)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",padding:4,flexShrink:0}}><Ic d={IC.edit} s={14}/></button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════ EXTRACTO (PDF PARSER REAL) ══════════════
function ExtractPage({cuentas,userId,onSaved}){
  const[parsed,setParsed]=useState([])
  const[done,setDone]=useState(false)
  const[saving,setSaving]=useState(false)
  const[cardInfo,setCardInfo]=useState("")
  const[vtoDate,setVtoDate]=useState("")
  const fileRef=useRef(null)

  const MM={"Ene":"01","Feb":"02","Mar":"03","Abr":"04","May":"05","Jun":"06","Jul":"07","Ago":"08","Sep":"09","Oct":"10","Nov":"11","Dic":"12","Enero":"01","Febrero":"02","Marzo":"03","Abril":"04","Mayo":"05","Junio":"06","Julio":"07","Agosto":"08","Septiembre":"09","Octubre":"10","Noviembre":"11","Diciembre":"12","Noviem":"11","Diciem":"12","Setiem":"09"}

  const parseMC=(text)=>{
    // Extract vencimiento
    const vtoMatch=text.match(/Vencimiento actual:\s+(\d{2})-(\w+)-(\d{2})/)
    if(vtoMatch){const[,d,m,y]=vtoMatch;setVtoDate(`20${y}-${MM[m]||"01"}-${d}`)}
    setCardInfo("Mastercard BAPRO")

    const results=[]
    const lines=text.split("\n")
    let inSection=false
    for(const line of lines){
      if(line.includes("COMPRAS DEL MES")||line.includes("DEBITOS AUTOMATICOS")||line.includes("CUOTAS DEL MES"))inSection=true
      if(line.includes("TOTAL TITULAR"))break
      if(!inSection)continue

      // Match MC line: DD-Mmm-YY DESCRIPTION CUPON_NRO [PESOS] [DOLARES]
      const m=line.match(/^(\d{2})-(\w{3})-(\d{2})\s+(.+?)\s+(\d{5})\s+([\d.,-]+)?\s*([\d.,-]+)?$/)
      if(m){
        const[,d,mon,y,desc,cupon,pesos,usd]=m
        const parseN=s=>{if(!s)return 0;return parseFloat(s.replace(/\./g,"").replace(",","."))}
        const amtP=parseN(pesos),amtU=parseN(usd)
        if(amtP!==0||amtU!==0){
          results.push({desc:desc.trim(),pesos:amtP,usd:amtU,status:"pending",cat:"",editCat:false})
        }
      }
    }
    return results
  }

  const parseVisa=(text)=>{
    // Extract vencimiento  
    const vtoMatch=text.match(/VENCIMIENTO\s+(\d{2})\s+(\w+)\s+(\d{2})/)
    if(vtoMatch){const[,d,m,y]=vtoMatch;setVtoDate(`20${y}-${MM[m]||"01"}-${d}`)}
    setCardInfo("Visa BAPRO")

    const results=[]
    const lines=text.split("\n")
    for(const line of lines){
      if(line.includes("Total Consumos de"))break
      if(line.includes("SALDO ANTERIOR")||line.includes("SU PAGO")||line.includes("DEV")||line.includes("CANCEL"))continue

      // Match Visa line: YY Month DD COMPROBANTE [TYPE] DESCRIPTION [C.MM/NN] AMOUNT [USD]
      const m=line.match(/^\s*(\d{2})\s+(\w+\.?)\s+(\d{2})\s+(\d{6})\s+([*KVPU])\s+(.+?)\s+([\d.,-]+)\s*([\d,.]+)?$/)
      if(m){
        const[,y,mon,d,comp,tipo,desc,pesos,usd]=m
        const parseN=s=>{if(!s)return 0;return parseFloat(s.replace(/\./g,"").replace(",","."))}
        const amtP=parseN(pesos),amtU=parseN(usd)
        if(amtP!==0||amtU!==0){
          results.push({desc:desc.trim().replace(/\s+C\.\d+\/\d+$/,""),pesos:amtP,usd:amtU,status:"pending",cat:""})
        }
      }
    }
    return results
  }

  const handleFile=async(e)=>{
    const file=e.target.files[0]
    if(!file)return
    // Read PDF as text using pdf.js or fallback
    const reader=new FileReader()
    reader.onload=async(ev)=>{
      const text=ev.target.result
      // Detect card type
      let results=[]
      if(text.includes("MASTERCARD")||text.includes("Mastercard")){
        results=parseMC(text)
      }else if(text.includes("VISA")||text.includes("Visa")){
        results=parseVisa(text)
      }else{
        // Try both
        results=parseMC(text)
        if(results.length===0)results=parseVisa(text)
      }
      // Auto-categorize based on description keywords
      const catMap={"SPOTIFY":"Apps","NETFLIX":"Apps","YOUTUBE":"Apps","GOOGLE":"Apps","APPLE":"Apps","LINKEDIN":"Apps","ADOBE":"Apps","OPENAI":"Apps","CLAUDE":"Apps","EMOVA":"Transporte","SUBTE":"Transporte","AUTOPISTA":"Auto","MAPFRE":"Auto","UBER":"Transporte","DIDI":"Transporte","RAPPI":"Compras","COTO":"Compras","DISCO":"Compras","SUPERMERCADO":"Compras","FARMACITY":"Compras","FARMACIA":"Compras","ZARA":"Compras","GRIMOLDI":"Compras","DEXTER":"Compras","NIKE":"Compras","ADIDAS":"Compras","MC DONALD":"Salidas","BURGER":"Salidas","RESTAURANT":"Salidas","GRILL":"Salidas","SUSHI":"Salidas","BIRRA":"Salidas","ALMIRO":"Salidas","COSTA GASTRO":"Salidas","ESTACIONAMIENTO":"Transporte","PARKING":"Transporte","CLUB ATLETICO BO":"Boca Juniors","SPORT CLUB":"Entrenamiento","TELEPEAJ":"Auto","VIALES":"Auto","AUBASA":"Auto","CODERHOUSE":"Estudios","PERSFLOW":"Departamento","URBA":"Auto","FUNDACIO":"Regalos","BOLETOMOVIL":"Viajes","VIVARIUM":"Salidas"}
      results=results.map(r=>{
        let cat=""
        const upper=r.desc.toUpperCase()
        for(const[key,val] of Object.entries(catMap)){
          if(upper.includes(key)){cat=val;break}
        }
        return{...r,cat}
      })
      setParsed(results)
    }
    reader.readAsText(file)
  }

  const setStatus=(i,s)=>{const n=[...parsed];n[i]={...n[i],status:s};setParsed(n)}
  const setCat=(i,c)=>{const n=[...parsed];n[i]={...n[i],cat:c};setParsed(n)}
  const editDesc=(i,d)=>{const n=[...parsed];n[i]={...n[i],desc:d};setParsed(n)}
  const editAmt=(i,a)=>{const n=[...parsed];n[i]={...n[i],pesos:parseFloat(a)||0};setParsed(n)}

  const doImport=async()=>{
    setSaving(true)
    const bapro=cuentas.find(c=>c.nombre==="BAPRO $")
    const accepted=parsed.filter(p=>p.status==="accepted"&&p.pesos!==0)
    const rows=accepted.map(p=>({user_id:userId,fecha:vtoDate||today(),tipo:"egreso",categoria:p.cat||"Otros",subcategoria:p.desc,monto:Math.abs(p.pesos),cuenta_id:bapro?.id,tc:cardInfo.includes("Visa")?"V":"M"}))
    if(rows.length>0){
      await supabase.from("movimientos").insert(rows)
      if(bapro){
        const totalDelta=rows.reduce((s,r)=>s-r.monto,0)
        await supabase.from("cuentas").update({saldo:bapro.saldo+totalDelta}).eq("id",bapro.id)
      }
    }
    onSaved();setDone(true);setSaving(false)
    setTimeout(()=>{setDone(false);setParsed([])},2000)
  }

  const pending=parsed.filter(p=>p.status==="pending").length
  const accepted=parsed.filter(p=>p.status==="accepted").length

  return(
    <div className="page-inner">
      <div style={S.sec}>Importar Extracto de Tarjeta</div>

      <div style={{...S.crdP,marginBottom:20}}>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:16}}>Subí el PDF del resumen de Visa o Mastercard de BAPRO. Se detecta automáticamente el tipo de tarjeta.</div>
        {vtoDate&&<div style={{marginBottom:12}}>
          <label style={S.lbl}>Fecha de vencimiento (cuando se debita)</label>
          <input type="date" value={vtoDate} onChange={e=>setVtoDate(e.target.value)} style={S.inp}/>
        </div>}
        <input ref={fileRef} type="file" accept=".pdf,.txt" onChange={handleFile} style={{display:"none"}}/>
        <button onClick={()=>fileRef.current?.click()} style={{width:"100%",padding:24,borderRadius:14,border:"2px dashed rgba(139,92,246,.3)",background:"rgba(139,92,246,.05)",color:"#a78bfa",fontSize:15,fontWeight:600,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <Ic d={IC.upload} s={28}/>
          Seleccionar PDF de tarjeta
        </button>
        {cardInfo&&<div style={{marginTop:12,fontSize:13,color:"#60a5fa",textAlign:"center"}}>{cardInfo} · Vto: {vtoDate}</div>}
      </div>

      {parsed.length>0&&<>
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <div style={{...S.crdP,flex:1,textAlign:"center",padding:12}}>
            <div style={{fontSize:20,fontWeight:700,color:"#f59e0b",...mo}}>{pending}</div>
            <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>Pendientes</div>
          </div>
          <div style={{...S.crdP,flex:1,textAlign:"center",padding:12}}>
            <div style={{fontSize:20,fontWeight:700,color:"#4ade80",...mo}}>{accepted}</div>
            <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>Aceptados</div>
          </div>
          <div style={{...S.crdP,flex:1,textAlign:"center",padding:12}}>
            <div style={{fontSize:20,fontWeight:700,color:"#64748b",...mo}}>{parsed.filter(p=>p.status==="rejected").length}</div>
            <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>Rechazados</div>
          </div>
        </div>

        <div style={S.crd}>
          {parsed.map((p,i)=>p.status==="rejected"?null:(
            <div key={i} style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,.04)",background:p.status==="accepted"?"rgba(74,222,128,.03)":"transparent"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{flex:1}}>
                  <input value={p.desc} onChange={e=>editDesc(i,e.target.value)} style={{...S.inp,fontSize:13,padding:"8px 12px",background:"transparent",border:"1px solid rgba(255,255,255,.06)"}}/>
                </div>
                <div style={{fontSize:16,fontWeight:700,color:p.pesos<0?"#4ade80":"#f87171",...mo,whiteSpace:"nowrap"}}>
                  {p.pesos<0?"+":"-"}{f$(Math.abs(p.pesos))}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <select value={p.cat} onChange={e=>setCat(i,e.target.value)} style={{...S.inp,fontSize:12,padding:"6px 10px",flex:1}}>
                  <option value="">Categoría...</option>
                  {EGRESO_CATS.map(c=><option key={c}>{c}</option>)}
                </select>
                {p.status==="pending"?<>
                  <button onClick={()=>setStatus(i,"accepted")} style={{padding:"6px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",background:"#16a34a",color:"#fff"}}>Aceptar</button>
                  <button onClick={()=>setStatus(i,"rejected")} style={{padding:"6px 14px",borderRadius:8,border:"none",fontSize:12,cursor:"pointer",background:"#7f1d1d",color:"#f87171"}}>Rechazar</button>
                </>:<button onClick={()=>setStatus(i,"pending")} style={{padding:"6px 14px",borderRadius:8,border:"none",fontSize:12,cursor:"pointer",background:"#1e293b",color:"#94a3b8"}}>Deshacer</button>}
              </div>
            </div>
          ))}
        </div>

        {accepted>0&&<button onClick={doImport} disabled={saving} style={{marginTop:20,width:"100%",padding:16,borderRadius:14,border:"none",fontSize:16,fontWeight:700,cursor:"pointer",background:done?"#16a34a":"linear-gradient(135deg,#3b82f6,#2563eb)",color:"#fff"}}>
          {done?"✓ Importados":saving?"Importando...":`Importar ${accepted} movimientos aceptados`}
        </button>}
      </>}
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

  const addCatEgreso=async()=>{if(!newVal.trim())return;await supabase.from("categorias_egreso").insert({user_id:userId,nombre:newVal.trim()});setNewVal("");loadABM()}
  const delCatEgreso=async(id)=>{await supabase.from("categorias_egreso").delete().eq("id",id);loadABM()}
  const addSubEgreso=async()=>{if(!newSub.trim()||!selCatId)return;await supabase.from("subcategorias_egreso").insert({user_id:userId,categoria_id:selCatId,nombre:newSub.trim()});setNewSub("");loadABM()}
  const delSubEgreso=async(id)=>{await supabase.from("subcategorias_egreso").delete().eq("id",id);loadABM()}
  const addCatIngreso=async()=>{if(!newVal.trim())return;await supabase.from("categorias_ingreso").insert({user_id:userId,nombre:newVal.trim()});setNewVal("");loadABM()}
  const delCatIngreso=async(id)=>{await supabase.from("categorias_ingreso").delete().eq("id",id);loadABM()}
  const addTipoInv=async()=>{if(!newVal.trim())return;await supabase.from("tipos_inversion").insert({user_id:userId,nombre:newVal.trim()});setNewVal("");loadABM()}
  const delTipoInv=async(id)=>{await supabase.from("tipos_inversion").delete().eq("id",id);loadABM()}
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

  // Auth listener
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user||null);setLoading(false)})
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{setUser(session?.user||null)})
    return()=>subscription.unsubscribe()
  },[])

  // Load data
  const loadData=useCallback(async()=>{
    if(!user)return
    const[{data:c},{data:m},{data:d}]=await Promise.all([
      supabase.from("cuentas").select("*").order("nombre"),
      supabase.from("movimientos").select("*").order("fecha",{ascending:false}),
      supabase.from("deuda_edgardo").select("*").order("fecha",{ascending:true})
    ])
    setCuentas(c||[]);setMovimientos(m||[]);setDeuda(d||[])
  },[user])

  useEffect(()=>{loadData()},[loadData])

  const logout=async()=>{await supabase.auth.signOut();setUser(null)}

  if(loading)return<div style={{minHeight:"100vh",background:"#0b1120",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>Cargando...</div>
  if(!user)return<LoginPage/>

  const nav=[{id:"home",ic:IC.home,l:"Inicio"},{id:"add",ic:IC.plus,l:"Cargar"},{id:"mov",ic:IC.list,l:"Movimientos"},{id:"dash",ic:IC.chart,l:"Dashboard"},{id:"debt",ic:IC.debt,l:"Deuda"},{id:"ext",ic:IC.upload,l:"Extracto"},{id:"abm",ic:IC.settings,l:"Configuración"}]
  const viewMonth=k=>{setDetailMonth(k);setPg("md")}
  const onSaved=()=>loadData()

  let C
  if(pg==="home")C=<HomePage cuentas={cuentas} movimientos={movimientos}/>
  else if(pg==="add")C=<AddPage cuentas={cuentas} userId={user.id} onSaved={onSaved}/>
  else if(pg==="mov")C=<MovimientosPage movimientos={movimientos} cuentas={cuentas} userId={user.id} onSaved={onSaved}/>
  else if(pg==="dash")C=<DashboardPage movimientos={movimientos} onViewMonth={viewMonth}/>
  else if(pg==="md")C=<MonthDetail monthKey={detailMonth} movimientos={movimientos} cuentas={cuentas} onBack={()=>setPg("dash")}/>
  else if(pg==="debt")C=<DebtPage deuda={deuda}/>
  else if(pg==="ext")C=<ExtractPage cuentas={cuentas} userId={user.id} onSaved={onSaved}/>
  else if(pg==="abm")C=<ABMPage cuentas={cuentas} userId={user.id} onSaved={onSaved}/>

  return(
    <div style={{minHeight:"100vh",background:"#0b1120",color:"#e2e8f0",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* Desktop sidebar */}
      <div className="sidebar">
        <div style={{padding:"24px 20px 20px"}}>
          <h1 style={{fontSize:22,fontWeight:800,color:"#f1f5f9",margin:0,letterSpacing:-.5}}>MisGastos</h1>
          <div style={{fontSize:11,color:"#475569",marginTop:4}}>{user.email}</div>
        </div>
        <nav style={{flex:1,padding:"8px 12px"}}>
          {nav.map(n=>{const a=pg===n.id||(pg==="md"&&n.id==="dash");return(
            <button key={n.id} onClick={()=>setPg(n.id)} style={{
              display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 16px",marginBottom:4,
              borderRadius:12,border:"none",cursor:"pointer",transition:"all .15s",
              background:a?"rgba(59,130,246,.12)":"transparent",
              color:a?"#60a5fa":"#64748b"
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
            <div><h1 style={{fontSize:20,fontWeight:800,color:"#f1f5f9",margin:0,letterSpacing:-.5}}>MisGastos</h1><div style={{fontSize:11,color:"#475569",marginTop:2}}>{user.email}</div></div>
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
                {n.id==="add"?<div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(59,130,246,.3)",color:"#fff"}}><Ic d={n.ic} s={22}/></div>:<Ic d={n.ic} s={20}/>}
                <span style={{fontSize:10,fontWeight:a?600:400}}>{n.l}</span>
              </button>
            )})}
          </div>
        </div>
      </div>

      <style>{`
        *{box-sizing:border-box}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(.7)}
        select{appearance:auto}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:4px}

        .page-inner{padding:0 16px 100px}

        .sidebar{display:none}
        .mobile-header{padding:20px 16px 12px;border-bottom:1px solid rgba(255,255,255,.04)}
        .desktop-header{display:none}
        .main-content{max-width:480px;margin:0 auto;position:relative}
        .page-content{padding-top:16px}
        .mobile-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:linear-gradient(180deg,rgba(11,17,32,0) 0%,rgba(11,17,32,.95) 20%,#0b1120 40%);padding-top:20px;padding-bottom:12px}

        @media(min-width:768px){
          .sidebar{
            display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;width:240px;
            background:#0a0f1a;border-right:1px solid rgba(255,255,255,.06);z-index:10;
          }
          .mobile-header{display:none}
          .mobile-nav{display:none}
          .desktop-header{
            display:block;padding:24px 32px 16px;border-bottom:1px solid rgba(255,255,255,.04);
          }
          .main-content{
            margin-left:240px;max-width:none;padding-bottom:32px;
          }
          .page-content{
            padding:16px 32px 32px;max-width:900px;
          }
          .page-inner{padding:0!important}
        }

        @media(min-width:1200px){
          .sidebar{width:280px}
          .main-content{margin-left:280px}
          .page-content{max-width:1000px;padding:24px 48px 48px}
        }
      `}</style>
    </div>
  )
}
