"use client";
import {useEffect,useState} from "react";
type Video={id:string;title:string;description:string|null;published_at:string|null;thumbnail:string|null;url:string};
export default function Home(){
 const [videos,setVideos]=useState<Video[]>([]);
 const [query,setQuery]=useState("");
 const [applied,setApplied]=useState("");
 const [page,setPage]=useState(1);
 const [total,setTotal]=useState<number|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  async function load(){
   setLoading(true);setError("");
   try{
    const params=new URLSearchParams({page:String(page)});
    if(applied)params.set("q",applied);
    const response=await fetch("/api/library?"+params,{cache:"no-store"});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Ошибка загрузки");
    if(active){setVideos(data.videos||[]);setTotal(data.total);}
   }catch(e){if(active)setError(e instanceof Error?e.message:"Ошибка загрузки");}
   finally{if(active)setLoading(false);}
  }
  load();return()=>{active=false;};
 },[page,applied]);
 function search(e:React.FormEvent){e.preventDefault();setPage(1);setApplied(query.trim());}
 const pages=total===null?null:Math.max(1,Math.ceil(total/30));
 return <main>
  <header>📚 KnowledgeHub <span style={{float:"right",fontSize:13}}>Библиотека знаний</span></header>
  <h1>Знания вместо гигабайтов</h1>
  <p>Постоянный каталог YouTube-материалов. Видео остаются на YouTube, а названия, описания и ссылки хранятся в нашей базе.</p>
  <section className="panel">
   <h2>Поиск по библиотеке</h2>
   <form className="form" onSubmit={search}><input aria-label="Поиск по библиотеке" placeholder="Например: переговоры, продажи, клиенты…" value={query} onChange={e=>setQuery(e.target.value)}/><button disabled={loading} type="submit">Найти</button></form>
   <p><small>Поиск по названиям и описаниям всех сохранённых видео, а не только текущей страницы.</small></p>
   {applied&&<button onClick={()=>{setQuery("");setApplied("");setPage(1);}}>Сбросить поиск</button>}
  </section>
  <section className="panel">
   <h2>Каталог видео {total!==null?"· "+total:""}</h2>
   {loading&&<p role="status">Загружаем записи из Supabase…</p>}
   {error&&<p role="alert" style={{color:"#ffb6b6"}}>{error} <button onClick={()=>{setPage(p=>p===1?2:1);setTimeout(()=>setPage(page),0);}}>Повторить</button></p>}
   {!loading&&!error&&videos.length===0&&<p>По запросу ничего не найдено.</p>}
   <div className="grid">{videos.map(v=><article className="card" key={v.id}>
    <h3>{v.title}</h3><small>{v.published_at?.slice(0,10)||"Дата не указана"}</small>
    <p>{(v.description||"Описание отсутствует").slice(0,260)}{(v.description||"").length>260?"…":""}</p>
    <p><a href={"/video/"+encodeURIComponent(v.id)}>Открыть карточку и конспект →</a></p><a href={v.url} target="_blank" rel="noopener noreferrer">Смотреть на YouTube ↗</a>
   </article>)}</div>
   {!loading&&!error&&<div className="form" style={{marginTop:20,alignItems:"center"}}>
    <button disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Назад</button>
    <span>Страница {page}{pages?" из "+pages:""}</span>
    <button disabled={pages!==null?page>=pages:videos.length<30} onClick={()=>setPage(p=>p+1)}>Далее →</button>
   </div>}
  </section>
  <p>Конспекты и расшифровки добавим отдельно, когда получим достоверные тексты видео.</p>
  <p><a href="/research">🔎 Поиск по расшифровкам</a> · <a href="/admin">Администрирование</a></p>
 </main>;
}
