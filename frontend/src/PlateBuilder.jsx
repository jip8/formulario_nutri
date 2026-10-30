import React, {useState} from 'react';
import Icon from './Icons';
const groups=[
 {id:'vegetais',title:'Legumes e verduras',color:'green',hint:'Escolha um legume ou uma verdura para o seu prato.',foods:[['broccoli','Brócolis'],['carrot','Cenoura'],['tomato','Tomate'],['pumpkin','Abóbora']]},
 {id:'cereais',title:'Cereais e tubérculos',color:'yellow',hint:'Agora, escolha um cereal ou um tubérculo.',foods:[['rice','Arroz'],['potato','Batata'],['noodles','Macarrão'],['bread','Pão integral']]},
 {id:'leguminosas',title:'Leguminosas',color:'pink',hint:'Escolha uma leguminosa para acompanhar.',foods:[['bean','Feijão'],['bean','Lentilha'],['bean','Soja']]},
 {id:'proteinas',title:'Carnes e ovos',color:'orange',hint:'Para completar, escolha uma opção deste grupo.',foods:[['egg','Ovo'],['chicken','Frango'],['fish','Peixe'],['beef','Carne']]}
];
export default function PlateBuilder(){
 const [active,setActive]=useState(0),[selected,setSelected]=useState({}),[announcement,setAnnouncement]=useState('');
 const group=groups[active];const count=Object.keys(selected).length;const complete=count===4;
 function choose(food){setSelected(s=>({...s,[group.id]:food}));setAnnouncement(`${food[1]} adicionado ao prato. Você pode trocar a escolha ou continuar para outro grupo.`)}
 function switchGroup(index){setActive(index);setAnnouncement('')}
 function reset(){setSelected({});setActive(0);setAnnouncement('Prato limpo. Vamos montar de novo!')}
 return <div className="plate-builder"><ol className="activity-steps"><li><span>1</span> Escolha um grupo</li><li><span>2</span> Toque em um alimento</li><li><span>3</span> Veja seu prato ganhar cor</li></ol>
  <div className="plate-workspace"><div className="plate-preview" id="meu-prato"><div className="plate-preview-heading"><h3>Seu prato</h3><span className="progress-count">{count} de 4 grupos</span></div><progress className="plate-progress" value={count} max="4" aria-label="Grupos adicionados ao prato"/>
  <div className="plate-rim"><div className="dinner-plate" aria-label="Alimentos no seu prato"><svg className="plate-sectors" viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="198" fill="white"/>{['M200 200H8A192 192 0 0 1 200 8Z','M200 200V8A192 192 0 0 1 392 200Z','M200 200V392A192 192 0 0 1 8 200Z','M200 200H392A192 192 0 0 1 200 392Z'].map((d,i)=><path key={i} d={d} className={`sector ${groups[i].color} ${active===i?'active':''}`} />)}</svg>{groups.map((g,index)=>{const food=selected[g.id];return <button key={g.id} className={`plate-slot ${g.color} ${food?'has-food':''} ${active===index?'is-active':''}`} onClick={()=>switchGroup(index)} aria-label={`${g.title}: ${food?food[1]:'ainda sem alimento'}. Toque para escolher.`}><span className="plate-slot-content"><span className="slot-food"><Icon name={food?food[0]:['salad','wheat','bean','egg'][index]}/></span><strong>{food?food[1]:['Vegetais','Cereais','Feijões','Proteínas'][index]}</strong></span></button>})}</div></div><ol className="plate-key" aria-label="Grupos do prato">{groups.map((g,i)=><li key={g.id}><span>{i+1}</span>{g.title}</li>)}</ol>
  <p className="plate-preview-help"><Icon name="hand"/> Toque em uma parte do prato para mudar o alimento.</p>{complete&&<div className="plate-complete" role="status"><Icon name="success"/><div><strong>Seu prato está montado!</strong><p>Você escolheu um alimento de cada grupo. Que combinação colorida!</p></div></div>}
  <button className="text-button reset-plate" onClick={reset} disabled={!count}><Icon name="reset"/> Limpar e começar de novo</button></div>
  <div className="plate-editor"><div className="group-selector" role="group" aria-label="Escolha o grupo de alimentos">{groups.map((g,index)=><button key={g.id} className={`group-step ${active===index?'current':''} ${selected[g.id]?'done':''}`} aria-pressed={active===index} onClick={()=>switchGroup(index)}><span className="group-step-number">{selected[g.id]?<Icon name="check"/>:index+1}</span><span>{g.title}</span></button>)}</div>
  <div className="food-picker"><span className="eyebrow">GRUPO {active+1} DE 4</span><h3>{group.title}</h3><p>{group.hint} <strong>Toque em uma opção abaixo.</strong></p><div className="plate-food-options">{group.foods.map(food=>{const chosen=selected[group.id]?.[1]===food[1];return <button key={food[1]} className={'plate-food-option '+(chosen?'chosen':'')} aria-label={`Adicionar ${food[1]}`} aria-pressed={chosen} onClick={()=>choose(food)}><Icon name={food[0]} className="picker-food-icon"/><strong>{food[1]}</strong><span>{chosen?<><Icon name="check"/> No prato</>:<><Icon name="plus"/> Adicionar</>}</span></button>})}</div>
  {count>0&&<a className="button plate-view-link" href="#meu-prato"><Icon name="utensils"/> {complete?'Ver meu prato completo':'Ver meu prato'}</a>}
  <p className="selection-message" aria-live="polite">{announcement||'Sua escolha aparece na mesma hora na prévia do prato.'}</p>
  {active<3?<button className="next-group" disabled={!selected[group.id]} onClick={()=>switchGroup(active+1)}>Próximo grupo <Icon name="next"/></button>:!complete?<p className="hint">Volte aos grupos sem marca de confirmação para completar o prato.</p>:<p className="plate-finish"><Icon name="check"/> Pronto! Para experimentar outra combinação, toque em qualquer grupo.</p>}
  </div></div></div>
 </div>
}
