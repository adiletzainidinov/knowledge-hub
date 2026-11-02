"use client";
import {useState} from "react";
type Video={id:string;title:string;description:string;publishedAt:string;thumbnail:string;url:string};
export default function Home(){
 const [handle,setHandle]=useState("@olegcloser");
 const [videos,setVideos]=useState<Video[]>([]);
 const [query,setQuery]=useState("");
 const [next,setNext]=useState<string|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [channel,setChannel]=useState("");
 const [count,setCount]=useState(0);
 async function load(reset:boolean){
  setLoading(true);setError("");
  try{
   const parsed=handle.trim().match(/(?:youtube\.com\/)?@([a-zA-Z0-9._-]+)/);
   const h=parsed?.[1]||handle.trim().replace(/^@/,"");
   const params=new URLSearchParams({handle:h});
   if(!reset&&next)params.set("pageToken",next);
   const response=await fetch("/api/youtube?"+params);
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Ошибка загрузки");
   setVideos(prev=>reset?data.videos:[...prev,...data.videos.filter((v:Video)=>!prev.some(p=>p.id===v.id))]);
   setNext(data.nextPageToken);setChannel(data.channel.title);setCount(data.totalApprox);
  }catch(e){setError(e instanceof Error?e.message:"Неизвестная ошибка");}
  finally{setLoading(false);}
 }
 const filtered=videos.filter(v=>(v.title+" "+v.description).toLowerCase().includes(query.toLowerCase()));
 return <main><header>📚 KnowledgeHub <span style={{float:"right",fontSize:13}}>Каталог знаний · beta</span></header><h1>Знания вместо гигабайтов</h1><p>Добавляй каналы YouTube и ищи полезные материалы. Видеофайлы не скачиваются.</p><section className="panel"><h2>Импорт канала</h2><div className="form"><input aria-label="Ссылка или handle канала" value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@olegcloser"/><button disabled={loading} onClick={()=>load(true)}>{loading?"Загрузка...":"Найти видео"}</button></div>{error&&<p role="alert" style={{color:"#ffb6b6"}}>{error}</p>}<p><small>Импорт по 50 роликов через YouTube Data API. Для работы нужен серверный ключ.</small></p></section><section className="panel"><h2>{channel||"Каталог видео"} {count>0?"· около "+count:""}</h2><input aria-label="Поиск по загруженному каталогу" placeholder="Поиск по названиям и описаниям..." value={query} onChange={e=>setQuery(e.target.value)}/><p>Загружено: {videos.length}. Найдено по запросу: {filtered.length}.</p><div className="grid">{filtered.map(v=><article className="card" key={v.id}><h3>{v.title}</h3><small>{v.publishedAt?.slice(0,10)}</small><p>{v.description.slice(0,220)}{v.description.length>220?"…":""}</p><a href={v.url} target="_blank" rel="noopener noreferrer">Смотреть на YouTube ↗</a></article>)}</div>{next&&<button disabled={loading} style={{marginTop:20}} onClick={()=>load(false)}>{loading?"Загрузка...":"Загрузить ещё 50"}</button>}</section><p>Следующий этап: база данных, авторизация, законно доступные тексты и проверяемые ИИ-конспекты.</p></main>
}