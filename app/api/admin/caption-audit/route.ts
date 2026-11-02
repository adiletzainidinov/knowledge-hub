import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const secret=process.env.ADMIN_IMPORT_TOKEN;
 if(!secret)return NextResponse.json({error:"ADMIN_IMPORT_TOKEN не настроен"},{status:503});
 if(req.headers.get("authorization")!=="Bearer "+secret)return NextResponse.json({error:"Доступ запрещён"},{status:401});
 const base=process.env.SUPABASE_URL,dbkey=process.env.SUPABASE_SERVICE_ROLE_KEY,ytkey=process.env.YOUTUBE_API_KEY;
 if(!base||!dbkey||!ytkey)return NextResponse.json({error:"Не настроены Supabase или YouTube API"},{status:503});
 try{
  const headers={apikey:dbkey,Authorization:"Bearer "+dbkey};
  const vurl=new URL("/rest/v1/videos",base);
  vurl.searchParams.set("select","id,title");
  vurl.searchParams.set("order","published_at.desc");
  vurl.searchParams.set("limit","5");
  const vres=await fetch(vurl,{headers,cache:"no-store"});
  if(!vres.ok)throw new Error("Supabase: "+(await vres.text()).slice(0,200));
  const videos=await vres.json() as {id:string,title:string}[];
  if(!videos.length)return NextResponse.json({videos:[],note:"Каталог пуст"});
  const url=new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part","contentDetails,status");
  url.searchParams.set("id",videos.map(v=>v.id).join(","));
  url.searchParams.set("key",ytkey);
  const response=await fetch(url,{cache:"no-store"});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error?.message||"Ошибка YouTube API");
  const items=new Map<string,{contentDetails?:{caption?:string},status?:{privacyStatus?:string,embeddable?:boolean}}>((result.items||[]).map((v:{id:string,contentDetails?:{caption?:string},status?:{privacyStatus?:string,embeddable?:boolean}})=>[v.id,v]));
  return NextResponse.json({videos:videos.map(v=>{const item=items.get(v.id);return {id:v.id,title:v.title,captionDeclared:item?.contentDetails?.caption==="true",captionStatus:item?.contentDetails?.caption==="true"?"Субтитры отмечены YouTube, доступ к тексту не подтверждён":item?"YouTube не отмечает наличие субтитров":"Видео недоступно через API",privacy:item?.status?.privacyStatus||null};}),note:"Это проверка признака субтитров, не получение текста. YouTube Data API не предоставляет свободный доступ к чужим субтитрам."});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ошибка проверки"},{status:502});}
}
