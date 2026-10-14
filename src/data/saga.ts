/* Dados de regras de Star Wars RPG Edição Saga (livro v1.05 PT-BR). Gerado a partir do protótipo; edite aqui. */
/* ===== Dados de regras: Star Wars RPG Edição Saga (livro v1.05 PT-BR) ===== */
export const ABILS = [
  ['vig','Vigor','VIG'],['des','Destreza','DES'],['con','Constituição','CON'],
  ['int','Inteligência','INT'],['sab','Sabedoria','SAB'],['car','Carisma','CAR']
];
export const ABIL_NAME = Object.fromEntries(ABILS.map(a=>[a[0],a[1]]));
export const ABIL_SHORT = Object.fromEntries(ABILS.map(a=>[a[0],a[2]]));

export const POINT_COST = {8:0,9:1,10:2,11:3,12:4,13:5,14:6,15:8,16:10,17:13,18:16};
export const STANDARD_ARRAY = [15,14,13,12,10,8];

/* Espécies: Tabela 2-1 e traços do Capítulo 2 */
export const SPECIES = [
 {id:'humano',name:'Humano',mods:{},speed:6,size:'Médio',world:'Vários (Coruscant, Corellia, Naboo...)',
  langs:['Básico'],extraSkill:true,bonusFeat:true,
  traits:['Perícia treinada adicional (da lista da classe)','Talento bônus no 1º nível'],
  look:{skin:'#c99a78',hair:'#3b2a20',kind:'human'}},
 {id:'bothan',name:'Bothan',mods:{des:2,con:-2},speed:6,size:'Médio',world:'Bothawui',langs:['Básico','Bothês'],
  def:{will:2},condFeat:['Reunir Informação','Foco em Perícia (Reunir Informação)'],
  traits:['Vontade de Ferro: +2 na Defesa de Vontade','Treinado em Reunir Informação ganha Foco em Perícia nela'],
  look:{skin:'#b59a73',hair:'#8a6e4b',kind:'bothan'}},
 {id:'cereano',name:'Cereano',mods:{int:2,sab:2,des:-2},speed:6,size:'Médio',world:'Cerea',langs:['Básico','Cereano'],
  reroll:['Iniciativa'],condFeat:['Iniciativa','Foco em Perícia (Iniciativa)'],
  traits:['Iniciativa Intuitiva: re-rola Iniciativa (fica com a nova)','Treinado em Iniciativa ganha Foco em Perícia nela'],
  look:{skin:'#d8b597',hair:'#e8e8e8',kind:'cerean'}},
 {id:'duros',name:'Duros',mods:{des:2,int:2,con:-2},speed:6,size:'Médio',world:'Duro',langs:['Básico','Durês'],
  reroll:['Pilotar'],traits:['Piloto Especialista: re-rola Pilotar (fica com a nova)'],
  look:{skin:'#5f8f9c',eye:'#d63a2c',kind:'duros'}},
 {id:'ewok',name:'Ewok',mods:{des:2,vig:-2},speed:4,size:'Pequeno',world:'Lua florestal de Endor',langs:['Ewokês (só falado)'],
  primitive:true,reroll:['Furtividade'],condFeat:['Sobrevivência','Foco em Perícia (Sobrevivência)'],
  traits:['Pequeno: +1 Reflexo, +5 Furtividade, carga ×¾','Primitivo: sem Proficiência inicial em pistolas, rifles ou armas pesadas','Rastro: ignora encobrimento para Percepção a até 10 quadrados','Furtivo: re-rola Furtividade','Treinado em Sobrevivência ganha Foco em Perícia nela'],
  look:{skin:'#6b4a2f',hair:'#8b6a48',kind:'ewok'}},
 {id:'gamorreano',name:'Gamorreano',mods:{vig:2,des:-2,int:-2},speed:6,size:'Médio',world:'Gamorr',langs:['Gamorreano','Básico (entende, não fala)'],
  primitive:true,def:{fort:2},bonusFeats:['Limiar de Dano Aprimorado'],
  traits:['Primitivo: sem Proficiência inicial em pistolas, rifles ou armas pesadas','Grande Fortitude: +2 na Defesa de Fortitude','Talento bônus: Limiar de Dano Aprimorado'],
  look:{skin:'#6f8a3a',kind:'gamorrean'}},
 {id:'gungan',name:'Gungan',mods:{des:2,int:-2,car:-2},speed:6,swim:4,size:'Médio',world:'Naboo',langs:['Básico','Gunganês'],
  def:{ref:2},reroll:['Nadar'],
  traits:['Nadador Especialista: re-rola Nadar, pode escolher 10','Segurar Fôlego: 25 × Con rodadas','Reflexo Relâmpago: +2 na Defesa de Reflexo','Visão na Penumbra','Familiaridade com atlatl e cesta'],
  look:{skin:'#d89a5b',kind:'gungan'}},
 {id:'ithoriano',name:'Ithoriano',mods:{sab:2,car:2,des:-2},speed:6,size:'Médio',world:'Ithor',langs:['Básico','Ithorês'],
  def:{will:2},reroll:['Sobrevivência'],condFeat:['Conhecimento (Ciências Biológicas)','Foco em Perícia (Conhecimento (Ciências Biológicas))'],
  traits:['Vontade de Ferro: +2 na Defesa de Vontade','Berro: ação padrão, 1d20 + nível contra Fortitude em cone de 6 quadrados, 3d6 sônico; -1 passo na condição por uso','Instinto de Sobrevivência: re-rola Sobrevivência'],
  look:{skin:'#8c6b4a',kind:'ithorian'}},
 {id:'keldor',name:'Kel Dor',mods:{des:2,sab:2,con:-2},speed:6,size:'Médio',world:'Dorin',langs:['Básico','Kel Dor'],
  traits:['Percepção da Força Apurada: re-rola Usar a Força para sentir a Força (fica com a melhor)','Visão na Penumbra','Precisa de óculos e máscara antioxidante fora de Dorin (começa com eles)'],
  gear:['Máscara antioxidante','Óculos protetores'],
  look:{skin:'#d9824a',kind:'keldor'}},
 {id:'moncal',name:'Mon Calamariano',mods:{int:2,sab:2,con:-2},speed:6,swim:4,size:'Médio',world:'Mon Calamari (Dac)',langs:['Básico','Mon Calamariano'],
  reroll:['Nadar'],condFeat:['Percepção','Foco em Perícia (Percepção)'],
  traits:['Respiração Subaquática','Nadador Especialista: re-rola Nadar, pode escolher 10','Visão na Penumbra','Treinado em Percepção ganha Foco em Perícia nela'],
  look:{skin:'#c8673f',kind:'moncal'}},
 {id:'quarren',name:'Quarren',mods:{con:2,sab:-2,car:-2},speed:6,swim:4,size:'Médio',world:'Mon Calamari (Dac)',langs:['Básico','Quarrenês'],
  reroll:['Nadar'],condFeat:['Persuasão','Foco em Perícia (Persuasão)'],
  traits:['Respiração Subaquática','Nadador Especialista','Visão na Penumbra','Treinado em Persuasão ganha Foco em Perícia nela'],
  look:{skin:'#9a8bb0',kind:'quarren'}},
 {id:'rodiano',name:'Rodiano',mods:{des:2,sab:-2,car:-2},speed:6,size:'Médio',world:'Rodia',langs:['Básico','Rodês'],
  reroll:['Percepção'],condFeat:['Sobrevivência','Foco em Perícia (Sobrevivência)'],
  traits:['Consciência Aumentada: re-rola Percepção','Visão na Penumbra','Treinado em Sobrevivência ganha Foco em Perícia nela'],
  look:{skin:'#4f9a5a',eye:'#1a2a40',kind:'rodian'}},
 {id:'sullustano',name:'Sullustano',mods:{des:2,con:-2},speed:6,size:'Médio',world:'Sullust',langs:['Básico','Sullustês'],
  reroll:['Percepção'],traits:['Visão no Escuro','Escalador Especialista: pode escolher 10 em Escalar','Consciência Aumentada: re-rola Percepção'],
  look:{skin:'#a7988a',kind:'sullustan'}},
 {id:'trandoshano',name:'Trandoshano',mods:{vig:2,des:-2},speed:6,size:'Médio',world:'Trandosha',langs:['Básico','Dosh'],
  natArmor:1,bonusFeats:['Vitalidade'],
  traits:['Visão no Escuro','Regeneração de Membros (1d10 dias)','Armadura Natural: +1 na Defesa de Reflexo (acumula com armadura)','Talento bônus: Vitalidade'],
  look:{skin:'#7f9a4a',kind:'trandoshan'}},
 {id:'twilek',name:"Twi'lek",mods:{car:2,sab:-2},speed:6,size:'Médio',world:'Ryloth',langs:['Básico','Ryl'],
  def:{fort:2},reroll:['Enganar'],traits:['Enganador: re-rola Enganar','Grande Fortitude: +2 na Defesa de Fortitude','Visão na Penumbra'],
  look:{skin:'#4fb3a8',kind:'twilek'}},
 {id:'wookiee',name:'Wookiee',mods:{vig:4,con:2,des:-2,sab:-2,car:-2},speed:6,size:'Médio',world:'Kashyyyk',langs:['Shyriiwook (entende Básico)'],
  traits:['Recuperação Extraordinária: cura natural em dobro','Fúria (1/dia, ação rápida): +2 em ataque e dano físicos por 5 + Con rodadas, depois -1 passo persistente','Familiaridade com a bowcaster'],
  look:{skin:'#7a5230',hair:'#8b5e34',kind:'wookiee'}},
 {id:'zabrak',name:'Zabrak',mods:{},speed:6,size:'Médio',world:'Iridônia',langs:['Básico','Zabrak'],
  def:{ref:1,fort:1,will:1},reroll:['Percepção'],traits:['Consciência Aumentada: re-rola Percepção','Defesas Superiores: +1 em todas as defesas'],
  look:{skin:'#c98d6a',kind:'zabrak'}}
];
export const SPECIES_BY = Object.fromEntries(SPECIES.map(s=>[s.id,s]));

/* Perícias: Tabela 4-2 */
export const KNOW_FIELDS = ['Burocracia','Ciências Biológicas','Ciências Exatas','Ciências Humanas','Táticas','Tecnologia','Tradições Galácticas'];
export interface Skill { n: string; a: string; arm?: boolean; trainedOnly?: boolean; force?: boolean; know?: boolean }
export const SKILLS: Skill[] = [
 {n:'Acrobacia',a:'des',arm:true},
 ...KNOW_FIELDS.map(f=>({n:`Conhecimento (${f})`,a:'int',know:true})),
 {n:'Enganar',a:'car'},{n:'Escalar',a:'vig',arm:true},{n:'Furtividade',a:'des',arm:true},
 {n:'Iniciativa',a:'des',arm:true},{n:'Mecânica',a:'int',trainedOnly:true},{n:'Montar',a:'des'},
 {n:'Nadar',a:'vig',arm:true},{n:'Percepção',a:'sab'},{n:'Persuasão',a:'car'},{n:'Pilotar',a:'des'},
 {n:'Reunir Informação',a:'car'},{n:'Saltar',a:'vig',arm:true},{n:'Sobrevivência',a:'sab'},
 {n:'Tolerância',a:'con',arm:true},{n:'Tratar Ferimento',a:'sab'},{n:'Usar a Força',a:'car',force:true},
 {n:'Usar Computador',a:'int'}
];
export const SKILL_BY = Object.fromEntries(SKILLS.map(s=>[s.n,s]));
export const ALL_KNOW = KNOW_FIELDS.map(f=>`Conhecimento (${f})`);

export const DC_TABLE = [
 ['Muito fácil',5,'Notar algo óbvio, escalar uma corda com nós'],
 ['Fácil',10,'Conhecimento comum, nadar em água calma'],
 ['Média',15,'Abrir uma tranca simples, escalar um muro de depósito'],
 ['Difícil',20,'Contorcer-se por um espaço apertado, construir um sabre de luz'],
 ['Muito difícil',25,'Escapar de algemas, consertar um hiperpropulsor sob fogo'],
 ['Heroica',30,'Feitos que entram para as lendas'],
 ['Quase impossível',40,'Interferir no sinal de controle dos dróides de batalha']
];

/* Classes heróicas: Capítulo 3 */
export const FORCE_TREES = ['Alteração','Controle','Lado Sombrio','Sentidos'];
export const CLASSES = {
 jedi:{name:'Jedi',hp0:30,die:10,bab:'full',def:{ref:1,fort:1,will:1},skillsN:2,credits:[3,4,100],
  key:'Sabedoria e Carisma',examples:'Obi-Wan Kenobi, Mace Windu, Luke Skywalker',
  skills:['Acrobacia',...ALL_KNOW,'Iniciativa','Tolerância','Mecânica','Percepção','Pilotar','Saltar','Usar a Força'],
  start:['Sensitividade da Força','Proficiência em Arma (sabres de luz)','Proficiência em Arma (armas simples)'],
  trees:['Cônsul Jedi','Guardião Jedi','Sentinela Jedi','Combate com Sabre de Luz'],
  bonus:['Ataque Acrobático','Trespassar','Reflexos de Combate','Esquiva','Ataque Duplo','Domínio de Armas Duplas I','Domínio de Armas Duplas II','Domínio de Armas Duplas III','Trespassar Maior','Investida Aprimorada','Desarme Aprimorado','Artes Marciais I','Artes Marciais II','Artes Marciais III','Defesa de Ataque Físico','Mobilidade','Saque Rápido','Ataque Poderoso','Investida Poderosa','Ataque Rápido','Ataque em Corrida','Foco em Perícia','Treinamento em Perícia','Forte na Força','Ataque Triplo','Triplo Crítico','Acuidade com Arma','Foco em Arma'],
  blurb:'Guardiões da paz que dominam o sabre de luz e a Força.'},
 nobre:{name:'Nobre',hp0:18,die:6,bab:'3/4',def:{ref:1,will:2},skillsN:6,credits:[3,4,400],
  key:'Carisma, depois Sabedoria e Inteligência',examples:'Leia Organa, Padmé Amidala, Bail Organa',
  skills:[...ALL_KNOW,'Enganar','Iniciativa','Montar','Percepção','Persuasão','Pilotar','Reunir Informação','Tratar Ferimento','Usar Computador'],
  start:['Lingüística','Proficiência em Arma (pistolas)','Proficiência em Arma (armas simples)'],
  trees:['Influência','Inspiração','Liderança','Linhagem'],
  bonus:['Proficiência em Armadura (leve)','Cirurgia Cibernética','Proficiência em Arma Exótica','Lingüística','Defesa de Ataque Físico','Foco em Perícia','Treinamento em Perícia','Especialização Cirúrgica','Acuidade com Arma','Proficiência em Arma (armas de ataque físico avançadas)','Proficiência em Arma (rifles)'],
  blurb:'Diplomatas, senadores e líderes que vencem com palavras.'},
 vigarista:{name:'Vigarista',hp0:18,die:6,bab:'3/4',def:{ref:2,will:1},skillsN:4,credits:[3,4,250],
  key:'Destreza e Inteligência',examples:'Han Solo, Lando Calrissian',
  skills:['Acrobacia',...ALL_KNOW,'Enganar','Furtividade','Iniciativa','Mecânica','Percepção','Persuasão','Pilotar','Reunir Informação','Usar Computador'],
  start:['Tiro à Queima Roupa','Proficiência em Arma (pistolas)','Proficiência em Arma (armas simples)'],
  trees:['Fortuna','Azar','Invasor de Sistemas','Viajante Espacial'],
  bonus:['Mira Fatal','Esquiva','Defesa de Ataque Físico','Mobilidade','Tiro Preciso','Saque Rápido','Tiro Rápido','Ataque em Corrida','Foco em Perícia','Treinamento em Perícia','Combate Veicular','Proficiência em Arma (armas de ataque físico avançadas)'],
  blurb:'Contrabandistas e trapaceiros que confiam na sorte e no gatilho.'},
 batedor:{name:'Batedor',hp0:24,die:8,bab:'3/4',def:{ref:2,fort:1},skillsN:5,credits:[3,4,250],
  key:'Destreza, Inteligência e Sabedoria',examples:'Chewbacca, Wicket, Capitão Tarpals',
  skills:[...ALL_KNOW,'Escalar','Furtividade','Iniciativa','Mecânica','Montar','Nadar','Percepção','Pilotar','Saltar','Sobrevivência','Tolerância'],
  start:['Se Livrar','Proficiência em Arma (pistolas)','Proficiência em Arma (rifles)','Proficiência em Arma (armas simples)'],
  trees:['Consciência','Camuflagem','Marginal','Sobrevivente'],
  bonus:['Proficiência em Armadura (leve)','Proficiência em Armadura (média)','Proficiência em Armadura (pesada)','Tiro Cuidadoso','Mira Fatal','Esquiva','Tiro Longo','Lingüística','Mobilidade','Tiro à Queima Roupa','Tiro Preciso','Tiro Rápido','Ataque em Corrida','Foco em Perícia','Treinamento em Perícia','Atirador de Elite','Combate Veicular','Proficiência em Arma (armas de ataque físico avançadas)'],
  blurb:'Exploradores e sobreviventes das fronteiras da galáxia.'},
 soldado:{name:'Soldado',hp0:30,die:10,bab:'full',def:{ref:1,fort:2},skillsN:3,credits:[3,4,250],
  key:'Destreza, Constituição e Vigor',examples:'Wedge Antilles, Capitão Panaka, Kyle Katarn',
  skills:['Conhecimento (Táticas)','Escalar','Iniciativa','Mecânica','Nadar','Percepção','Pilotar','Saltar','Tolerância','Tratar Ferimento','Usar Computador'],
  start:['Proficiência em Armadura (leve)','Proficiência em Armadura (média)','Proficiência em Arma (pistolas)','Proficiência em Arma (rifles)','Proficiência em Arma (armas simples)'],
  trees:['Especialista em Armadura','Brigão','Comando','Especialista em Arma'],
  bonus:['Proficiência em Armadura (pesada)','Encontrão do Bantha','Tiro Cuidadoso','Tiro em Investida','Trespassar','Reflexos de Combate','Ataque Coordenado','Esmagar','Mira Fatal','Ataque Duplo','Domínio de Armas Duplas I','Domínio de Armas Duplas II','Domínio de Armas Duplas III','Proficiência em Arma Exótica','Tiro Longo','Trespassar Maior','Investida Aprimorada','Desarme Aprimorado','Artes Marciais I','Artes Marciais II','Artes Marciais III','Defesa de Ataque Físico','Golpe Impetuoso','Imobilizar','Tiro à Queima Roupa','Ataque Poderoso','Tiro Preciso','Saque Rápido','Tiro Rápido','Ataque Rápido','Ataque em Corrida','Se Livrar','Foco em Perícia','Treinamento em Perícia','Atirador de Elite','Lançar','Vitalidade','Banda','Ataque Triplo','Triplo Crítico','Combate Veicular','Proficiência em Arma (armas de ataque físico avançadas)','Proficiência em Arma (armas pesadas)'],
  blurb:'Os guerreiros mais puros da galáxia, mestres de armas e armaduras.'}
};

export const XP_TABLE = [0,0,1000,3000,6000,10000,15000,21000,28000,36000,45000,55000,66000,78000,91000,105000,120000,136000,153000,171000,190000];

/* Aptidões (talentos de classe). p = pré-requisitos (nomes de aptidões); multi = pode repetir */
export const TREES = {
 'Cônsul Jedi':[
  {n:'Negociador Adepto',d:'Ação padrão: Persuasão contra Vontade do alvo; sucesso move-o -1 passo na condição (não cai inconsciente; deixa de atacar você).'},
  {n:'Persuasão da Força',p:['Negociador Adepto'],d:'Usa o modificador de Usar a Força no lugar de Persuasão.'},
  {n:'Negociador Mestre',p:['Negociador Adepto'],d:'Negociador Adepto move o alvo -2 passos.'},
  {n:'Conselheiro Habilidoso',d:'Rodada completa: aliado ganha +5 no próximo teste de perícia (+10 gastando 1 PF).'}],
 'Guardião Jedi':[
  {n:'Recuperação Acrobática',d:'Ao cair deitado, Acrobacia CD 20 para ficar de pé.'},
  {n:'Meditação de Batalha',d:'Rodada completa + 1 PF: você e aliados a até 6 quadrados ganham +1 de intuição nos ataques até o fim do encontro.'},
  {n:'Alvo Elusivo',d:'Em combate físico, ataques à distância contra você sofrem -5 extra (-10 total).'},
  {n:'Intuição da Força',d:'Usa Usar a Força no lugar de Iniciativa.'},
  {n:'Resistência',d:'Rodada completa: +2 passos na condição.'}],
 'Sentinela Jedi':[
  {n:'Clarear a Mente',d:'Re-rola Usar a Força resistido para não ser detectado.'},
  {n:'Sentir o Lado Sombrio',d:'Re-rola Usar a Força para sentir quem tem Pontuação do Lado Sombrio 1+.'},
  {n:'Flagelo do Lado Sombrio',p:['Sentir o Lado Sombrio'],d:'Dano físico extra igual ao bônus de Carisma (mín. +1) contra seguidores do lado sombrio.'},
  {n:'Névoa da Força',p:['Clarear a Mente'],d:'Ação padrão + 1 PF: esconde aliados (encobrimento total) de quem tiver Vontade menor que seu teste. 1 minuto.'},
  {n:'Resistir ao Lado Sombrio',p:['Sentir o Lado Sombrio'],d:'+5 de Força nas defesas contra poderes [lado sombrio] e usuários sombrios.'}],
 'Combate com Sabre de Luz':[
  {n:'Bloquear',d:'Reação: Usar a Força contra o resultado do ataque físico para negá-lo (-5 cumulativo por uso na rodada).'},
  {n:'Defletir',d:'Reação: Usar a Força contra o resultado do ataque à distância para negá-lo (-5 cumulativo).'},
  {n:'Defesa com Sabre de Luz',multi:3,d:'Ação rápida: +1 de deflexão no Reflexo até seu próximo turno (máx. +3).'},
  {n:'Especialização em Arma (sabres de luz)',pf:['Foco em Arma (sabres de luz)'],d:'+2 no dano físico com sabres de luz.'},
  {n:'Arremessar Sabre de Luz',d:'Arremessa o sabre como ação padrão; puxa de volta com Usar a Força CD 20.'},
  {n:'Redirecionar Disparo',p:['Defletir'],bab:5,d:'Após defletir um disparo, faz um ataque à distância com ele contra outro alvo.'}],
 'Influência':[
  {n:'Presença',d:'Intimida com Persuasão como ação padrão.'},
  {n:'Exigir Rendição',p:['Presença'],d:'1/encontro: Persuasão contra Vontade de alvo com metade dos PV ou menos; ele se rende.'},
  {n:'Enfraquecer Decisão',p:['Presença'],d:'Ao causar dano ≥ limiar, Persuasão contra Vontade faz o alvo fugir por 1 minuto.'},
  {n:'Enfraquecer Decisão Aprimorada',p:['Presença'],d:'O alvo não para de fugir ao ser ferido.'}],
 'Inspiração':[
  {n:'Animar Aliado',d:'Ação padrão: aliado +1 passo e PV temporários iguais ao nível dele (se estiver com metade ou menos).'},
  {n:'Inflamar Fervor',p:['Animar Aliado','Inspirar Confiança'],d:'Ao acertar, aliado ganha bônus de dano igual ao nível dele no próximo ataque.'},
  {n:'Inspirar Confiança',d:'Ação padrão: aliados à vista +1 em ataques e perícias até o fim do encontro.'},
  {n:'Inspirar Agilidade',d:'Ação rápida: aliado faz um teste de perícia de ação padrão como ação de movimento.'},
  {n:'Inspirar Zelo',p:['Animar Aliado','Inspirar Confiança','Inflamar Fervor'],d:'Aliado que derruba alguém na condição o move -1 passo extra.'}],
 'Liderança':[
  {n:'Líder Nato',d:'1/encontro, ação rápida: aliados à vista +1 de intuição nos ataques.'},
  {n:'Coordenar',multi:5,d:'Ação padrão: aliados ganham +1 extra ao prestar auxílio (máx. +5).'},
  {n:'Comando à Distância',p:['Líder Nato'],d:'Líder Nato continua mesmo sem linha de visão.'},
  {n:'Líder Destemido',p:['Líder Nato'],d:'Ação rápida: aliados +5 de moral na Vontade contra medo.'},
  {n:'Reagrupar',p:['Líder Nato','Comando à Distância'],d:'1/encontro: aliados abaixo da metade dos PV ganham +2 em Ref, Von e dano.'},
  {n:'Confiança',p:['Líder Nato','Coordenar'],d:'Abre mão da ação padrão para dar uma ação padrão ou de movimento a um aliado.'}],
 'Linhagem':[
  {n:'Conexões',d:'Obtém equipamento restrito sem taxa até nível × 1.000 créditos.'},
  {n:'Educado',d:'Faz qualquer teste de Conhecimento sem treinamento.'},
  {n:'Perícia Espontânea',p:['Educado'],multi:9,d:'1/dia: um teste sem treinamento como se fosse treinado.'},
  {n:'Riqueza',d:'A cada nível recebe 5.000 × nível de nobre em créditos.'}],
 'Fortuna':[
  {n:'Sorte do Tolo',d:'Ação padrão + 1 PF: +1 de sorte em todas as defesas até o fim do encontro.'},
  {n:'Favorecimento da Fortuna',d:'Acerto crítico concede uma ação padrão extra.'},
  {n:'Jogador',multi:9,d:'+2 em testes de Sabedoria em jogos de azar.'},
  {n:'Jeito',multi:9,d:'1/dia: re-rola um teste de perícia e fica com o melhor.'},
  {n:'Jogada de Sorte',p:['Jeito'],multi:9,d:'1/dia: re-rola um ataque e fica com o melhor.'}],
 'Azar':[
  {n:'Ataque Traiçoeiro',d:'Acertar alvo sem Des no Reflexo move-o -1 passo.'},
  {n:'Perturbador',d:'Duas ações rápidas: cancela bônus de moral e intuição dos inimigos à vista.'},
  {n:'Escaramuçador',d:'Mover 2+ quadrados antes de atacar: +1 no ataque.'},
  {n:'Ataque Furtivo',multi:10,d:'+1d6 de dano contra alvo desprevenido (a até 6 quadrados à distância).'},
  {n:'Andar na Linha',p:['Perturbador'],d:'Ação padrão: inimigos a até 6 quadrados -2 nas defesas.'}],
 'Invasor de Sistemas':[
  {n:'Artifício Rápido',d:'Dá comando de rotina a um computador como ação rápida.'},
  {n:'Mestre em Invasões',p:['Artifício Rápido'],d:'Re-rola Usar Computador para melhorar acesso (fica com o melhor).'},
  {n:'Sondar',d:'Usa Usar Computador no lugar de Reunir Informação em uma rede.'}],
 'Viajante Espacial':[
  {n:'Hiperdrive',d:'1/dia a bordo de nave: soma o nível de vigarista a um ataque ou teste.'},
  {n:'Lobo do Espaço',d:'Sem penalidades em gravidade zero; proficiente em armas de nave.'},
  {n:'Assaltante de Naves',p:['Lobo do Espaço'],d:'+1 no ataque a bordo de naves.'},
  {n:'Guerreiro Estelar',p:['Lobo do Espaço'],d:'20 natural a bordo de nave dá 1 PF temporário.'}],
 'Consciência':[
  {n:'Sentidos Aguçados',d:'Re-rola Percepção.'},
  {n:'Rastreador Especialista',p:['Sentidos Aguçados'],d:'Rastreia em velocidade normal sem penalidade.'},
  {n:'Iniciativa Aprimorada',p:['Sentidos Aguçados'],d:'Re-rola Iniciativa.'},
  {n:'Tiro Certo',p:['Sentidos Aguçados'],d:'Ignora penalidade de encobrimento (não total).'},
  {n:'Esquiva Sobrenatural I',p:['Sentidos Aguçados','Iniciativa Aprimorada'],d:'Mantém Des no Reflexo mesmo desprevenido.'},
  {n:'Esquiva Sobrenatural II',p:['Sentidos Aguçados','Iniciativa Aprimorada','Esquiva Sobrenatural I'],d:'Não pode ser flanqueado.'}],
 'Camuflagem':[
  {n:'Furtividade Aprimorada',d:'Re-rola Furtividade.'},
  {n:'Movimento Oculto',p:['Furtividade Aprimorada'],d:'Sem penalidade de Furtividade ao mover em velocidade normal.'},
  {n:'Encobrimento Total',p:['Movimento Oculto','Furtividade Aprimorada'],d:'Encobrimento vira encobrimento total.'}],
 'Marginal':[
  {n:'Permutador',d:'Re-rola Persuasão para pechinchar.'},
  {n:'Recuperação Marginal',d:'20 natural em perícia durante encontro dá 1 PF temporário.'},
  {n:'Passo Largo',d:'+2 quadrados de velocidade sem armadura ou com armadura leve.'},
  {n:'Conserto Improvisado',d:'Re-rola Mecânica para reparos improvisados.'}],
 'Sobrevivente':[
  {n:'Evasão',d:'Ataques de área: metade do dano se acertar, nenhum se errar.'},
  {n:'Esforço Extremo',d:'Duas ações rápidas: +5 em um teste de Vigor ou perícia de Vigor.'},
  {n:'Corrida de Fundo',d:'Corre até 5× a velocidade.'},
  {n:'Pé Certo',d:'Terreno difícil não reduz sua velocidade.'}],
 'Especialista em Armadura':[
  {n:'Defesa Blindada',d:'No Reflexo, usa o maior entre nível heróico e bônus de armadura.'},
  {n:'Defesa Blindada Aprimorada',p:['Defesa Blindada'],d:'No Reflexo, usa nível + metade da armadura ou a armadura, o maior.'},
  {n:'Juggernauta',p:['Defesa Blindada'],d:'Armadura não reduz sua velocidade.'},
  {n:'Segunda Pele',p:['Defesa Blindada'],d:'+1 no bônus de armadura e de equipamento da armadura.'},
  {n:'Domínio de Armadura',p:['Defesa Blindada'],d:'+1 no bônus máximo de Destreza da armadura.'}],
 'Brigão':[
  {n:'Especialista em Agarrar',d:'+2 em ataques de agarrar.'},
  {n:'Clube do Tiro',d:'Usa arma à distância como clava sem penalidade.'},
  {n:'Colisão Física',d:'+1 de dano em ataques físicos.'},
  {n:'Ataque Atordoante',p:['Colisão Física'],d:'Ataque físico que iguala o limiar move o alvo -1 passo extra.'},
  {n:'Desequilibrar Oponente',p:['Especialista em Agarrar'],d:'Oponente escolhido não soma Vigor nos ataques contra você.'}],
 'Comando':[
  {n:'Análise da Batalha',d:'Ação rápida, Conhecimento (Táticas) CD 15: sabe quem está com metade dos PV.'},
  {n:'Cobrir Fogo',p:['Análise da Batalha'],d:'Ao atirar com pistola ou rifle, aliados a 6 quadrados +1 no Reflexo.'},
  {n:'Demolidor',multi:9,d:'Explosivos plantados causam +2 dados de dano.'},
  {n:'Atrair Fogo',d:'Ação rápida, Persuasão contra Vontade: inimigos não atacam quem está perto de você.'},
  {n:'Caminho da Dor',d:'1/dia: recebe os ataques no lugar de um aliado adjacente.'},
  {n:'Indomável',multi:9,d:'1/dia, ação rápida: +5 passos na condição.'},
  {n:'Duro Feito Pedra',d:'Uma Segunda Chance extra por dia.'}],
 'Especialista em Arma':[
  {n:'Ataque Devastador',multi:9,d:'Com o grupo de armas escolhido, o limiar do alvo conta 5 menor.'},
  {n:'Ataque Penetrante',multi:9,d:'Com o grupo escolhido, a redução de dano do alvo conta 5 menor.'},
  {n:'Especialização em Arma',multi:9,d:'+2 no dano com o grupo de armas escolhido (requer Foco em Arma).'}],
 'Alteração':[
  {n:'Ataque Disciplinado',d:'Exclui alvos (mod. Sab, mín. 1) de poderes em cone.'},
  {n:'Poder Telecinético',d:'20 natural em poderes telecinéticos permite usar de novo como ação livre.'},
  {n:'Recuperação Telecinética',multi:9,d:'1/encontro: recupera um poder telecinético sem gastar PF.'}],
 'Controle':[
  {n:'Redução de Dano 10',d:'Ação padrão + 1 PF: RD 10 por 1 minuto.'},
  {n:'Equilíbrio',d:'Ação rápida + 1 PF: remove todas as condições e volta ao normal.'},
  {n:'Foco na Força',d:'Rodada completa, Usar a Força CD 15: recupera um poder gasto.'},
  {n:'Recuperação da Força',p:['Equilíbrio'],d:'Segunda Chance cura +1d6 por PF que você tiver (máx. 10d6).'}],
 'Lado Sombrio':[
  {n:'Poder do Lado Sombrio',dark:true,d:'Ao gastar PF num ataque, rola um dado extra (+1 Lado Sombrio).'},
  {n:'Presença Sombria',dark:true,p:['Poder do Lado Sombrio'],abil:{car:13},d:'Ação padrão: você e aliados a 6 quadrados +1 de Força nas defesas.'},
  {n:'Vingança',dark:true,p:['Presença Sombria','Poder do Lado Sombrio'],d:'Quando um aliado cai à vista, +2 em ataque e dano até o fim do encontro.'},
  {n:'Poder Rápido',dark:true,p:['Poder do Lado Sombrio'],d:'1/dia: usa um poder de ação padrão como ação rápida.'}],
 'Sentidos':[
  {n:'Percepção da Força',d:'Usa Usar a Força no lugar de Percepção.'},
  {n:'Piloto da Força',d:'Usa Usar a Força no lugar de Pilotar.'},
  {n:'Previsão',p:['Percepção da Força'],d:'1 PF: re-rola Iniciativa e fica com a melhor.'},
  {n:'Avaliar Potencial da Força',p:['Percepção da Força'],d:'Sabe se o alvo é sensitivo, quantos poderes e PF tem.'},
  {n:'Visões',p:['Percepção da Força'],d:'Ver à Distância pode olhar passado ou futuro.'}]
};
export const TREE_OF: Record<string,string> = {}; Object.entries(TREES).forEach(([t,arr])=>arr.forEach(x=>TREE_OF[x.n]=t));

/* Talentos (feats): Tabela 5-1. req: {abil, bab, feats, trained, force} */
export const FEATS = [
 {n:'Acuidade com Arma',req:{bab:1},d:'Usa Des no lugar de Vig no ataque com armas físicas leves e sabres de luz.'},
 {n:'Artes Marciais I',d:'Dano desarmado sobe um dado; +1 de esquiva no Reflexo.'},
 {n:'Artes Marciais II',req:{feats:['Artes Marciais I'],bab:3},d:'Dano desarmado sobe mais um dado; +1 de esquiva.'},
 {n:'Artes Marciais III',req:{feats:['Artes Marciais I','Artes Marciais II'],bab:6},d:'Dano desarmado sobe mais um dado; +1 de esquiva.'},
 {n:'Ataque Acrobático',req:{trained:'Acrobacia'},d:'+5 no próximo ataque contra quem você passou dando cambalhotas.'},
 {n:'Ataque Coordenado',req:{bab:2},d:'Sucesso automático ao prestar auxílio à queima-roupa.'},
 {n:'Ataque Duplo',req:{bab:6},multi:true,d:'Ataque extra no ataque total, -5 em todos os ataques.'},
 {n:'Ataque em Corrida',req:{abil:{des:13}},d:'Move-se antes e depois de atacar.'},
 {n:'Ataque Poderoso',req:{abil:{vig:13}},d:'Troca bônus de ataque por dano em ataques físicos.'},
 {n:'Ataque Rápido',req:{abil:{des:13},bab:1},d:'-2 no ataque físico para +1 dado de dano.'},
 {n:'Ataque Triplo',req:{bab:9,feats:['Ataque Duplo']},multi:true,d:'Segundo ataque extra no ataque total, -5 adicional.'},
 {n:'Ataque Turbilhão',req:{abil:{des:13,int:13},bab:4,feats:['Defesa de Ataque Físico']},d:'Ataque físico contra cada oponente ao alcance.'},
 {n:'Atirador de Elite',req:{feats:['Tiro à Queima Roupa','Tiro Preciso'],bab:4},d:'Ignora cobertura móvel em ataques à distância.'},
 {n:'Banda',req:{bab:1},d:'Derruba um oponente agarrado.'},
 {n:'Benção da Força',req:{feats:['Sensitividade da Força']},d:'+3 Pontos de Força a cada nível.'},
 {n:'Cirurgia Cibernética',req:{trained:'Tratar Ferimento'},d:'Instala próteses cibernéticas.'},
 {n:'Combate Veicular',req:{trained:'Pilotar'},d:'Nega um ataque por rodada contra o veículo que pilota.'},
 {n:'Defesa de Ataque Físico',req:{abil:{int:13}},d:'Troca bônus de ataque físico por esquiva no Reflexo.'},
 {n:'Defesas Aprimoradas',d:'+1 em todas as defesas.'},
 {n:'Desarme Aprimorado',req:{abil:{int:13},feats:['Defesa de Ataque Físico']},d:'+5 em ataques físicos para desarmar.'},
 {n:'Domínio de Armas Duplas I',req:{abil:{des:13},bab:1},d:'Penalidade com duas armas cai para -5.'},
 {n:'Domínio de Armas Duplas II',req:{abil:{des:15},bab:6,feats:['Domínio de Armas Duplas I']},d:'Penalidade com duas armas cai para -2.'},
 {n:'Domínio de Armas Duplas III',req:{abil:{des:17},bab:11,feats:['Domínio de Armas Duplas I','Domínio de Armas Duplas II']},d:'Sem penalidade com duas armas.'},
 {n:'Encontrão do Bantha',req:{abil:{vig:13},bab:1},d:'Empurra o oponente 1 quadrado após ataque físico.'},
 {n:'Esmagar',req:{feats:['Imobilizar'],bab:1},d:'Dano desarmado em oponente imobilizado.'},
 {n:'Especialização Cirúrgica',req:{trained:'Tratar Ferimento'},d:'Cirurgia em 10 minutos.'},
 {n:'Esquiva',req:{abil:{des:13}},d:'+1 de esquiva no Reflexo contra um alvo escolhido.'},
 {n:'Foco em Arma',multi:true,choice:'group',d:'+1 nos ataques com o grupo de armas escolhido.'},
 {n:'Foco em Perícia',multi:true,choice:'trained',d:'+5 em uma perícia treinada.'},
 {n:'Forte na Força',d:'Rola d8 no lugar de d6 ao gastar Pontos de Força.'},
 {n:'Fúria Extra',req:{species:'wookiee'},d:'Fúria uma vez adicional por dia.'},
 {n:'Fúria Terrível',req:{species:'wookiee',bab:1},d:'Bônus de fúria sobe para +4.'},
 {n:'Golpe Impetuoso',req:{abil:{vig:13}},d:'Duas ações rápidas para dano extra em ataque físico.'},
 {n:'Imobilizar',req:{bab:1},d:'Oponente agarrado fica imobilizado por 1 rodada.'},
 {n:'Investida Aprimorada',req:{abil:{des:13},feats:['Esquiva','Mobilidade']},d:'Investe sem precisar de linha reta.'},
 {n:'Investida Poderosa',req:{bab:1},d:'+2 no ataque de investida e dano extra.'},
 {n:'Lançar',req:{feats:['Banda'],bab:1},d:'Arremessa oponente agarrado causando dano.'},
 {n:'Limiar de Dano Aprimorado',multi:true,d:'Limiar de dano +5.'},
 {n:'Lingüística',req:{abil:{int:13}},multi:true,d:'Idiomas extras iguais a 1 + mod. Int.'},
 {n:'Mira Fatal',req:{feats:['Tiro à Queima Roupa','Tiro Preciso'],bab:4},d:'Mirar causa dano extra.'},
 {n:'Mobilidade',req:{abil:{des:13},feats:['Esquiva']},d:'+5 de esquiva no Reflexo contra ataques de oportunidade.'},
 {n:'Proficiência em Arma',multi:true,choice:'prof',d:'Remove a penalidade de -5 com um grupo de armas.'},
 {n:'Proficiência em Arma Exótica',req:{bab:1},multi:true,d:'Usa uma arma exótica sem penalidade.'},
 {n:'Proficiência em Armadura (leve)',d:'Sem penalidades com armadura leve.'},
 {n:'Proficiência em Armadura (média)',req:{feats:['Proficiência em Armadura (leve)']},d:'Sem penalidades com armadura média.'},
 {n:'Proficiência em Armadura (pesada)',req:{feats:['Proficiência em Armadura (leve)','Proficiência em Armadura (média)']},d:'Sem penalidades com armadura pesada.'},
 {n:'Rajada de Tiros',req:{abil:{vig:13},feats:['Proficiência em Arma (armas pesadas)']},d:'-5 em ataque automático para +2 dados de dano.'},
 {n:'Reflexos de Combate',d:'Ataques de oportunidade adicionais.'},
 {n:'Saque Rápido',req:{bab:1},d:'Saca arma como ação rápida.'},
 {n:'Segunda Chance Extra',req:{trained:'Tolerância'},d:'Uma Segunda Chance adicional por dia.'},
 {n:'Se Livrar',req:{abil:{con:13},trained:'Tolerância'},d:'Duas ações rápidas: +1 passo na condição.'},
 {n:'Sensitividade da Força',req:{notDroid:true},d:'Permite Usar a Força e aptidões da Força.'},
 {n:'Tiro à Queima Roupa',d:'+1 em ataque e dano à distância à queima-roupa.'},
 {n:'Tiro Cuidadoso',req:{feats:['Tiro à Queima Roupa'],bab:2},d:'Ao mirar, +1 no ataque.'},
 {n:'Tiro em Investida',req:{bab:4},d:'Ataque à distância ao fim de uma investida, -2.'},
 {n:'Tiro Longo',req:{feats:['Tiro à Queima Roupa']},d:'Reduz as penalidades de distância.'},
 {n:'Tiro Preciso',req:{feats:['Tiro à Queima Roupa']},d:'Sem -5 por atirar em combate físico.'},
 {n:'Tiro Rápido',req:{abil:{vig:13},bab:1},d:'-2 no ataque à distância para +1 dado de dano.'},
 {n:'Treinamento da Força',req:{feats:['Sensitividade da Força']},multi:true,d:'Aprende 1 + mod. Sab poderes da Força (mín. 1).'},
 {n:'Treinamento em Perícia',multi:true,choice:'untrained',d:'Torna-se treinado em uma perícia de classe.'},
 {n:'Trespassar',req:{abil:{vig:13},feats:['Ataque Poderoso']},d:'Ataque físico extra ao derrubar um alvo.'},
 {n:'Trespassar Maior',req:{abil:{vig:13},feats:['Ataque Poderoso','Trespassar'],bab:4},d:'Trespassar sem limite por rodada.'},
 {n:'Triplo Crítico',req:{bab:8},multi:true,d:'Dano triplo em acerto crítico.'},
 {n:'Vitalidade',d:'+1 PV por nível de personagem.'}
];
export const FEAT_BY = Object.fromEntries(FEATS.map(f=>[f.n,f]));
export const WEAPON_GROUPS = ['armas simples','pistolas','rifles','armas pesadas','sabres de luz','armas de ataque físico avançadas'];

/* Poderes da Força: Capítulo 6 */
export const POWERS = [
 {n:'Aperto da Força',t:'Ação padrão',a:'1 alvo a até 6 quadrados',tiers:[[15,'2d6'],[20,'4d6'],[25,'6d6']],vs:'limiar',d:'Se o teste iguala o limiar do alvo, ele sofre o dano; se iguala a Fortitude, só faz uma ação rápida no próximo turno. Senão, metade do dano. Mantém como ação padrão. +1 PF: +2d6.'},
 {n:'Arremeter',t:'Ação livre',a:'Você',tiers:[[10,'+10 Saltar, +2 quadrados'],[15,'+20 Saltar, +4 quadrados'],[20,'+30 Saltar, +6 quadrados']],d:'Salta e corre com a Força até o fim do seu próximo turno. +1 PF: +10 Saltar e +2 quadrados.'},
 {n:'Ataque de Batalha',t:'Ação rápida',a:'Você',tiers:[[15,'+1 no ataque, +1d6 dano'],[20,'+1 no ataque, +2d6 dano'],[25,'+1 no ataque, +3d6 dano']],d:'Afeta seu próximo ataque. +1 PF: +2d6 de dano.'},
 {n:'Atordoamento da Força',t:'Ação padrão',a:'1 criatura a até 6 quadrados',vs:'limiar',d:'Se iguala o limiar, alvo -1 passo na condição, e -1 extra a cada 5 pontos acima. +1 PF: -1 passo extra.'},
 {n:'Desarme da Força',t:'Ação padrão',a:'1 criatura a até 6 quadrados',d:'O teste substitui o ataque de desarme; a arma cai ou vem para sua mão. +1 PF: a arma sofre dano igual ao teste.'},
 {n:'Empurrão da Força',t:'Ação padrão',a:'1 alvo a até 6 quadrados',vs:'Vontade',d:'Empurra o alvo para longe (resiste com Vigor). +1 PF: -5 na resistência e +2d6 se bater em algo maior.'},
 {n:'Fúria Sombria',desc:'lado sombrio',t:'Ação rápida',a:'Você',tiers:[[15,'+2 ataque e dano físicos'],[20,'+4 ataque e dano físicos'],[25,'+6 ataque e dano físicos']],d:'Até o fim do turno; sem perícias de concentração. +1 PF: dura o encontro.'},
 {n:'Mover Objeto',t:'Ação padrão',a:'1 alvo a até 6 quadrados',tiers:[[15,'Médio, 2d6'],[20,'Grande, 4d6'],[25,'Enorme, 6d6'],[30,'Imenso, 8d6'],[35,'Colossal, 10d6']],vs:'Vontade',d:'Move até 6 quadrados; arremessa em outro alvo se superar o Reflexo dele. +1 PF: uma categoria e +2d6.'},
 {n:'Negar Energia',t:'Reação',a:'Ataque de energia contra você',d:'Se o teste iguala o dano do ataque, ele é negado. +1 PF: cura o dano negado.'},
 {n:'Pancada da Força',t:'Ação padrão',a:'Cone de 6 quadrados',vs:'limiar',dmg:'4d6',d:'Contra o limiar de cada alvo: 4d6 e derrubado; senão metade. +1 PF: +2d6.'},
 {n:'Relâmpago da Força',desc:'lado sombrio',t:'Ação padrão',a:'1 alvo a até 6 quadrados',vs:'Reflexo',dmg:'8d6',d:'Acerto: 8d6 e -1 passo na condição; erro: metade. +1 PF: -1 passo extra.'},
 {n:'Repreender',t:'Reação',a:'Poder da Força contra você',d:'Iguala o teste do poder: anula. Supera por 5+: devolve ao usuário.'},
 {n:'Romper a Força',desc:'lado claro',t:'Ação padrão',a:'Usuário sombrio a até 12 quadrados',vs:'Vontade',tiers:[[25,'Sem PF por horas = Lado Sombrio'],[30,'... e -1 passo por poder usado'],[35,'... e -2 passos por poder usado']],d:'Só afeta quem tem Pontuação do Lado Sombrio 1+.'},
 {n:'Transferência Vital',desc:'lado claro',t:'Ação padrão',a:'Criatura tocada',tiers:[[15,'Cura 2 × seu nível'],[20,'Cura 3 × seu nível'],[25,'Cura 4 × seu nível']],d:'Você sofre metade do que curou. +1 PF: não sofre dano.'},
 {n:'Truque Mental',desc:'ação mental',t:'Ação padrão',a:'Criatura Int 3+ a até 12 quadrados',vs:'Vontade',d:'Alucinação, finta, sugestão razoável ou medo (alvo de nível menor que o seu).'},
 {n:'Ver à Distância',t:'Rodada completa',a:'Criatura conhecida',vs:'Vontade',d:'Sente se o alvo vive, onde está e o que sente. +1 PF: imagem clara dos arredores.'}
];
export const POWER_BY = Object.fromEntries(POWERS.map(p=>[p.n,p]));

/* Armas: Tabelas 8-3 e 8-4 */
export const WEAPONS = [
 {n:'Desarmado',g:'armas simples',m:true,dmg:'1d4',cost:0,type:'Concussão'},
 {n:'Faca',g:'armas simples',m:true,light:true,dmg:'1d4',cost:25,type:'Cortante ou perfurante',thrown:true},
 {n:'Bastão de atordoamento',g:'armas simples',m:true,light:true,dmg:'1d6',stun:'2d6',cost:15,type:'Concussão'},
 {n:'Clava/bastão',g:'armas simples',m:true,light:true,dmg:'1d6',cost:15,type:'Concussão'},
 {n:'Lança',g:'armas simples',m:true,dmg:'1d8',cost:60,type:'Perfurante',thrown:true},
 {n:'Maça',g:'armas simples',m:true,dmg:'1d8',cost:50,type:'Concussão'},
 {n:'Bordão',g:'armas simples',m:true,dmg:'1d6/1d6',cost:65,type:'Concussão'},
 {n:'Vibroadaga',g:'armas de ataque físico avançadas',m:true,light:true,dmg:'2d4',cost:200,type:'Cortante ou perfurante'},
 {n:'Vibrolâmina',g:'armas de ataque físico avançadas',m:true,light:true,dmg:'2d6',cost:250,type:'Cortante ou perfurante'},
 {n:'Haste de força',g:'armas de ataque físico avançadas',m:true,dmg:'2d8',stun:'2d8',cost:500,type:'Perfurante e energia'},
 {n:'Vibrobaioneta',g:'armas de ataque físico avançadas',m:true,dmg:'2d6',cost:350,type:'Perfurante'},
 {n:'Eletrocajado',g:'armas de ataque físico avançadas',m:true,dmg:'2d6/2d6',cost:3000,type:'Concussão'},
 {n:'Vibromachado',g:'armas de ataque físico avançadas',m:true,dmg:'2d10',cost:500,type:'Cortante'},
 {n:'Sabre de luz curto',g:'sabres de luz',m:true,light:true,dmg:'2d6',cost:2500,type:'Energia e cortante'},
 {n:'Sabre de luz',g:'sabres de luz',m:true,dmg:'2d8',cost:3000,type:'Energia e cortante'},
 {n:'Sabre de luz duplo',g:'sabres de luz',m:true,dmg:'2d8/2d8',cost:7000,type:'Energia e cortante'},
 {n:'Pistola blaster compacta',g:'pistolas',dmg:'3d4',cost:300,type:'Energia'},
 {n:'Pistola blaster',g:'pistolas',dmg:'3d6',stun:'2d6',cost:500,type:'Energia'},
 {n:'Pistola blaster esportiva',g:'pistolas',dmg:'3d4',stun:'2d4',cost:300,type:'Energia'},
 {n:'Pistola de íon',g:'pistolas',dmg:'3d6',cost:250,type:'Energia (íon)'},
 {n:'Pistola lança-lesma',g:'pistolas',dmg:'2d6',cost:250,type:'Perfurante'},
 {n:'Pistola blaster pesada',g:'pistolas',dmg:'3d8',stun:'2d8',cost:750,type:'Energia'},
 {n:'Carabina blaster',g:'rifles',dmg:'3d8',stun:'2d8',cost:900,type:'Energia',auto:true},
 {n:'Rifle blaster',g:'rifles',dmg:'3d8',stun:'2d8',cost:1000,type:'Energia',auto:true},
 {n:'Rifle blaster esportivo',g:'rifles',dmg:'3d6',stun:'2d6',cost:800,type:'Energia'},
 {n:'Rifle de íon',g:'rifles',dmg:'3d8',cost:800,type:'Energia (íon)'},
 {n:'Rifle lança-lesma',g:'rifles',dmg:'2d8',cost:300,type:'Perfurante',auto:true},
 {n:'Blaster repetidora leve',g:'rifles',dmg:'3d8',cost:1200,type:'Energia',auto:true},
 {n:'Rifle blaster pesado',g:'rifles',dmg:'3d10',stun:'2d10',cost:2000,type:'Energia',auto:true},
 {n:'Lança-chamas',g:'exótica',dmg:'3d6',cost:1000,type:'Fogo'},
 {n:'Bowcaster',g:'exótica',dmg:'3d10',cost:1500,type:'Energia e perfurante'},
 {n:'Blaster repetidora pesada',g:'armas pesadas',dmg:'3d10',cost:4000,type:'Energia',auto:true},
 {n:'Canhão blaster',g:'armas pesadas',dmg:'3d12',cost:3000,type:'Energia'},
 {n:'Lança mísseis',g:'armas pesadas',dmg:'6d6',cost:1500,type:'Cortante'},
 {n:'Granada de fragmento',g:'armas simples',dmg:'4d6',cost:200,type:'Cortante',thrown:true,area:true},
 {n:'Granada de atordoamento',g:'armas simples',dmg:'4d6',stunOnly:true,cost:250,type:'Energia',thrown:true,area:true},
 {n:'Granada de íon',g:'armas simples',dmg:'4d6',cost:250,type:'Energia (íon)',thrown:true,area:true},
 {n:'Detonador termal',g:'armas simples',dmg:'8d6',cost:2000,type:'Energia',thrown:true,area:true},
 {n:'Arco',g:'armas simples',dmg:'1d6',cost:300,type:'Perfurante'},
 {n:'Funda',g:'armas simples',dmg:'1d4',cost:35,type:'Concussão'}
];
export const WEAPON_BY = Object.fromEntries(WEAPONS.map(w=>[w.n,w]));

/* Alcance: Tabela 8-5 (quadrados): queima-roupa, curto, médio, longo */
export const RANGES = {
 'arremesso':[6,8,10,12],'armas pesadas':[50,100,250,500],'armas simples':[20,40,60,80],
 'pistolas':[20,40,60,80],'rifles':[30,60,150,300]
};
export const RANGE_LABEL = ['Queima-roupa (sem penalidade)','Curto (-2)','Médio (-5)','Longo (-10)'];
export const RANGE_PEN = [0,-2,-5,-10];

/* Armaduras: Tabela 8-7 */
export const ARMORS = [
 {n:'Capacete e traje blast',cat:'leve',ref:2,fort:0,maxDex:5,cost:500},
 {n:'Traje de vôo acolchoado',cat:'leve',ref:3,fort:1,maxDex:4,cost:2000},
 {n:'Macacão de combate',cat:'leve',ref:4,fort:0,maxDex:4,cost:1500},
 {n:'Traje de vôo blindado',cat:'leve',ref:5,fort:2,maxDex:3,cost:4000},
 {n:'Armadura de stormtrooper',cat:'leve',ref:6,fort:2,maxDex:3,cost:8000},
 {n:'Armadura cerimonial',cat:'média',ref:7,fort:0,maxDex:2,cost:5000},
 {n:'Traje de força Corelliano',cat:'média',ref:7,fort:0,maxDex:3,cost:10000},
 {n:'Armadura de batalha',cat:'média',ref:8,fort:2,maxDex:2,cost:7000},
 {n:'Traje espacial encouraçado',cat:'pesada',ref:9,fort:3,maxDex:1,cost:12000},
 {n:'Armadura de batalha pesada',cat:'pesada',ref:10,fort:4,maxDex:1,cost:15000}
];
export const ARMOR_BY = Object.fromEntries(ARMORS.map(a=>[a.n,a]));
export const ARMOR_PEN = {'leve':-2,'média':-5,'pesada':-10};

/* Equipamento: Tabela 8-8 (seleção) */
export const GEAR = [
 ['Comlink de curta distância',25,0.1],['Comlink de longa distância',250,1],['Datapad',1000,0.5],['Datapad básico',100,0.3],
 ['Holoprojetor pessoal',1000,0.5],['Eletrobinóculos',1000,1],['Bastão brilhante',10,1],['Lanterna de fusão',25,2],
 ['Medpac',100,1],['Kit médico',600,20],['Kit cirúrgico',1000,10],['Máscara respiratória',200,2],['Respirador aquata',350,0.2],
 ['Traje de vôo',1000,3],['Pacote de rações',5,1],['Kit de campo',1000,10],['Corda sintética (45 m)',20,4],
 ['Cinto de utilidades',500,4],['Kit de ferramentas',250,10],['Kit de segurança',750,1],['Célula de energia',10,0],
 ['Pilha de energia',25,0.5],['Algemas',50,0.5],['Propulsor a jato',300,8],['Cartões de dados (10)',10,0.1],
 ['Chip de créditos',100,0.1],['Codificador de bolso',400,0.5],['Mira telescópica',100,0.5],['Coldre',25,0.5]
];

/* Curso da condição */
export const COND = [
 {k:0,l:'Normal',p:0},{k:1,l:'-1',p:-1},{k:2,l:'-2',p:-2},{k:3,l:'-5',p:-5},{k:4,l:'-10 · ½ movimento',p:-10},{k:5,l:'Incapaz',p:0}
];

/* Personagens do GM: Capítulo 16 e Capítulo 11 */
export const BESTIARY = [
 {n:'Stormtrooper',nd:1,ref:16,fort:12,will:10,hp:10,thr:12,init:2,per:9,spd:6,atk:[['Rifle blaster',4,'3d8',true],['Granada de fragmentação',3,'4d6',true],['Desarmado',4,'1d4+1',false]],notes:'Armadura de stormtrooper, Ataque Coordenado, modo automático.',side:'imp'},
 {n:'Stormtrooper Pesado',nd:2,ref:16,fort:12,will:9,hp:20,thr:12,init:4,per:10,spd:6,atk:[['Blaster repetidora leve (firmada)',5,'3d8',true],['Granada de fragmentação',6,'4d6',true]],notes:'Rajada de Tiros, cargas explosivas.',side:'imp'},
 {n:'Oficial Imperial',nd:5,ref:15,fort:14,will:18,hp:33,thr:14,init:3,per:10,spd:6,atk:[['Pistola blaster',5,'3d6+2',true]],notes:'Líder Nato, Coordenar, Confiança.',side:'imp'},
 {n:'Soldado Clone',nd:2,ref:17,fort:13,will:9,hp:21,thr:13,init:9,per:4,spd:6,atk:[['Rifle blaster',5,'3d8+3',true]],notes:'Tiro Cuidadoso.',side:'rep'},
 {n:'Soldado Rebelde',nd:1,ref:13,fort:11,will:10,hp:10,thr:11,init:7,per:6,spd:6,atk:[['Pistola blaster',4,'3d6',true],['Granada de fragmentação',3,'4d6',true]],notes:'',side:'reb'},
 {n:'Bandido',nd:1,ref:10,fort:11,will:9,hp:9,thr:11,init:6,per:5,spd:6,atk:[['Vibromachado',2,'2d10+2',false],['Pistola blaster',1,'3d6',true]],notes:'Lado Sombrio 3.',side:'crim'},
 {n:'Dróide de Batalha B1',nd:1,ref:9,fort:11,will:11,hp:10,thr:11,init:0,per:6,spd:6,atk:[['Carabina blaster',1,'3d8',true]],notes:'Imune a efeitos mentais (traços de dróide).',side:'cis'},
 {n:'Droideka',nd:4,ref:16,fort:13,will:12,hp:40,thr:18,init:8,per:13,spd:2,atk:[['2 canhões laser',10,'3d8',true],['Tiro Rápido',8,'4d8',true]],notes:'Escudo de energia (VE 20). Rola a 10 quadrados.',side:'cis'},
 {n:'Wampa',nd:4,ref:15,fort:16,will:12,hp:52,thr:21,init:2,per:2,spd:6,atk:[['2 garras',7,'1d6+8',false],['Mordida',7,'1d8+8',false]],notes:'Besta grande. Dilacerar +2d6.',side:'beast'},
 {n:'Rancor',nd:11,ref:17,fort:16,will:8,hp:138,thr:36,init:5,per:9,spd:8,atk:[['2 garras',11,'1d8+20',false],['Mordida',11,'2d6+20',false]],notes:'Enorme, cura rápida 5, Trespassar, Esmagar.',side:'beast'}
];

/* Galáxia */
export const PLANETS = [
 {n:'Coruscant',r:'Núcleo',x:0.50,y:0.47,c:'#e8c070',d:'Capital da República e do Império: uma cidade que cobre o planeta inteiro.'},
 {n:'Alderaan',r:'Núcleo',x:0.54,y:0.42,c:'#7fb8e8',d:'Mundo pacífico de montanhas, terra natal de Leia Organa.'},
 {n:'Corellia',r:'Núcleo',x:0.56,y:0.52,c:'#8cc9a0',d:'Estaleiros famosos e os melhores pilotos e contrabandistas.'},
 {n:'Bothawui',r:'Orla Média',x:0.66,y:0.62,c:'#c9a46a',d:'Lar dos Bothans e da sua rede de espionagem.'},
 {n:'Kashyyyk',r:'Orla Média',x:0.36,y:0.34,c:'#4f8f4a',d:'Florestas de wroshyr, terra natal dos Wookiees.'},
 {n:'Naboo',r:'Orla Média',x:0.62,y:0.80,c:'#6fb07a',d:'Lagos, palácios e a cidade submersa dos Gungans.'},
 {n:'Ryloth',r:'Orla Exterior',x:0.70,y:0.84,c:'#d0905a',d:"Mundo dos Twi'leks, de dia escaldante e noite gelada."},
 {n:'Tatooine',r:'Orla Exterior',x:0.76,y:0.86,c:'#e8b86a',d:'Deserto de dois sóis, Hutts, cantinas e caçadores de recompensa.'},
 {n:'Geonosis',r:'Orla Exterior',x:0.80,y:0.80,c:'#c76f4a',d:'Fábricas de dróides e arenas de execução.'},
 {n:'Mustafar',r:'Orla Exterior',x:0.84,y:0.72,c:'#e0563a',d:'Rios de lava e mineração de metais raros.'},
 {n:'Hoth',r:'Orla Exterior',x:0.20,y:0.66,c:'#dcecf5',d:'Planeta gelado onde a Rebelião escondeu a Base Eco.'},
 {n:'Dagobah',r:'Orla Exterior',x:0.24,y:0.74,c:'#5f7f4f',d:'Pântanos envoltos em névoa e forte presença da Força.'},
 {n:'Bespin',r:'Orla Exterior',x:0.18,y:0.58,c:'#e8a87a',d:'Gigante gasoso com a Cidade das Nuvens.'},
 {n:'Endor',r:'Orla Exterior',x:0.16,y:0.30,c:'#4f8a5a',d:'Lua florestal dos Ewoks.'},
 {n:'Yavin 4',r:'Orla Exterior',x:0.86,y:0.40,c:'#6f9a5a',d:'Lua de selvas e templos Massassi, base rebelde.'},
 {n:'Kamino',r:'Regiões Desconhecidas (borda)',x:0.92,y:0.60,c:'#7aa8c8',d:'Mundo oceânico onde o exército clone foi criado.'},
 {n:'Mon Calamari',r:'Orla Exterior',x:0.88,y:0.30,c:'#3f8fb0',d:'Planeta oceano dos Mon Calamari e Quarren.'},
 {n:'Rodia',r:'Orla Exterior',x:0.70,y:0.20,c:'#5fa86a',d:'Mundo de selvas, lar dos caçadores Rodianos.'},
 {n:'Sullust',r:'Orla Exterior',x:0.30,y:0.82,c:'#9a7a6a',d:'Vulcânico, com cidades em cavernas e a SoroSuub.'},
 {n:'Trandosha',r:'Orla Média',x:0.40,y:0.28,c:'#9a8a4a',d:'Lar dos caçadores Trandoshanos, vizinho de Kashyyyk.'},
 {n:'Kessel',r:'Orla Exterior',x:0.10,y:0.48,c:'#a0806a',d:'Minas de especiaria e a famosa rota de contrabando.'},
 {n:'Nal Hutta',r:'Espaço Hutt',x:0.74,y:0.70,c:'#8a9a4a',d:'Mundo pantanoso e centro do poder dos Hutts.'}
];
