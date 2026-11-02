"use client";
import {useState} from "react";
export default function Admin(){
 const [token,setToken]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [items,setItems]=useState<{id:string;title:string;url:string}[]>([]);
 async function run(){
 setBusy(true);setMessage("");setItems([]);
 try{
 const response=await fetch("/api/admin/import-five",{method:"POST",headers:{"Authorization":"Bearer "+token}});
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||"Не удалось сохранить видео");
 setItems(data.videos||[]);setMessage("Успешно сохранено видео: "+data.imported+". Данные записаны в Supabase.");
 }catch(error){setMessage(error instanceof Error?error.message:"Неизвестная ошибка");}
 finally{setBusy(false);}
 }
 return <main><header>📚 KnowledgeHub <span style={{float:"right",fontSize:13}}>Администрирование</span></header>
 <h1>Библиотека знаний</h1><p>Защищённый импорт первых пяти видео канала @olegcloser. Видеофайлы не скачиваются.</p>
 <section className="panel"><h2>Сохранить первые 5 видео</h2><div className="form"><input type="password" autoComplete="off" aria-label="Токен администратора" placeholder="ADMIN_IMPORT_TOKEN" value={token} onChange={e=>setToken(e.target.value)}/><button disabled={busy||!token.trim()} onClick={run}>{busy?"Сохраняем...":"Сохранить в базу"}</button></div><p><small>Токен используется только для запроса и не сохраняется в браузере. Не вводи его на чужих устройствах.</small></p>{message&&<p role="status">{message}</p>}</section>
 {items.length>0&&<section className="panel"><h2>Сохранённые видео</h2><div className="grid">{items.map(v=><article className="card" key={v.id}><h3>{v.title}</h3><a href={v.url} target="_blank" rel="noopener noreferrer">Смотреть на YouTube ↗</a></article>)}</div></section>}
 <p><a href="/">Вернуться к каталогу</a></p></main>;
}
