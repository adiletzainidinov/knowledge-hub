import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const secret=process.env.ADMIN_IMPORT_TOKEN;
 if(!secret)return NextResponse.json({error:"ADMIN_IMPORT_TOKEN не настроен"},{status:503});
 if(req.headers.get("authorization")!=="Bearer "+secret)return NextResponse.json({error:"Доступ запрещён"},{status:401});
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return NextResponse.json({error:"Supabase не настроен"},{status:503});
 try{
 const body=await req.json();
 const video_id=String(body.video_id||"").trim(),transcript=String(body.transcript||"").trim();
 if(!/^[a-zA-Z0-9_-]{11}$/.test(video_id))return NextResponse.json({error:"Неверный ID видео"},{status:400});
 if(transcript.length<50||transcript.length>500000)return NextResponse.json({error:"Текст должен содержать от 50 до 500000 символов"},{status:400});
 const source_note=String(body.source_note||"").trim().slice(0,500);
 if(!source_note)return NextResponse.json({error:"Укажи происхождение текста и право на использование"},{status:400});
 const url=new URL("/rest/v1/video_transcripts",base);
 url.searchParams.set("on_conflict","video_id");
 const result=await fetch(url,{method:"POST",headers:{"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify([{video_id,transcript,language:"ru",source_type:"user_provided",source_note,verified:false,updated_at:new Date().toISOString()}]),cache:"no-store"});
 if(!result.ok)throw new Error("Supabase: "+result.status+" "+(await result.text()).slice(0,300));
 return NextResponse.json({ok:true,video_id,characters:transcript.length});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ошибка сохранения"},{status:502});}
}
