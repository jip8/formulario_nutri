const path=require('node:path');
const projectRoot=process.env.FORMULARIO_ROOT||path.resolve(__dirname,'..');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||require.resolve('playwright',{paths:[__dirname,path.join(projectRoot,'frontend')]}));
require('node:fs').mkdirSync(path.join(projectRoot,'artifacts'),{recursive:true});
const fs=require('fs');
const assert=require('assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:18501';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('.hero h1').waitFor();await page.evaluate(()=>document.fonts.ready);
  const type=await page.evaluate(()=>({body:getComputedStyle(document.body).fontFamily,bold:getComputedStyle(document.querySelector('.case-actions strong')).fontWeight,heading:getComputedStyle(document.querySelector('.hero h1')).fontWeight,legend:getComputedStyle(document.querySelector('legend')).fontSize,transform:getComputedStyle(document.querySelector('.cover-inventory')).transform}));
  assert.match(type.body,/Nunito Sans/);assert.equal(type.bold,'800');assert.equal(type.heading,'900');assert.ok(parseFloat(type.legend)>=19);assert.equal(type.transform,'none');
  assert.equal(await page.locator('.cover-inventory svg').count()>0,true);
  assert.equal(await page.evaluate(()=>/\p{Extended_Pictographic}/u.test(document.body.innerText)),false,'No emoji characters in UI');
  await page.screenshot({path:path.join(projectRoot,'artifacts','desktop-docx.png'),fullPage:true});
  assert.equal(await page.locator('.comparison-columns article').count(),2);
  assert.equal(await page.locator('.eating-ladder li').count(),6);
  assert.equal(await page.locator('#cores .sensory-activities li').count(),3);
  await page.locator('.academic-credits').getByText('Uceff',{exact:true}).waitFor();
  await page.getByRole('tab',{name:'Cenoura'}).click();await page.getByRole('heading',{name:'Cenoura de um novo jeito'}).waitFor();
  await page.getByRole('tab',{name:'Cenoura'}).press('ArrowRight');await page.getByRole('tab',{name:'Abóbora',selected:true}).waitFor();
  assert.equal(await page.locator('.healthy-sectors path').count(),4);
  assert.equal(await page.locator('.plate-allocations>li').count(),3);
  assert.equal(await page.locator('.plate-builder').count(),0);
  await page.getByRole('heading',{name:'O prato ideal é o prato possível',exact:true}).waitFor();
  await page.locator('.healthy-plate').screenshot({path:path.join(projectRoot,'artifacts','prato-docx.png')});
  await page.locator('.swap-list summary').first().click();assert.equal(await page.getByText('Ofereça água como bebida habitual.',{exact:false}).isVisible(),true);
  await page.locator('.instagram-section').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.instagram-preview img')?.naturalWidth===288);
  assert.equal(await page.locator('.instagram-button').getAttribute('href'),'https://www.instagram.com/nutri.infantil/');
  await page.locator('.instagram-section').screenshot({path:path.join(projectRoot,'artifacts','instagram-editorial.png')});
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`No overflow at ${width}px`);
   if(width===390){await page.getByRole('button',{name:'Abrir menu',exact:true}).click();await page.locator('#main-navigation').getByRole('link',{name:'A cartilha',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Abrir menu',exact:true}).getAttribute('aria-expanded'),'false');await page.screenshot({path:path.join(projectRoot,'artifacts','mobile-docx.png'),fullPage:true});await page.locator('.healthy-plate').screenshot({path:path.join(projectRoot,'artifacts','prato-mobile-docx.png')});}
  }
  const questions=page.locator('#feedback fieldset');assert.equal(await questions.count(),4);
  for(let i=0;i<4;i++)await questions.nth(i).getByRole('radio',{name:'Sim',exact:true}).check();
  await page.getByRole('button',{name:'Enviar respostas'}).click();await page.getByRole('heading',{name:'Obrigado pela participação!'}).waitFor();
  await page.goto(base+'/admin');await page.getByLabel('Usuário',{exact:true}).fill('admin');
  const password=fs.readFileSync(path.join(projectRoot,'credentials.txt'),'utf8').split('Senha: ')[1].split('\n')[0];
  await page.getByLabel('Senha',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.getByRole('heading',{name:'Respostas recebidas'}).waitFor();await page.getByRole('link',{name:'Ver respostas'}).first().click();await page.getByRole('heading',{name:'Detalhes do envio'}).waitFor();
  assert.equal(await page.locator('dd').count(),4);
  await page.goto(base);await page.locator('#jogo .button').waitFor();
  assert.equal(await page.locator('#jogo .button').getAttribute('href'),'https://www.canva.com/design/DAHX9XQK3eA/THxikF8wYpPHDMHFikUiyQ/edit');
  assert.equal(await page.locator('#jogo .button').getAttribute('target'),'_blank');
  assert.deepEqual(errors,[]);
  console.log('OK: real fonts/weights; no rotations or emojis; icons; keyboard tabs; DOCX comparison, six SVG/CSS steps, three sensory activities, illustrated SVG plate, academic credits; original PDF Instagram print; no overflow at 320/390/768/1440; form/admin; Canva game link; no JS errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
