import type { Project, Skill } from '@/components/types'

export function SkillGraph({ skills, projects }: { skills: Skill[]; projects: Project[] }) {
  const visibleProjects = projects.slice(0, 3)
  const visibleSkills = skills.slice(0, 5)
  if (!visibleProjects.length && !visibleSkills.length) return <div className="graph-empty"><span className="graph-center-static">CareerOS</span><p>Add skills and projects to build your evidence map.</p></div>

  const projectPositions = visibleProjects.map((project,index) => ({ project, x: 108, y: 66 + index * 76 }))
  const skillPositions = visibleSkills.map((skill,index) => ({ skill, x: 412, y: 38 + index * 52 }))

  return <div className="skill-graph-wrap"><svg className="skill-graph" viewBox="0 0 520 300" role="img" aria-label="Projects connected to skills">
    <defs><linearGradient id="career-node" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#61e1c0"/><stop offset="1" stopColor="#2fbf98"/></linearGradient></defs>
    {projectPositions.map(({project,x,y}) => <line key={`c-${project.id}`} x1="260" y1="150" x2={x+45} y2={y} className="graph-line graph-line-primary"/>)}
    {projectPositions.flatMap(({project,x,y}) => project.skills.map(ps => { const target = skillPositions.find(({skill}) => skill.id === ps.id); return target ? <line key={`${project.id}-${ps.id}`} x1={x+88} y1={y} x2={target.x-54} y2={target.y} className="graph-line"/> : null }).filter(Boolean))}
    {!visibleProjects.length && skillPositions.map(({skill,x,y}) => <line key={`s-${skill.id}`} x1="260" y1="150" x2={x-50} y2={y} className="graph-line"/>)}
    <circle cx="260" cy="150" r="50" fill="url(#career-node)" className="graph-center"/><text x="260" y="146" textAnchor="middle" className="graph-center-title">CareerOS</text><text x="260" y="164" textAnchor="middle" className="graph-center-subtitle">evidence</text>
    {projectPositions.map(({project,x,y}) => <g key={project.id}><rect x={x-45} y={y-18} width="90" height="36" rx="18" className="graph-project-node"/><text x={x} y={y+4} textAnchor="middle" className="graph-node-label">{project.title.length > 14 ? `${project.title.slice(0,12)}…` : project.title}</text></g>)}
    {skillPositions.map(({skill,x,y}) => <g key={skill.id}><rect x={x-54} y={y-17} width="108" height="34" rx="17" className="graph-skill-node"/><text x={x} y={y+4} textAnchor="middle" className="graph-node-label">{skill.name.length > 16 ? `${skill.name.slice(0,14)}…` : skill.name}</text></g>)}
  </svg><div className="graph-legend" aria-hidden="true"><span><i className="project-dot"/>Projects</span><span><i className="skill-dot"/>Skills</span></div></div>
}
