import { NextResponse } from 'next/server'
import { getApiAccessToken } from '@/lib/api-auth'
import { careerOs } from '@/lib/config'
import { upstreamResponse } from '@/lib/upstream-response'
export const runtime='nodejs'; export const dynamic='force-dynamic'; type Context={params:Promise<{id:string}>}
async function forward(method:'GET'|'PUT'|'DELETE',request:Request,context:Context){const token=await getApiAccessToken();if(!token)return NextResponse.json({error:'not_authenticated'},{status:401});const{id}=await context.params;const init:RequestInit={method,headers:{Authorization:`Bearer ${token}`},cache:'no-store'};if(method==='PUT'){let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}init.headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};init.body=JSON.stringify(body)}return upstreamResponse(await fetch(`${careerOs().SERVER_URL}/api/projects/${id}`,init))}
export async function GET(r:Request,c:Context){return forward('GET',r,c)} export async function PUT(r:Request,c:Context){return forward('PUT',r,c)} export async function DELETE(r:Request,c:Context){return forward('DELETE',r,c)}
