import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return NextResponse.json({error:"База данных не настроена"},{status:503});
 const rawPage=Number(req.nextUrl.searchParams.get("page")||"1");
 const page=Number.isInteger(rawPage)?Math.min(1000,Math.max(1,rawPage)):1;
 const q=(req.nextUrl.searchParams.get("q")||"").trim().slice(0,120);
 const pageSize=30;
 const url=new URL("/rest/v1/videos",base);
 url.searchParams.set("select","id,title,description,url,published_at,thumbnail");
 url.searchParams.set("order","published_at.desc.nullslast,id.asc");
 url.searchParams.set("limit",String(pageSize));
 url.searchParams.set("offset",String((page-1)*pageSize));
 if(q)url.searchParams.set("or",`(title.ilike.*${escapeSearch(q)}*,description.ilike.*${escapeSearch(q)}*)`);
 try{
  const res=await fetch(url,{headers:{"apikey":key,"Authorization":"Bearer "+key,"Prefer":"count=exact"},cache:"no-store"});
  if(!res.ok)throw new Error("Ошибка чтения каталога ("+res.status+")");
  const videos=await res.json();
  const range=res.headers.get("content-range")||"";
  const count=Number(range.split("/")[1]);
  return NextResponse.json({videos,page,pageSize,total:Number.isFinite(count)?count:null,hasMore:videos.length===pageSize});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ошибка сервера"},{status:502});}
}
function escapeSearch(q:string){return q.replace(/[,*().%_\\]/g," ").replace(/\s+/g," ").trim();}
