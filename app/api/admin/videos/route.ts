import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const token=process.env.ADMIN_IMPORT_TOKEN;
 if(!token||req.headers.get("authorization")!=="Bearer "+token)return NextResponse.json({error:"Доступ запрещён"},{status:401});
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return NextResponse.json({error:"База не настроена"},{status:503});
 try{
  const videos:{id:string;title:string;url:string;published_at:string|null}[]=[];
  for(let offset=0;offset<10000;offset+=1000){
   const url=new URL("/rest/v1/videos",base);
   url.searchParams.set("select","id,title,url,published_at");
   url.searchParams.set("order","published_at.desc,id.asc");
   url.searchParams.set("limit","1000");url.searchParams.set("offset",String(offset));
   const response=await fetch(url,{headers:{apikey:key,Authorization:"Bearer "+key},cache:"no-store"});
   if(!response.ok)throw new Error("Ошибка чтения базы: "+response.status);
   const rows=await response.json();
   videos.push(...rows);
   if(rows.length<1000)break;
  }
  return NextResponse.json({videos});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ошибка"},{status:502});}
}
