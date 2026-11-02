type RecordData = Record<string, unknown>;
export function isConfigured(){return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);}
export async function upsert(table:"channels"|"videos"|"video_notes",rows:RecordData[],onConflict:string){
 if(!isConfigured()) throw new Error("Supabase не настроен");
 const url=new URL("/rest/v1/"+table,process.env.SUPABASE_URL!);
 url.searchParams.set("on_conflict",onConflict);
 const res=await fetch(url,{method:"POST",headers:{"apikey":process.env.SUPABASE_SERVICE_ROLE_KEY!,"Authorization":"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY!,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows),cache:"no-store"});
 if(!res.ok)throw new Error("Ошибка Supabase ("+res.status+"): "+(await res.text()).slice(0,250));
}
