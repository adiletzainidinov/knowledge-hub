import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const token=process.env.ADMIN_IMPORT_TOKEN;
 if(!token||req.headers.get("authorization")!=="Bearer "+token)return NextResponse.json({error:"Unauthorized"},{status:401});
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return NextResponse.json({error:"Database not configured"},{status:503});
 try{
  const rows:{video_id:string;transcript:string;language:string|null;verified:boolean|null;source_note:string|null}[]=[];
  for(let offset=0;offset<10000;offset+=100){
   const u=new URL("/rest/v1/video_transcripts",base);
   u.searchParams.set("select","video_id,transcript,language,verified,source_note");
   u.searchParams.set("order","video_id.asc");
   u.searchParams.set("limit","100");u.searchParams.set("offset",String(offset));
   const r=await fetch(u,{headers:{apikey:key,Authorization:"Bearer "+key},cache:"no-store"});
   if(!r.ok)throw new Error("Supabase HTTP "+r.status);
   const page=await r.json() as typeof rows;
   rows.push(...page);
   if(page.length<100)break;
  }
  return NextResponse.json({transcripts:rows},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Database error"},{status:502});}
}
