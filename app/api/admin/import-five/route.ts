import {NextRequest,NextResponse} from "next/server";
import {isConfigured,upsert} from "../../../../lib/supabase-rest";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const secret=process.env.ADMIN_IMPORT_TOKEN;
 if(!secret)return NextResponse.json({error:"ADMIN_IMPORT_TOKEN не настроен"},{status:503});
 if(req.headers.get("authorization")!=="Bearer "+secret)return NextResponse.json({error:"Доступ запрещён"},{status:401});
 if(!isConfigured()||!process.env.YOUTUBE_API_KEY)return NextResponse.json({error:"Настройте Supabase и YouTube API"},{status:503});
 try{
 const key=process.env.YOUTUBE_API_KEY;
 const cu=new URL("https://www.googleapis.com/youtube/v3/channels");
 cu.searchParams.set("part","snippet,contentDetails");cu.searchParams.set("forHandle","olegcloser");cu.searchParams.set("key",key!);
 const cr=await fetch(cu,{cache:"no-store"});const cd=await cr.json();
 if(!cr.ok||!cd.items?.[0])throw new Error(cd.error?.message||"Канал не найден");
 const ch=cd.items[0];
 const pu=new URL("https://www.googleapis.com/youtube/v3/playlistItems");
 pu.searchParams.set("part","snippet,contentDetails");pu.searchParams.set("playlistId",ch.contentDetails.relatedPlaylists.uploads);
 pu.searchParams.set("maxResults","5");pu.searchParams.set("key",key!);
 const pr=await fetch(pu,{cache:"no-store"});const pd=await pr.json();
 if(!pr.ok)throw new Error(pd.error?.message||"Ошибка получения видео");
 const videos=(pd.items||[]).filter((v:any)=>v.contentDetails?.videoId&&!["Private video","Deleted video"].includes(v.snippet?.title)).map((v:any)=>({id:v.contentDetails.videoId,channel_id:ch.id,title:v.snippet.title,description:v.snippet.description||"",url:"https://www.youtube.com/watch?v="+v.contentDetails.videoId,published_at:v.contentDetails.videoPublishedAt||v.snippet.publishedAt,thumbnail:v.snippet.thumbnails?.medium?.url||null}));
 await upsert("channels",[{id:ch.id,handle:"olegcloser",title:ch.snippet.title,synced_at:new Date().toISOString()}],"id");
 if(videos.length)await upsert("videos",videos,"id");
 return NextResponse.json({ok:true,channel:ch.snippet.title,imported:videos.length,videos:videos.map((v:any)=>({id:v.id,title:v.title,url:v.url})),note:"Сохранены метаданные; конспекты и расшифровки пока отсутствуют."});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ошибка импорта"},{status:502});}
}
