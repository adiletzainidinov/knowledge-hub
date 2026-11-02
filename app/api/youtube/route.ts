import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
type YTItem = { id: string; title: string; description: string; publishedAt: string; thumbnail: string; url: string };
export async function GET(req: NextRequest) {
 const key = process.env.YOUTUBE_API_KEY;
 if (!key) return NextResponse.json({error:"Для импорта требуется YOUTUBE_API_KEY в настройках сервера."},{status:503});
 const handle = req.nextUrl.searchParams.get("handle")?.trim().replace(/^@/,"");
 const pageToken = req.nextUrl.searchParams.get("pageToken") || "";
 if (!handle || !/^[a-zA-Z0-9._-]{1,100}$/.test(handle)) return NextResponse.json({error:"Неверный YouTube handle"},{status:400});
 try {
  const base="https://www.googleapis.com/youtube/v3/";
  const channelUrl=new URL("channels",base);
  channelUrl.searchParams.set("part","contentDetails,snippet");
  channelUrl.searchParams.set("forHandle",handle);
  channelUrl.searchParams.set("key",key);
  const channelRes=await fetch(channelUrl,{next:{revalidate:3600}});
  const channel=await channelRes.json();
  if (!channelRes.ok) throw new Error(channel.error?.message || "YouTube API error");
  const ch=channel.items?.[0];
  if(!ch) return NextResponse.json({error:"Канал не найден"},{status:404});
  const listUrl=new URL("playlistItems",base);
  listUrl.searchParams.set("part","snippet,contentDetails");
  listUrl.searchParams.set("playlistId",ch.contentDetails.relatedPlaylists.uploads);
  listUrl.searchParams.set("maxResults","50");
  listUrl.searchParams.set("key",key);
  if(pageToken) listUrl.searchParams.set("pageToken",pageToken);
  const listRes=await fetch(listUrl,{cache:"no-store"});
  const list=await listRes.json();
  if(!listRes.ok) throw new Error(list.error?.message || "YouTube API error");
  const videos:YTItem[]=(list.items||[]).filter((x:any)=>x.contentDetails?.videoId && x.snippet?.title!=="Private video" && x.snippet?.title!=="Deleted video").map((x:any)=>({id:x.contentDetails.videoId,title:x.snippet.title,description:x.snippet.description||"",publishedAt:x.contentDetails.videoPublishedAt||x.snippet.publishedAt,thumbnail:x.snippet.thumbnails?.medium?.url||"",url:"https://www.youtube.com/watch?v="+x.contentDetails.videoId}));
  return NextResponse.json({channel:{id:ch.id,title:ch.snippet.title,handle},videos,nextPageToken:list.nextPageToken||null,totalApprox:list.pageInfo?.totalResults||0});
 } catch(e) {return NextResponse.json({error:e instanceof Error?e.message:"Ошибка импорта"},{status:502});}
}
