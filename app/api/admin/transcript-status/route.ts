import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const secret=process.env.ADMIN_IMPORT_TOKEN;
 if(!secret)return NextResponse.json({error:"ADMIN_IMPORT_TOKEN не настроен"},{status:503});
 if(req.headers.get("authorization")!=="Bearer "+secret)return NextResponse.json({error:"Доступ запрещён"},{status:401});
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return NextResponse.json({error:"Supabase не настроен"},{status:503});
 try{
  const h={apikey:key,Authorization:"Bearer "+key};
  const videos=await fetch(new URL("/rest/v1/videos?select=id,title&order=published_at.desc&limit=5",base),{headers:h,cache:"no-store"});
  if(!videos.ok)return NextResponse.json({error:"Ошибка чтения videos: "+(await videos.text()).slice(0,200)},{status:502});
  const rows=await videos.json() as {id:string,title:string}[];
  if(!rows.length)return NextResponse.json({videos:[]});
  const ids=rows.map(v=>'"'+v.id.replace(/[^a-zA-Z0-9_-]/g,"")+'"').join(",");
  const url=new URL("/rest/v1/video_transcripts",base);
  url.searchParams.set("select","video_id,source_type,verified");
  url.searchParams.set("video_id","in.("+ids+")");
  const saved=await fetch(url,{headers:h,cache:"no-store"});
  if(!saved.ok)return NextResponse.json({error:"Ошибка чтения video_transcripts: "+(await saved.text()).slice(0,200)},{status:502});
  const existing=await saved.json() as {video_id:string,source_type:string,verified:boolean}[];
  return NextResponse.json({videos:rows.map(v=>({...v,transcript:existing.find(t=>t.video_id===v.id)||null}))});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ошибка"},{status:502});}
}
