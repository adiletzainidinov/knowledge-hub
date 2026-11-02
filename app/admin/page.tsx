"use client";
import {useRef,useState} from "react";
type Video={id:string;title:string;url:string};
export default function Admin(){
 const [token,setToken]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [items,setItems]=useState<Video[]>([]);
 const [progress,setProgress]=useState(0);
 const [total,setTotal]=useState(0);
 const [page,setPage]=useState(0);
 const [nextToken,setNextToken]=useState<string|null>(null);
 const stop=useRef(false);
 async function request(url:string,body?:unknown){
  const response=await fetch(url,{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(body||{})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||"Ошибка запроса");
  return data;
 }
 async function firstFive(){
  setBusy(true);setMessage("");setItems([]);
  try{const data=await request("/api/admin/import-five");setItems(data.videos||[]);setMessage("Сохранено видео: "+data.imported);}
  catch(e){setMessage(e instanceof Error?e.message:"Ошибка");}finally{setBusy(false);}
 }
 async function sync(){
  setBusy(true);stop.current=false;setMessage("");
  let cursor=nextToken;let saved=progress;let pages=page;
  try{
   do{
    const data=await request("/api/admin/sync-channel",{pageToken:cursor});
    saved+=data.imported;pages++;
    cursor=data.nextPageToken;
    setProgress(saved);setPage(pages);setTotal(data.totalApprox);
    setNextToken(cursor);
    setMessage("Обработано "+saved+" видео, партий: "+pages+(cursor?". Синхронизация продолжается…":". Синхронизация завершена."));
   }while(cursor&&!stop.current);
   if(stop.current)setMessage("Остановлено после "+saved+" видео. Можно продолжить.");
  }catch(e){setMessage((e instanceof Error?e.message:"Ошибка")+". Уже обработано: "+saved+". Нажми «Продолжить», чтобы повторить текущую партию.");}
  finally{setBusy(false);}
 }
 function reset(){setNextToken(null);setProgress(0);setPage(0);setTotal(0);setMessage("Прогресс сброшен. Можно начать заново.");}
 return <main><header>📚 KnowledgeHub <span style={{float:"right",fontSize:13}}>Администрирование</span></header>
 <h1>Библиотека знаний</h1><p>Импорт YouTube-канала @olegcloser в Supabase без скачивания видеофайлов.</p>
 <section className="panel"><h2>Доступ администратора</h2><input type="password" autoComplete="off" aria-label="Токен администратора" placeholder="ADMIN_IMPORT_TOKEN" value={token} onChange={e=>setToken(e.target.value)}/><p><small>Токен не сохраняется в браузере. Не вводи его на чужом устройстве.</small></p></section>
 <section className="panel"><h2>Синхронизация всего канала</h2>
 <p>Сохраняем метаданные партиями по 50. Уже обработано в текущем запуске: <strong>{progress}</strong>{total?" из примерно "+total:""}. Партий: {page}.</p>
 <div style={{height:12,background:"#101626",borderRadius:8,overflow:"hidden",marginBottom:16}}><div style={{height:"100%",background:"#7567f8",width:(total?Math.min(100,Math.round(progress/total*100)):0)+"%"}}/></div>
 <div className="form"><button disabled={busy||!token.trim()} onClick={sync}>{busy?"Синхронизация…":nextToken?"Продолжить синхронизацию":progress?"Повторить синхронизацию":"Синхронизировать весь канал"}</button>
 {busy&&<button onClick={()=>{stop.current=true;setMessage("Останавливаем после текущей партии…");}}>Остановить после партии</button>}
 {!busy&&progress>0&&<button onClick={reset}>Начать заново</button>}</div>
 <p><small>Не закрывай вкладку во время синхронизации. При ошибке можно повторить партию без дубликатов. Прогресс этого экрана не сохраняется при перезагрузке.</small></p>
 {message&&<p role="status">{message}</p>}</section>
 <section className="panel"><h2>Проверка первых 5 видео</h2><button disabled={busy||!token.trim()} onClick={firstFive}>Сохранить первые 5 видео</button></section>
 {items.length>0&&<section className="panel"><h2>Сохранённые видео</h2><div className="grid">{items.map(v=><article className="card" key={v.id}><h3>{v.title}</h3><a href={v.url} target="_blank" rel="noopener noreferrer">Смотреть на YouTube ↗</a></article>)}</div></section>}
 <p><a href="/">Вернуться к каталогу</a></p></main>;
}
