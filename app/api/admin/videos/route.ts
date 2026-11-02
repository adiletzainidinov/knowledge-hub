import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const token=process.env.ADMIN_IMPORT_TOKEN;
 if(!token||req.headers.get("authorization")!=="Bearer "+token)return NextResponse.json({error:"Доступ запрещён"},{status:401});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"База не настроена"},{status:503});
 try{
 const response=await fetch(new URL("/rest/v1/videos?select=id,title,url,published_at&order=published_at.desc&limit=100",url),{headers:{"apikey":key,"Authorization":"Bearer "+key},cache:"no-store"});
 if(!response.ok)throw new Error("Ошибка чтения базы: "+response.status);
 return NextResponse.json({videos:await response.json()});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Ошибка"},{status:502});}
}
