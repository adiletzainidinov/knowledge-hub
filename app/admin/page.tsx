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
 const [videoId,setVideoId]=useState("");
 const [transcript,setTranscript]=useState("");
 const [sourceNote,setSourceNote]=useState("");
 const [transcriptStatus,setTranscriptStatus]=useState("");
 const [captionAudit,setCaptionAudit]=useState<{id:string;title:string;captionStatus:string}[]>([]);
 const [readiness,setReadiness]=useState<{id:string;title:string;transcript:{verified:boolean;source_type:string}|null}[]>([]);
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
 async function loadTxt(file:File|undefined){if(!file)return;setTranscriptStatus("");if(file.size>1024*1024){setTranscriptStatus("Файл слишком большой (максимум 1 МБ)");return;}if(!/\.txt$/i.test(file.name)){setTranscriptStatus("Выбери TXT-файл");return;}try{const content=await file.text();if(content.length<50||content.length>500000)throw new Error("Текст должен содержать от 50 до 500000 символов");setTranscript(content);const match=file.name.match(/(?:youtube-transcript-)?([a-zA-Z0-9_-]{11})\.txt$/);if(match)setVideoId(match[1]);setSourceNote("TXT-расшифровка, предоставленная пользователем; источник: YouTube / yoututranscript.com; права использования требуют подтверждения");setTranscriptStatus("Файл загружен в форму: "+content.length+" символов. Проверь ID и источник перед сохранением.");}catch(e){setTranscriptStatus(e instanceof Error?e.message:"Ошибка чтения TXT");}}
 async function saveTranscript(){setBusy(true);setTranscriptStatus("");try{const data=await request("/api/admin/transcripts",{video_id:videoId,transcript,source_note:sourceNote});setTranscriptStatus("Расшифровка сохранена: "+data.characters+" символов. Ожидает проверки.");}catch(e){setTranscriptStatus(e instanceof Error?e.message:"Ошибка сохранения");}finally{setBusy(false);}}
 async function checkReadiness(){setBusy(true);setTranscriptStatus("");try{const data=await request("/api/admin/transcript-status");setReadiness(data.videos||[]);}catch(e){setTranscriptStatus(e instanceof Error?e.message:"Ошибка проверки");}finally{setBusy(false);}}
 async function auditCaptions(){setBusy(true);setTranscriptStatus("");try{const data=await request("/api/admin/caption-audit");setCaptionAudit(data.videos||[]);}catch(e){setTranscriptStatus(e instanceof Error?e.message:"Ошибка проверки субтитров");}finally{setBusy(false);}}
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
 <section className="panel"><h2>Готовность первых пяти видео</h2><p>Проверка показывает, есть ли сохранённая расшифровка. Она не скачивает субтитры с YouTube.</p><button disabled={busy||!token.trim()} onClick={checkReadiness}>Проверить первые 5 видео</button>{readiness.map(v=><article className="card" key={v.id}><h3>{v.title}</h3><p>{v.transcript?(v.transcript.verified?"Текст проверен":"Текст сохранён, ожидает проверки"):"Расшифровка отсутствует"}</p><button disabled={busy} onClick={()=>{setVideoId(v.id);setTranscriptStatus("Выбрано видео: "+v.title+". Добавь текст и источник ниже.");}}>Выбрать для импорта</button></article>)}</section>
 <section className="panel"><h2>Проверка субтитров YouTube</h2><p>Бесплатная проверка первых пяти видео. Проверяем только признак наличия субтитров, не скачиваем тексты и видео.</p><button disabled={busy||!token.trim()} onClick={auditCaptions}>Проверить субтитры 5 видео</button>{captionAudit.map(v=><article className="card" key={v.id}><h3>{v.title}</h3><p>{v.captionStatus}</p></article>)}</section>
 <section className="panel"><h2>Импорт расшифровки</h2><p>Для текста, полученного законным способом. Источник обязателен. ИИ-конспект не создаётся до проверки содержания.</p><p><label>Загрузить TXT с тайм-кодами <input type="file" accept=".txt,text/plain" onChange={e=>void loadTxt(e.target.files?.[0])}/></label></p><p><input aria-label="YouTube ID видео" placeholder="YouTube ID (11 символов)" value={videoId} onChange={e=>setVideoId(e.target.value)}/></p><p><textarea aria-label="Текст расшифровки" rows={10} style={{width:"100%",padding:12,borderRadius:12,background:"#0b1020",color:"white"}} placeholder="Вставь полный текст расшифровки…" value={transcript} onChange={e=>setTranscript(e.target.value)}/></p><p><input aria-label="Источник текста" placeholder="Источник текста и разрешение на использование" value={sourceNote} onChange={e=>setSourceNote(e.target.value)}/></p><button disabled={busy||!token.trim()||!videoId.trim()||transcript.trim().length<50||!sourceNote.trim()} onClick={saveTranscript}>Сохранить расшифровку</button>{transcriptStatus&&<p role="status">{transcriptStatus}</p>}</section>
 <p><a href="/">Вернуться к каталогу</a></p></main>;
}
