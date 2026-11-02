import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[a-zA-Z0-9_-]{11}$/.test(id))return NextResponse.json({error:"Неверный ID видео"},{status:400});
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return NextResponse.json({error:"База не настроена"},{status:503});
 const url=new URL("/rest/v1/videos",base);
 url.searchParams.set("select","id,title,description,url,published_at,thumbnail");
 url.searchParams.set("id","eq."+id);
 url.searchParams.set("limit","1");
 try{
 const res=await fetch(url,{headers:{"apikey":key,"Authorization":"Bearer "+key},cache:"no-store"});
 if(!res.ok)throw new Error("Ошибка Supabase ("+res.status+")");
 const videos=await res.json();
 if(!videos.length)return NextResponse.json({error:"Видео не найдено"},{status:404});
 return NextResponse.json({video:videos[0]});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ошибка чтения"},{status:502});}
}
