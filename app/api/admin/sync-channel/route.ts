import {NextRequest,NextResponse} from "next/server";
import {isConfigured,upsert} from "../../../../lib/supabase-rest";
export const runtime="nodejs";
export const maxDuration=30;
export async function POST(req:NextRequest){
 const secret=process.env.ADMIN_IMPORT_TOKEN;
 if(!secret)return NextResponse.json({error:"Токен администратора не настроен"},{status:503});
 if(req.headers.get("authorization")!=="Bearer "+secret)return NextResponse.json({error:"Доступ запрещён"},{status:401});
 if(!isConfigured()||!process.env.YOUTUBE_API_KEY)return NextResponse.json({error:"Не настроены Supabase или YouTube API"},{status:503});
 try{
  const body=await req.json().catch(()=>({}));
  const pageToken=body.pageToken;
  if(pageToken!==undefined&&(typeof pageToken!=="string"||pageToken.length>500))return NextResponse.json({error:"Неверный токен страницы"},{status:400});
  const key=process.env.YOUTUBE_API_KEY!;
  const chUrl=new URL("https://www.googleapis.com/youtube/v3/channels");
  chUrl.searchParams.set("part","snippet,contentDetails,statistics");chUrl.searchParams.set("forHandle","olegcloser");chUrl.searchParams.set("key",key);
  const chResponse=await fetch(chUrl,{cache:"no-store"});
  const chData=await chResponse.json();
  if(!chResponse.ok||!chData.items?.[0])throw new Error(chData.error?.message||"Канал не найден");
  const channel=chData.items[0];
  const pUrl=new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  pUrl.searchParams.set("part","snippet,contentDetails");pUrl.searchParams.set("playlistId",channel.contentDetails.relatedPlaylists.uploads);
  pUrl.searchParams.set("maxResults","50");pUrl.searchParams.set("key",key);
  if(pageToken)pUrl.searchParams.set("pageToken",pageToken);
  const response=await fetch(pUrl,{cache:"no-store"});const data=await response.json();
  if(!response.ok)throw new Error(data.error?.message||"Ошибка YouTube API");
  const videos=(data.items||[]).filter((v:any)=>v.contentDetails?.videoId&&!["Private video","Deleted video"].includes(v.snippet?.title)).map((v:any)=>({
   id:v.contentDetails.videoId,channel_id:channel.id,title:v.snippet.title,description:v.snippet.description||"",
   url:"https://www.youtube.com/watch?v="+v.contentDetails.videoId,
   published_at:v.contentDetails.videoPublishedAt||v.snippet.publishedAt||null,
   thumbnail:v.snippet.thumbnails?.medium?.url||null
  }));
  await upsert("channels",[{id:channel.id,handle:"olegcloser",title:channel.snippet.title,synced_at:new Date().toISOString()}],"id");
  if(videos.length)await upsert("videos",videos,"id");
  return NextResponse.json({ok:true,imported:videos.length,nextPageToken:data.nextPageToken||null,totalApprox:Number(channel.statistics?.videoCount||data.pageInfo?.totalResults||0),channel:channel.snippet.title});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ошибка синхронизации"},{status:502});}
}