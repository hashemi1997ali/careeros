import { NextResponse } from 'next/server'
import { getApiAccessToken } from '@/lib/api-auth'
import { careerOs } from '@/lib/config'
import { upstreamResponse } from '@/lib/upstream-response'
export const runtime='nodejs'; export const dynamic='force-dynamic'; type Context={params:Promise<{id:string}>}
export async function GET(_request:Request,context:Context){const token=await getApiAccessToken();if(!token)return NextResponse.json({error:'not_authenticated'},{status:401});const{id}=await context.params;return upstreamResponse(await fetch(`${careerOs().SERVER_URL}/api/job-applications/${id}/match`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'}))}
