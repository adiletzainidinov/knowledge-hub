import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
type RecordRow={video_id:string;transcript:string;language:string|null;verified:boolean|null};
type Video={id:string;title:string;url:string};
const stop=new Set(["это","того","когда","если","чтобы","какие","какой","почему","очень","можно","нужно","просто","видео","продажи","продаж","клиент","клиента","клиенты","about","with","from"]);
function words(s:string){return [...new Set((s.toLowerCase().match(/[а-яёa-z0-9]{3,}/g)||[]).filter(w=>!stop.has(w)))].slice(0,20)}
async function read<T>(base:string,key:string,table:string,select:string):Promise<T[]>{
 const all:T[]=[];
 for(let offset=0;offset<10000;offset+=200){
  const url=new URL("/rest/v1/"+table,base);
  url.searchParams.set("select",select);url.searchParams.set("limit","200");url.searchParams.set("offset",String(offset));
  const r=await fetch(url,{headers:{apikey:key,Authorization:"Bearer "+key},cache:"no-store"});
  if(!r.ok)throw Error("Database HTTP "+r.status);
  const rows=await r.json() as T[];all.push(...rows);
  if(rows.length<200)break;
 }
 return all;
}
export async function POST(req:NextRequest){
 const token=process.env.ADMIN_IMPORT_TOKEN;
 if(!token||req.headers.get("authorization")!=="Bearer "+token)return NextResponse.json({error:"Нет доступа"},{status:401});
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return NextResponse.json({error:"База не настроена"},{status:503});
 try{
  const body=await req.json() as {query?:string};
  const query=String(body.query||"").trim().slice(0,250);
  if(query.length<3)return NextResponse.json({error:"Введите вопрос от 3 символов"},{status:400});
  const terms=words(query);
  if(!terms.length)return NextResponse.json({error:"Уточните вопрос"},{status:400});
  const [transcripts,videos]=await Promise.all([
   read<RecordRow>(base,key,"video_transcripts","video_id,transcript,language,verified"),
   read<Video>(base,key,"videos","id,title,url")
  ]);
  const names=new Map(videos.map(v=>[v.id,v]));
  const hits:{video_id:string;title:string;url:string;excerpt:string;score:number;verified:boolean;position:number}[]=[];
  for(const t of transcripts){
   const paragraphs=t.transcript.match(/[\s\S]{1,900}/g)||[];
   const scored=paragraphs.map((p,i)=>{
    const low=p.toLowerCase();
    const score=terms.reduce((n,w)=>n+(low.includes(w)?1:0),0);
    return {p,i,score};
   }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
   for(const item of scored.slice(0,2)){
    const v=names.get(t.video_id);
    hits.push({video_id:t.video_id,title:v?.title||t.video_id,url:v?.url||"https://www.youtube.com/watch?v="+t.video_id,excerpt:item.p.trim(),score:item.score,verified:t.verified===true,position:item.i*900});
   }
  }
  hits.sort((a,b)=>b.score-a.score);
  const selected=[] as typeof hits;const used=new Set<string>();
  for(const h of hits){if(!used.has(h.video_id)){selected.push(h);used.add(h.video_id)}if(selected.length>=12)break}
  return NextResponse.json({query,scanned_transcripts:transcripts.length,matched_videos:used.size,results:selected,notice:"Это найденные фрагменты источников, а не готовый ответ ИИ. Автоматическая полнота и точность субтитров не подтверждены."},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ошибка поиска"},{status:502})}
}
