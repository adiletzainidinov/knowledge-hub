import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const token=process.env.ADMIN_IMPORT_TOKEN;
 if(!token||req.headers.get("authorization")!=="Bearer "+token)return NextResponse.json({error:"Unauthorized"},{status:401});
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return NextResponse.json({error:"Database not configured"},{status:503});
 try{
  const ids:string[]=[];
  for(let offset=0;offset<10000;offset+=1000){
   const url=new URL("/rest/v1/video_transcripts",base);
   url.searchParams.set("select","video_id");url.searchParams.set("limit","1000");url.searchParams.set("offset",String(offset));
   const r=await fetch(url,{headers:{apikey:key,Authorization:"Bearer "+key},cache:"no-store"});
   if(!r.ok)throw new Error("Supabase HTTP "+r.status);
   const rows=await r.json() as {video_id:string}[];
   ids.push(...rows.map(x=>x.video_id));
   if(rows.length<1000)break;
  }
  return NextResponse.json({video_ids:ids});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Database error"},{status:502});}
}
