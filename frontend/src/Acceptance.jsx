import React from 'react';
import Icon from './Icons';
const normal=[
 'A recusa alimentar acontece de forma passageira, com períodos de melhora e piora.',
 'A criança ainda aceita alguns alimentos e mantém certa variedade.',
 'Não há prejuízos no crescimento, no peso ou na saúde.'
];
const selective=[
 'A recusa dos alimentos é frequente, intensa e persistente.',
 'A criança rejeita grupos alimentares inteiros.',
 'Apresenta desconforto intenso, medo ou aversão diante de determinados alimentos.',
 'Pode haver prejuízos no crescimento, no desenvolvimento e na saúde.'
];
export function AcceptanceComparison(){return <div className="acceptance-comparison"><div className="comparison-columns"><article><span className="eyebrow">OBSERVE A FREQUÊNCIA E A VARIEDADE</span><h3>Fase normal</h3><ul>{normal.map(t=><li key={t}>{t}</li>)}</ul></article><article><span className="eyebrow">OBSERVE A INTENSIDADE E A PERSISTÊNCIA</span><h3>Seletividade alimentar</h3><ul>{selective.map(t=><li key={t}>{t}</li>)}</ul></article></div><div className="case-actions"><h3>O que fazer em cada caso?</h3><div><p><strong>Na fase normal:</strong> ter paciência, manter uma rotina alimentar, oferecer diferentes alimentos repetidamente, sem forçar ou pressionar a criança.</p><p><strong>Na seletividade alimentar:</strong> buscar orientação de um nutricionista infantil e, quando necessário, contar com o acompanhamento de uma equipe multidisciplinar.</p></div></div></div>}
const stages=[
 ['utensils','Comer',''],
 ['taste','Provar','Nhac!'],
 ['hand','Tocar','Sentir a textura'],
 ['smell','Cheirar','Snif, snif...'],
 ['chef','Interagir','Ter proximidade com o alimento'],
 ['eye','Tolerar','Se acostumar com o alimento, mesmo que de longe']
];
export function EatingLadder(){return <figure className="eating-ladder" aria-labelledby="ladder-title"><figcaption><span className="eyebrow">UM CAMINHO DE APROXIMAÇÃO</span><h3 id="ladder-title">Escalada<br/>{' '}do comer</h3><p>Da familiaridade com o alimento à experiência de comer.</p></figcaption><ol reversed aria-label="Etapas da escalada do comer">{stages.map(([icon,title,text],i)=><li key={title} className={'ladder-step ladder-step-'+(6-i)}><svg className="ladder-step-surface" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="100"/></svg><span className="ladder-stage-icon"><Icon name={icon}/></span><div><strong>{title}</strong>{text&&<span>{text}</span>}</div></li>)}</ol></figure>}
export function SensoryActivities(){return <div className="sensory-activities"><div className="sensory-heading"><span className="eyebrow">PARA EXPERIMENTAR EM FAMÍLIA</span><h3>3 atividades sensoriais com alimentos para fazer em casa</h3></div><ol>{[
 ['palette','Pintura com alimentos','Use beterraba cozida, açafrão, espinafre ou cacau diluído em água para explorar cores e texturas com as mãos.'],
 ['hand','Balões sensoriais','Coloque arroz, feijão, lentilha ou milho dentro de balões e explore diferentes texturas por meio do toque.'],
 ['carrot','Carimbo de vegetais','Corte abobrinha, cenoura ou batata ao meio. Utilize cortadores divertidos para criar diferentes formatos e fazer carimbos naturais.']
].map(([icon,title,text],i)=><li key={title}><span className="sensory-number">0{i+1}</span><Icon name={icon}/><div><h4>{title}</h4><p>{text}</p></div></li>)}</ol><p className="sensory-care"><strong>Com um adulto por perto:</strong> o preparo, os cortes e o manuseio dos balões devem ser feitos por um adulto. Evite balões para crianças pequenas e mantenha grãos soltos e fragmentos de balão fora do alcance delas. <a href="https://www.sbp.com.br/pediatria-para-familias/seguranca-e-prevencao/seguranca-dos-brinquedos/" target="_blank" rel="noreferrer">Orientações de segurança <Icon name="external"/></a></p></div>}
