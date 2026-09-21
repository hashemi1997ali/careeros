'use client'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog } from '@/components/dialog'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { apiFetch } from '@/lib/api-client'
import type { Skill, SkillLevel } from '@/components/types'
const levels:SkillLevel[]=['Beginner','Intermediate','Advanced']

export default function SkillsPage(){
 const router=useRouter(),params=useSearchParams(),client=useQueryClient();const[category,setCategory]=useState('All');const[search,setSearch]=useState(params.get('search')??'');const[open,setOpen]=useState(params.get('new')==='1');const[editing,setEditing]=useState<Skill|null>(null);const[name,setName]=useState('');const[cat,setCat]=useState('');const[level,setLevel]=useState<SkillLevel>('Beginner');const[error,setError]=useState<string|null>(null);const[listError,setListError]=useState<string|null>(null)
 const q=useQuery({queryKey:['skills'],queryFn:()=>apiFetch<Skill[]>('/api/skills')});const skills=useMemo(()=>q.data??[],[q.data])
 function openCreate(){setEditing(null);setName('');setCat('');setLevel('Beginner');setError(null);setOpen(true)}
 useEffect(()=>{if(params.get('new')!=='1')return;const timer=window.setTimeout(()=>openCreate(),0);return()=>window.clearTimeout(timer)},[params])
 function openEdit(s:Skill){setEditing(s);setName(s.name);setCat(s.category);setLevel(s.level);setError(null);setOpen(true)}
 function close(){setOpen(false);setEditing(null);setError(null);if(params.get('new')==='1')router.replace('/skills')}
 const save=useMutation({
  mutationFn:async({id,payload}:{id:number|null;payload:Pick<Skill,'name'|'category'|'level'>})=>id===null
   ? apiFetch<Skill>('/api/skills',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
   : apiFetch<void>(`/api/skills/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),
  onSuccess:(created,{id,payload})=>{client.setQueryData<Skill[]>(['skills'],(previous=[])=>id===null&&created?[created,...previous]:previous.map(skill=>skill.id===id?{...skill,...payload}:skill));close();void Promise.all([client.invalidateQueries({queryKey:['skills']}),client.invalidateQueries({queryKey:['projects']}),client.invalidateQueries({queryKey:['dashboard']})])},
  onError:(cause:Error)=>setError(cause.message),
 })
 const del=useMutation({
  mutationFn:(id:number)=>apiFetch<void>(`/api/skills/${id}`,{method:'DELETE'}),
  onMutate:async(id)=>{setListError(null);await client.cancelQueries({queryKey:['skills']});const previous=client.getQueryData<Skill[]>(['skills']);client.setQueryData<Skill[]>(['skills'],(current=[])=>current.filter(skill=>skill.id!==id));return{previous}},
  onError:(cause:Error,_id,context)=>{if(context?.previous)client.setQueryData(['skills'],context.previous);setListError(cause.message)},
  onSettled:()=>{void Promise.all([client.invalidateQueries({queryKey:['skills']}),client.invalidateQueries({queryKey:['projects']}),client.invalidateQueries({queryKey:['dashboard']})])},
 })
 const categories=useMemo(()=>['All',...Array.from(new Set(skills.map(s=>s.category)))],[skills]);const visible=useMemo(()=>{const t=search.trim().toLowerCase();return skills.filter(s=>(category==='All'||s.category===category)&&(!t||`${s.name} ${s.category}`.toLowerCase().includes(t)))},[category,search,skills])
 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(name.trim().length<2||cat.trim().length<2)return;save.mutate({id:editing?.id??null,payload:{name:name.trim(),category:cat.trim(),level}})}
 return <><section className="page-heading"><div><p className="eyebrow">YOUR CAPABILITIES</p><h1>Skills</h1><p>Track what you know and connect it to real evidence.</p></div><button className="button button-primary" type="button" onClick={openCreate}><Icon name="plus"/>Add skill</button></section><div className="resource-toolbar"><div className="filter-tabs">{categories.map(item=><button className={item===category?'is-active':''} type="button" onClick={()=>setCategory(item)} key={item}>{item}<span>{item==='All'?skills.length:skills.filter(s=>s.category===item).length}</span></button>)}</div><label className="inline-search"><Icon name="search"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search skills"/></label></div>{(q.error||listError)&&<div className="error-banner" role="alert">{listError??q.error?.message}</div>}{q.isPending?<div className="card-grid content-skeleton"><i/><i/><i/></div>:visible.length?<section className="card-grid">{visible.map(s=><article className="skill-card" key={s.id}><div className="skill-card-head"><span className="skill-monogram">{s.name.slice(0,2).toUpperCase()}</span><div className="card-actions"><button className="danger" type="button" onClick={()=>window.confirm(`Delete ${s.name}?`)&&del.mutate(s.id)} aria-label={`Delete ${s.name}`} title={`Delete ${s.name}`}><Icon name="trash" size={17}/></button><button type="button" onClick={()=>openEdit(s)} aria-label={`Edit ${s.name}`} title={`Edit ${s.name}`}><Icon name="edit" size={17}/></button></div></div><p>{s.category}</p><h2>{s.name}</h2><span className={`level-pill ${s.level}`}>{s.level}</span></article>)}</section>:<section className="panel"><EmptyState title="No skills found" description={search||category!=='All'?'Change the filter or search term.':'Add skills to build your profile and improve job matching.'}/></section>}
 <Dialog open={open} onClose={close} eyebrow={editing?'UPDATE SKILL':'NEW CAPABILITY'} title={editing?`Edit ${editing.name}`:'Add a skill'} description="Keep the profile simple: name, category and your current proficiency level."><form className="dialog-form" onSubmit={submit}>{error&&<div className="form-error">{error}</div>}<label>Skill name<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Docker"/></label><label>Category<input required minLength={2} maxLength={50} value={cat} onChange={e=>setCat(e.target.value)} placeholder="DevOps"/></label><label>Proficiency<select value={level} onChange={e=>setLevel(e.target.value as SkillLevel)}>{levels.map(x=><option key={x}>{x}</option>)}</select></label><div className="dialog-actions"><button className="button button-ghost" type="button" onClick={close}>Cancel</button><button className="button button-primary" type="submit" disabled={save.isPending}>{save.isPending?'Saving…':editing?'Save changes':'Add skill'}</button></div></form></Dialog></>
}
