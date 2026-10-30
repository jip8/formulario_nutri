import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/nunito-sans/latin-400.css';
import '@fontsource/nunito-sans/latin-600.css';
import '@fontsource/nunito-sans/latin-700.css';
import '@fontsource/nunito-sans/latin-800.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/fraunces/latin-700.css';
import '@fontsource/fraunces/latin-900.css';
import './style.css';
import './editorial.css';
import './document.css';
import Icon from './Icons';
import Booklet from './Booklet';
import Navigation from './Navigation';
let csrf = '';
async function api(path, data) {
  const options = data ? {method:'POST', headers:{'Content-Type':'application/json','X-CSRF-Token':csrf}, body:JSON.stringify(data)} : {};
  const response = await fetch('/api'+path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Não foi possível concluir. Tente novamente.');
  return result;
}
function App(){
  const [session,setSession]=useState(null),[q,setQ]=useState(null),[error,setError]=useState('');
  const [path,setPath]=useState(location.pathname),[submitted,setSubmitted]=useState(false);
  function go(path){history.pushState({},'',path);setPath(path);setError('');}
  useEffect(()=>{const handler=()=>setPath(location.pathname);addEventListener('popstate',handler);return()=>removeEventListener('popstate',handler)},[]);
  useEffect(()=>{Promise.all([api('/session'),api('/questionnaire')]).then(([s,q])=>{csrf=s.csrf;setSession(s);setQ(q)}).catch(e=>setError(e.message))},[]);
  const admin=path.startsWith('/admin');
  async function logout(){try{const s=await api('/logout',{});csrf=s.csrf;setSession(s);go('/admin')}catch(e){setError(e.message)}}
  return <><header className={admin?'admin-header':'public-header'}><a className="brand" href="/" onClick={e=>{e.preventDefault();go('/')}}><span className="brand-text">{q?.title||'Cheguei!'}<span>Alimentação infantil com afeto</span></span></a>{!admin&&<Navigation/>}{session?.admin&&<button className="secondary" onClick={logout}>Sair</button>}</header><main className={admin?'admin-main':'book-main'}>{error&&<p className="error" role="alert">{error}</p>}{!q||!session?<p role="status">Carregando…</p>:admin?session.admin?<Admin key={path} path={path} go={go}/>:<Login onLogin={s=>{csrf=s.csrf;setSession(s)}}/>:!q.ready?<section className="card narrow"><span className="eyebrow">EM PREPARAÇÃO</span><h1>Estamos preparando este formulário.</h1><p>O questionário ainda não está disponível. Volte em breve.</p></section>:submitted?<section className="card narrow"><span className="eyebrow">ENVIO CONCLUÍDO</span><h1>Obrigado pela participação!</h1><p>Suas respostas foram recebidas com sucesso.</p></section>:<Booklet><Questionnaire q={q} onSubmit={()=>{setSubmitted(true);window.scrollTo(0,0)}}/></Booklet>}</main><footer>Cheguei! · Alimentação infantil com afeto <span>Feito para aprender em família.</span></footer></>;
}
function Login({onLogin}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{onLogin(await api('/login',Object.fromEntries(new FormData(e.target))))}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section className="card narrow"><span className="eyebrow">ÁREA RESTRITA</span><h1>Acesso administrativo</h1><p>Entre para consultar as respostas do questionário.</p>{error&&<p className="error" role="alert">{error}</p>}<form onSubmit={submit}><label htmlFor="username">Usuário</label><input id="username" name="username" autoComplete="username" required maxLength={100}/><label htmlFor="password">Senha</label><input id="password" type="password" name="password" autoComplete="current-password" required maxLength={200}/><button disabled={busy}>{busy?'Entrando…':'Entrar'}</button></form></section>
}
function Questionnaire({q,onSubmit}){
 const [errors,setErrors]=useState({}),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e){e.preventDefault();setBusy(true);setErrors({});setError('');const form=new FormData(e.target);const answers=Object.fromEntries(q.fields.map(f=>[f.id,f.type==='checkbox'?form.getAll(f.id):form.get(f.id)||'']));try{const r=await api('/responses',{answers,website:form.get('website')});if(r.errors)setErrors(r.errors);else onSubmit()}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section className="card"><span className="eyebrow">CONTE PARA A GENTE</span><h3>Como foi a sua experiência?</h3><p className="hint">Toque em Sim ou Não para responder. Todas as perguntas são obrigatórias.</p>{error&&<p className="error" role="alert">{error}</p>}{Object.keys(errors).length>0&&<p className="error" role="alert">Revise os campos indicados.</p>}<form onSubmit={submit}><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>{q.fields.map((f,i)=><fieldset key={f.id}><legend>{i+1}. {f.label}{f.required?' *':''}</legend>{f.help&&<p className="hint">{f.help}</p>}{['radio','checkbox'].includes(f.type)?f.options.map(o=><label className="choice" key={o}><input type={f.type} name={f.id} value={o} required={f.required&&f.type==='radio'}/>{o}</label>):f.type==='select'?<select name={f.id} aria-label={f.label} required={f.required}><option value="">Selecione</option>{f.options.map(o=><option key={o}>{o}</option>)}</select>:f.type==='textarea'?<textarea name={f.id} aria-label={f.label} rows={5} maxLength={f.max_length||5000} required={f.required}/>:<input name={f.id} aria-label={f.label} type={f.type} maxLength={f.max_length||5000} required={f.required}/ >}{errors[f.id]&&<p className="error" role="alert">{errors[f.id]}</p>}</fieldset>)}<button disabled={busy}>{busy?'Enviando…':<>Enviar respostas <Icon name="send"/></>}</button></form></section>
}
function Admin({path,go}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[page,setPage]=useState(1);
 const id=path.match(/^\/admin\/respostas\/([a-f0-9]+)$/)?.[1];
 useEffect(()=>{setData(null);setError('');api(id?'/responses/'+id:'/responses?page='+page).then(setData).catch(e=>setError(e.message))},[id,page]);
 if(error)return <p className="error" role="alert">{error}</p>;
 if(!data)return <p role="status">Carregando respostas…</p>;
 if(id)return <><a href="/admin" onClick={e=>{e.preventDefault();go('/admin')}}>← Voltar às respostas</a><section className="card"><span className="eyebrow">RESPOSTA RECEBIDA</span><h1>Detalhes do envio</h1><p>{new Date(data.created_at).toLocaleString('pt-BR')} · Versão {data.version}</p><dl>{data.answers.map((a,i)=><React.Fragment key={i}><dt>{a.label}</dt><dd>{(Array.isArray(a.value)?a.value.join(', '):a.value)||'Não informado'}</dd></React.Fragment>)}</dl></section></>;
 return <><div className="heading"><div><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Respostas recebidas</h1><p>{data.total} resposta{data.total!==1?'s':''} no total</p></div><a className="button" href="/api/export.csv">Exportar CSV</a></div><section className="card">{data.rows.length?<div className="table-wrap"><table><thead><tr><th>Identificador</th><th>Recebido em</th><th>Versão</th><th></th></tr></thead><tbody>{data.rows.map(r=><tr key={r.id}><td>{r.id.slice(0,12)}</td><td>{new Date(r.created_at).toLocaleString('pt-BR')}</td><td>{r.version}</td><td><a href={'/admin/respostas/'+r.id} onClick={e=>{e.preventDefault();go('/admin/respostas/'+r.id)}}>Ver respostas →</a></td></tr>)}</tbody></table></div>:<><h2>Nenhuma resposta recebida</h2><p>Os envios aparecerão aqui assim que o questionário estiver disponível.</p></>}</section><nav className="pagination">{page>1&&<button className="secondary" onClick={()=>setPage(page-1)}>← Anterior</button>}<span>Página {page}</span>{page*25<data.total&&<button className="secondary" onClick={()=>setPage(page+1)}>Próxima →</button>}</nav></>;
}
createRoot(document.getElementById('root')).render(<App/>);
