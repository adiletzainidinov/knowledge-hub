"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
type Video={id:string;title:string;description:string|null;url:string;published_at:string|null};
export default function VideoDetail(){
 const params=useParams();const id=String(params.id||"");
 const [video,setVideo]=useState<Video|null>(null);
 const [error,setError]=useState("");const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;fetch("/api/library/"+encodeURIComponent(id),{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||"Ошибка");if(active)setVideo(data.video);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[id]);
 return <main><header>📚 KnowledgeHub <span style={{float:"right",fontSize:13}}>Карточка видео</span></header>
 <p style={{marginTop:30}}><a href="/">← Вернуться в библиотеку</a></p>
 {loading&&<p>Загружаем карточку…</p>}
 {error&&<p role="alert">{error}</p>}
 {video&&<><h1 style={{marginTop:35}}>{video.title}</h1><p>Опубликовано: {video.published_at?.slice(0,10)||"Неизвестно"}</p>
 <section className="panel"><h2>Видео</h2><div style={{position:"relative",paddingTop:"56.25%",overflow:"hidden",borderRadius:14,background:"#0b1020"}}><iframe title={video.title} src={"https://www.youtube-nocookie.com/embed/"+video.id} loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{position:"absolute",inset:0,width:"100%",height:"100%",border:0}}/></div><p><a href={video.url} target="_blank" rel="noopener noreferrer">Открыть на YouTube ↗</a></p></section>
 <section className="panel"><h2>Описание автора</h2><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{video.description?.trim()||"Автор не добавил описание."}</p></section>
 <section className="panel"><h2>Конспект и полезные советы</h2><p>Пока не подготовлены. Для достоверного конспекта необходим текст выступления или разрешённая расшифровка. Название и описание не считаются полным содержанием видео.</p><p><small>Статус: ожидается источник текста. Непроверенные рекомендации не генерируются.</small></p></section>
 </>}
 </main>;
}
