
import React, { useState, useEffect, createContext, useContext } from "react";

const cls = (...xs:any[])=>xs.filter(Boolean).join(" ");
function Button({children, className, ...props}: any){ return <button className={cls("px-3 py-2 rounded-lg border text-sm hover:opacity-90 transition", className)} {...props}>{children}</button>; }
function Card({children, className}: any){ return <div className={cls("rounded-2xl border bg-white", className)}>{children}</div>; }
function CardHeader({children}: any){ return <div className="p-4 border-b">{children}</div>; }
function CardTitle({children, className}: any){ return <div className={cls("font-semibold flex items-center gap-2", className)}>{children}</div>; }
function CardDescription({children}: any){ return <div className="text-sm text-gray-500 mt-1">{children}</div>; }
function CardContent({children, className}: any){ return <div className={cls("p-4", className)}>{children}</div>; }
function Input(props:any){ return <input {...props} className={cls("px-3 py-2 rounded-lg border text-sm w-full", props.className)} />; }
function Textarea(props:any){ return <textarea {...props} className={cls("px-3 py-2 rounded-lg border text-sm w-full min-h-[88px]", props.className)} />; }
function Label({children, htmlFor}: any){ return <label htmlFor={htmlFor} className="text-sm text-gray-700">{children}</label>; }
function Badge({children, className}: any){ return <span className={cls("inline-flex items-center px-2 py-0.5 rounded-full text-xs border", className)}>{children}</span>; }
function Switch({checked, onCheckedChange, id}: any){ return <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer"><input id={id} type="checkbox" checked={!!checked} onChange={(e)=>onCheckedChange?.(e.target.checked)} /></label>; }
function Select({value, onValueChange, children}: any){ return <select value={value} onChange={(e)=>onValueChange?.(e.target.value)} className="px-3 py-2 rounded-lg border text-sm w-full">{children}</select>; }
function SelectItem({value, children}: any){ return <option value={value}>{children}</option>; }

const TabsCtx = createContext<any>(null);
function Tabs({defaultValue, children}: any){ const [val, setVal] = useState(defaultValue); return <TabsCtx.Provider value={{val, setVal}}>{children}</TabsCtx.Provider>; }
function TabsList({children, className}: any){ return <div className={cls("flex gap-2", className)}>{children}</div>; }
function TabsTrigger({value, children}: any){ const {val, setVal} = useContext(TabsCtx); const active = val===value; return <Button className={cls(active?"bg-[var(--cnb-blue)] text-white border-none":"", "text-sm")} onClick={()=>setVal(value)}>{children}</Button>; }
function TabsContent({value, children, className}: any){ const {val} = useContext(TabsCtx); if(val!==value) return null; return <div className={className}>{children}</div>; }

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

type SupabaseLike = { auth:{ getSession:()=>Promise<{data:{session:any}}>, onAuthStateChange:(cb:(e:any,s:any)=>any)=>any, signInWithPassword:(args:{email:string,password:string})=>Promise<any>, signInWithOtp:(args:any)=>Promise<any>, signUp:(args:any)=>Promise<{data:{user:any}}>, signOut:()=>Promise<any>, }, from:(table:string)=>any };
let supabase: SupabaseLike | null = null;

async function ensureSupabase(): Promise<SupabaseLike>{
  if (supabase) return supabase;
  if (USE_SUPABASE && SUPABASE_URL && SUPABASE_KEY) {
    const mod = await import('@supabase/supabase-js');
    const client = mod.createClient(SUPABASE_URL, SUPABASE_KEY);
    supabase = { auth: client.auth, from: (t:string)=>client.from(t) } as SupabaseLike;
    return supabase;
  }
  supabase = {
    auth: { async getSession(){ return { data: { session: null } }; }, onAuthStateChange(_cb:any){ return {}; }, async signInWithPassword(){ return {}; }, async signInWithOtp(){ return {}; }, async signUp(){ return { data:{ user:{ id:'demo-user'} } }; }, async signOut(){ return {}; } },
    from(_t:string){ const api:any = { select:()=>Promise.resolve({data:[],error:null}), order:()=>Promise.resolve({data:[],error:null}), insert:()=>Promise.resolve({error:null}), update:()=>Promise.resolve({error:null}) }; api.eq=()=>api; api.lte=()=>api; api.gte=()=>api; return api; }
  };
  return supabase;
}

export default function App(){
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'socio'|'staff'>('socio');
  const [displayName, setDisplayName] = useState('');
  const [redFlag, setRedFlag] = useState(false);

  useEffect(()=>{ (async ()=>{
    const s = await ensureSupabase();
    const { data: { session } } = await s.auth.getSession();
    setSession(session||null); setUser(session?.user||null);
    s.auth.onAuthStateChange((_e:any,newSession:any)=>{ setSession(newSession||null); setUser(newSession?.user||null); if(newSession?.user) loadProfile(newSession.user.id); });
  })(); },[]);

  const loadProfile = async (userId:string)=>{
    const s = await ensureSupabase();
    try { const { data } = await s.from('profiles').select('display_name, role').eq('id', userId).then((r:any)=>r);
      const row = Array.isArray(data)? data[0]: null;
      if(row){ setDisplayName(row.display_name||''); setRole(row.role==='staff'?'staff':'socio'); }
    } catch { setDisplayName(''); setRole('socio'); }
  };

  const [windKnots] = useState(12);
  const [marineriaRequest, setMarineriaRequest] = useState({ socio: "", embarcacion: "Patín catalán", horario: "", notas: "" });
  const boats = [ { id: "patin-01", nombre: "Patín #01" }, { id: "patin-02", nombre: "Patín #02" }, { id: "rs-laser-01", nombre: "Laser RS #01" } ];
  const [reservas, setReservas] = useState<any[]>([]);
  const [hangar, setHangar] = useState<any[]>([]);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [nuevoAnuncio, setNuevoAnuncio] = useState({ titulo: "", precio: "", descripcion: "" });

  const fetchReservas = async ()=>{ const s = await ensureSupabase(); const { data } = await s.from('reservas').select('*').order?.('start',{ascending:true}) || { data: [] }; setReservas((data||[]).map((r:any)=>({...r, start:new Date(r.start), end:new Date(r.end)}))); };
  const fetchHangar = async ()=>{ const s = await ensureSupabase(); const { data } = await s.from('hangar').select('*') || { data: [] }; setHangar(data||[]); };
  const fetchAnuncios = async ()=>{ const s = await ensureSupabase(); const { data } = await s.from('anuncios').select('*').order?.('id',{ascending:true}) || { data: [] }; setAnuncios(data||[]); };

  const reservar = async (boatId:string, startISO:string, durMins:string|number, socio:string)=>{
    const s = await ensureSupabase();
    const start = new Date(startISO); const end = new Date(start.getTime() + Number(durMins||60)*60000);
    try { const q = s.from('reservas').select('*').eq?.('boatId', boatId).lte?.('start', end.toISOString()).gte?.('end', start.toISOString()); const { data: overlaps } = await (q||{ data:[] }) as any; if(overlaps && overlaps.length>0) return { ok:false, msg:'Ese barco ya está reservado en ese horario.' } as const; } catch {}
    const ins = await s.from('reservas').insert?.({ boatId, start: start.toISOString(), end: end.toISOString(), socio, user_id: user?.id||null }); if((ins as any)?.error) return { ok:false, msg:'Error al guardar la reserva' } as const;
    setReservas(prev=>[...prev, { boatId, start, end, socio }]); return { ok:true } as const;
  };

  const aprobarAnuncio = async (id:number, aprobado:boolean)=>{ const s = await ensureSupabase(); const up = await s.from('anuncios').update?.({ estado: aprobado?'aprobado':'rechazado' }).eq?.('id', id); if(!(up as any)?.error) fetchAnuncios(); };

  useEffect(()=>{ (async()=>{ if(!session) return; await fetchReservas(); await fetchHangar(); await fetchAnuncios(); })(); },[session]);

  if (!session) return <AuthScreen/>;

  return <div className="min-h-screen bg-white"><div className="p-4 md:p-10 max-w-6xl mx-auto">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full border border-[var(--cnb-blue)] bg-white flex items-center justify-center text-[var(--cnb-blue)] font-semibold">CNB</div>
        <div><h1 className="text-2xl font-semibold tracking-tight">CNB · Sección de Vela</h1><p className="text-sm text-gray-500">WebApp para socios</p></div></div>
      <div className="flex items-center gap-2"><Badge>{role==='staff'? 'Trabajador':'Socio'}</Badge>
        <div className="flex items-center gap-2 ml-3"><Label htmlFor="red">Bandera roja</Label><Switch id="red" checked={redFlag} onCheckedChange={setRedFlag}/></div>
        <Button onClick={async()=>{ const s=await ensureSupabase(); await s.auth.signOut(); location.reload(); }}>Salir</Button></div>
    </div>

    <div className={cls("w-full mb-4 rounded-2xl p-4 flex items-center gap-3 border", redFlag?"bg-red-50 border-red-200":"bg-slate-50 border-slate-200")}>
      <div className="flex-1"><div className="flex items-center gap-2"><p className="text-lg font-semibold">Viento ahora</p><Badge>Port Olímpic</Badge></div>
        <p className="text-2xl font-bold">12 kn</p></div>
      {redFlag? <Badge className="text-base">Bandera roja</Badge> : <Badge className="text-base" style={{background:"var(--cnb-blue)",color:"white"}}>Condiciones operativas</Badge>}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card><CardHeader><CardTitle>Solicitud de Marinería</CardTitle><CardDescription>Horario: 10:00–18:00 · Coste servicio: 4€ por traslado</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2"><Label>Socio</Label><Input placeholder="Tu nombre" value={marineriaRequest.socio} onChange={e=>setMarineriaRequest(v=>({...v, socio:e.target.value}))}/></div>
          <div className="grid gap-2"><Label>Embarcación</Label><Select value={marineriaRequest.embarcacion} onValueChange={(val:string)=>setMarineriaRequest(v=>({...v, embarcacion: val}))}><SelectItem value="Patín catalán">Patín catalán</SelectItem><SelectItem value="Windsurf">Windsurf</SelectItem><SelectItem value="SUP">SUP</SelectItem><SelectItem value="Laser RS">Laser RS</SelectItem></Select></div>
          <div className="grid gap-2"><Label>Horario deseado</Label><Input type="datetime-local" value={marineriaRequest.horario} onChange={e=>setMarineriaRequest(v=>({...v, horario:e.target.value}))}/></div>
          <div className="grid gap-2"><Label>Notas</Label><Textarea placeholder="Detalles adicionales" value={marineriaRequest.notas} onChange={e=>setMarineriaRequest(v=>({...v, notas:e.target.value}))}/></div>
          <div className="flex justify-end"><Button className="bg-[var(--cnb-blue)] text-white border-none" onClick={async()=>{ const s=await ensureSupabase(); await s.from('marineria_requests').insert?.({ ...marineriaRequest, coste:4 }); alert('Solicitud enviada'); }}>Solicitar traslado (4€)</Button></div>
        </CardContent></Card>

      <Card><CardHeader><CardTitle>Reservas de Charter</CardTitle><CardDescription>Sin dobles reservas</CardDescription></CardHeader>
        <CardContent>
          <Tabs defaultValue={boats[0].id}>
            <TabsList className="flex flex-wrap mb-3">{boats.map(b=><TabsTrigger key={b.id} value={b.id}>{b.nombre}</TabsTrigger>)}</TabsList>
            {boats.map(b=>(<TabsContent key={b.id} value={b.id} className="space-y-3">
              <ReservaForm boat={b} onReservar={reservar} />
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Reservas existentes</p>
                <div className="space-y-2">
                  {reservas.filter(r=>r.boatId===b.id).length===0 && (<p className="text-sm">Sin reservas aún.</p>)}
                  {reservas.filter(r=>r.boatId===b.id).map((r:any,i:number)=>(<div key={i} className="flex items-center justify-between border rounded-xl p-2"><div className="flex items-center gap-2"><span>🕒</span><span>{r.start.toLocaleString()} → {r.end.toLocaleTimeString()}</span></div><Badge>{r.socio}</Badge></div>))}
                </div>
              </div>
            </TabsContent>))}
          </Tabs>
        </CardContent></Card>

      <Card><CardHeader><CardTitle>Marketplace</CardTitle><CardDescription>Publica material náutico</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t pt-3">
            <p className="text-sm font-semibold mb-2">Nuevo anuncio</p>
            <div className="grid md:grid-cols-3 gap-2"><Input placeholder="Título" value={nuevoAnuncio.titulo} onChange={(e:any)=>setNuevoAnuncio(v=>({...v, titulo:e.target.value}))}/><Input placeholder="Precio (€)" type="number" value={nuevoAnuncio.precio} onChange={(e:any)=>setNuevoAnuncio(v=>({...v, precio:e.target.value}))}/><Input placeholder="Descripción" value={nuevoAnuncio.descripcion} onChange={(e:any)=>setNuevoAnuncio(v=>({...v, descripcion:e.target.value}))}/></div>
            <div className="flex justify-end mt-2"><Button onClick={()=>{ if(!nuevoAnuncio.titulo || !nuevoAnuncio.precio) return alert('Completa título y precio'); alert('Enviado (pendiente de aprobación)'); setNuevoAnuncio({titulo:'',precio:'',descripcion:''}); }}>Enviar para aprobación</Button></div>
          </div>
        </CardContent></Card>
    </div>
  </div></div>;
}

function AuthScreen(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const signIn = async ()=>{ const s = await ensureSupabase(); const { error } = await s.auth.signInWithPassword({ email, password }); setMsg(error? 'Credenciales inválidas' : ''); };
  const magic = async ()=>{ const s = await ensureSupabase(); const { error } = await s.auth.signInWithOtp({ email, options: { emailRedirectTo: (typeof window!=='undefined'? window.location.href: undefined) } }); if(!error) setMsg('Te envié un enlace mágico al correo.'); };
  const signUp = async ()=>{ const s = await ensureSupabase(); const { data, error } = await s.auth.signUp({ email, password }); if(!error && (data as any)?.user){ await s.from('profiles').insert?.({ id:(data as any).user.id, display_name: name || email.split('@')[0], role: 'socio' }); setMsg('Cuenta creada. Revisa tu correo para confirmar.'); } else if(error) setMsg('No se pudo crear la cuenta'); };
  return <div className="min-h-screen flex items-center justify-center bg-[conic-gradient(at_top_left,_#e0f2fe,_white)] p-4"><Card className="max-w-md w-full"><CardHeader><CardTitle>CNB · Inicia sesión</CardTitle><CardDescription>Accede como socio o trabajador</CardDescription></CardHeader><CardContent className="space-y-3"><Input placeholder="Nombre (nuevo usuario)" value={name} onChange={(e:any)=>setName(e.target.value)}/><Input placeholder="Email" type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)}/><Input placeholder="Contraseña" type="password" value={password} onChange={(e:any)=>setPassword(e.target.value)}/><div className="flex gap-2 justify-between"><Button onClick={signIn}>Entrar</Button><Button onClick={magic}>Enlace mágico</Button><Button onClick={signUp}>Crear cuenta</Button></div>{msg && <p className="text-sm text-gray-500">{msg}</p>}</CardContent></Card></div>;
}

function ReservaForm({ boat, onReservar }: any) {
  const [socio, setSocio] = useState(""); const [inicio, setInicio] = useState(""); const [duracion, setDuracion] = useState("90"); const [mensaje, setMensaje] = useState("");
  return <div className="border rounded-xl p-3 space-y-2">
    <div className="grid md:grid-cols-3 gap-2"><Input placeholder="Socio" value={socio} onChange={(e:any)=>setSocio(e.target.value)}/><Input type="datetime-local" value={inicio} onChange={(e:any)=>setInicio(e.target.value)}/><Select value={duracion} onValueChange={setDuracion}><SelectItem value="60">60 min</SelectItem><SelectItem value="90">90 min</SelectItem><SelectItem value="120">120 min</SelectItem></Select></div>
    <div className="flex justify-end"><Button className="bg-[var(--cnb-blue)] text-white border-none" onClick={async ()=>{ if(!socio || !inicio) return setMensaje("Completa socio e inicio"); const res = await onReservar(boat.id, inicio, duracion, socio); if(!res.ok) setMensaje((res as any).msg || 'Error'); else setMensaje("Reserva confirmada"); }}>Reservar {boat.nombre}</Button></div>
    {mensaje && <p className="text-sm text-gray-500">{mensaje}</p>}
  </div>;
}
