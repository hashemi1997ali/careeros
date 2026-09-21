import { NextResponse } from 'next/server'
import { getApiAccessToken } from '@/lib/api-auth'
import { careerOs } from '@/lib/config'
import { upstreamResponse } from '@/lib/upstream-response'
export const runtime='nodejs'; export const dynamic='force-dynamic'
export async function GET(request:Request){const token=await getApiAccessToken();if(!token)return NextResponse.json({error:'not_authenticated'},{status:401});const requestUrl=new URL(request.url);const upstreamUrl=new URL('/api/skills',careerOs().SERVER_URL);upstreamUrl.search=requestUrl.search;return upstreamResponse(await fetch(upstreamUrl,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'}))}
export async function POST(request:Request){const token=await getApiAccessToken();if(!token)return NextResponse.json({error:'not_authenticated'},{status:401});let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}return upstreamResponse(await fetch(`${careerOs().SERVER_URL}/api/skills`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'}))}
