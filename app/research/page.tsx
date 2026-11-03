"use client";
import {useState} from "react";
type Hit={video_id:string;title:string;url:string;excerpt:string;score:number;verified:boolean};
type Result={scanned_transcripts:number;results:Hit[];notice:string;error?:string};
export default function Research(){
 const [token,setToken]=useState("");const [query,setQuery]=useState("");
 const [data,setData]=useState<Result|null>(null);const [answer,setAnswer]=useState("");const [aiError,setAiError]=useState("");const [aiBusy,setAiBusy]=useState(false);const [busy,setBusy]=useState(false);
 async function search(e:React.FormEvent){
  e.preventDefault();setBusy(true);setData(null);
  try{
   const r=await fetch("/api/admin/research",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({query}),cache:"no-store"});
   const j=await r.json();if(!r.ok)throw Error(j.error||"Ошибка запроса");setData(j);
  }catch(e){setData({scanned_transcripts:0,results:[],notice:"",error:e instanceof Error?e.message:"Ошибка"})}
  finally{setBusy(false)}
 }
 async function ask(){setAiBusy(true);setAiError("");setAnswer("");try{const r=await fetch("/api/admin/ask",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({question:query}),cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"Ошибка ИИ");setAnswer(j.answer||"Нет ответа");}catch(e){setAiError(e instanceof Error?e.message:"Ошибка ИИ")}finally{setAiBusy(false)}}
 return <main style={{maxWidth:850,margin:"0 auto",padding:20}}>
  <header><a href="/">← Библиотека</a></header>
  <h1>Поиск знаний по расшифровкам</h1>
  <p>Поиск по всем сохранённым текстам. Показывает фрагменты и источники; это ещё не ИИ-ответ.</p>
  <section className="panel">
   <form onSubmit={search} style={{display:"grid",gap:12}}>
    <label>Токен администратора (не сохраняется на сайте)<input type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} required placeholder="ADMIN_IMPORT_TOKEN"/></label>
    <label>Вопрос или тема<input value={query} onChange={e=>setQuery(e.target.value)} minLength={3} maxLength={250} required placeholder="Как отвечать, если клиент говорит дорого?"/></label>
    <button type="submit" disabled={busy}>{busy?"Ищем…":"Найти в расшифровках"}</button>
   </form>
  </section>
  <section className="panel"><h2>ИИ-консультант</h2><p>Сначала введите токен и вопрос выше. Ответ основан на найденных фрагментах с указанием источников.</p><button onClick={ask} disabled={aiBusy||query.trim().length<5||!token}>{aiBusy?"ИИ анализирует…":"Получить ответ ИИ"}</button>{aiError&&<p role="alert">{aiError}</p>}{answer&&<p style={{whiteSpace:"pre-wrap"}}>{answer}</p>}</section>\n  {data?.error&&<p role="alert">{data.error}</p>}
  {data&&!data.error&&<section className="panel"><h2>Найдено: {data.results.length} источников</h2><p>Проверено расшифровок: {data.scanned_transcripts}. {data.notice}</p>
   {data.results.length===0&&<p>Совпадений нет. Попробуйте другие слова.</p>}
   {data.results.map(h=><article className="card" key={h.video_id} style={{marginBottom:14}}>
    <h3>{h.title}</h3><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{h.excerpt}</p>
    <p><small>{h.verified?"Расшифровка подтверждена":"Расшифровка не проверена вручную"}</small></p>
    <a href={h.url} target="_blank" rel="noopener noreferrer">Открыть видео на YouTube ↗</a>
   </article>)}
  </section>}
 </main>
}
