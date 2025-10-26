/* script.js
 - carrega data/horarios.json
 - popula dropdown de professores/séries com a ordem desejada:
   primeiro: Infantil 1, Infantil 2, Infantil 3, 1º Ano ... 9º Ano
   depois: Professores em ordem alfabética
 - filtra por professor/série e dia
 - botão imprimir
 - modo claro/escuro manual (salva preferência)
*/

const profSelect = document.getElementById('profSelect');
const daySelect = document.getElementById('daySelect');
const timetableArea = document.getElementById('timetableArea');
const notice = document.getElementById('notice');
const printBtn = document.getElementById('printBtn');
const themeToggle = document.getElementById('themeToggle');

let allSchedules = []; // carregado do JSON

// ordem pedagógica para "Mostrar todos" e ordem inicial das turmas
const seriesOrder = [
  'Infantil 1','Infantil 2','Infantil 3',
  '1º Ano','2º Ano','3º Ano','4º Ano','5º Ano',
  '6º Ano','7º Ano','8º Ano','9º Ano'
];

// Carregar JSON
fetch('data/horarios.json')
  .then(r => r.json())
  .then(data => {
    allSchedules = data;
    populateProfSelect();
  })
  .catch(err => {
    console.error(err);
    profSelect.innerHTML = '<option value="">Erro ao carregar dados</option>';
    notice.textContent = 'Erro ao carregar dados. Verifique o arquivo data/horarios.json';
  });

function populateProfSelect(){
  // separar séries e professores
  const series = [];
  const professors = [];

  allSchedules.forEach(item => {
    if(item.type && item.type === 'série') series.push(item);
    else professors.push(item);
  });

  // ordenar series segundo seriesOrder (se faltar, vêm depois)
  series.sort((a,b) => {
    const ia = seriesOrder.indexOf(a.label);
    const ib = seriesOrder.indexOf(b.label);
    if(ia === -1 && ib === -1) return a.label.localeCompare(b.label);
    if(ia === -1) return 1;
    if(ib === -1) return -1;
    return ia - ib;
  });

  // ordenar professores alfabeticamente pelo label
  professors.sort((a,b) => a.label.localeCompare(b.label, 'pt-BR'));

  // montar options: series primeiro, depois professores
  let opt = '<option value="">-- Selecionar professor / série --</option>';
  opt += '<option value="__all">Mostrar todos</option>';
  series.forEach((s, idx) => {
    opt += `<option value="s__${escapeHtml(s.label)}">${escapeHtml(s.label)}</option>`;
  });
  professors.forEach((p, idx) => {
    opt += `<option value="p__${escapeHtml(p.label)}">${escapeHtml(p.label)}</option>`;
  });

  profSelect.innerHTML = opt;
}

// Event listeners
profSelect.addEventListener('change', renderSelected);
daySelect.addEventListener('change', renderSelected);

// print
printBtn.addEventListener('click', () => window.print());

// theme toggle manual
themeToggle.addEventListener('click', () => {
  const body = document.body;
  if(body.classList.contains('dark')){
    body.classList.remove('dark');
    body.classList.add('light');
    themeToggle.textContent = 'Modo Escuro';
    localStorage.setItem('cepit-theme','light');
  } else {
    body.classList.remove('light');
    body.classList.add('dark');
    themeToggle.textContent = 'Modo Claro';
    localStorage.setItem('cepit-theme','dark');
  }
});

// restore theme
(function restoreTheme(){
  const t = localStorage.getItem('cepit-theme') || 'light';
  document.body.classList.remove('light','dark');
  document.body.classList.add(t);
  themeToggle.textContent = (t === 'dark') ? 'Modo Claro' : 'Modo Escuro';
})();

function renderSelected(){
  const profVal = profSelect.value;
  const day = daySelect.value;

  if(!profVal){
    timetableArea.innerHTML = '';
    notice.textContent = 'Selecione um professor ou série para ver o horário.';
    return;
  }

  if(profVal === '__all'){
    renderAll(day);
    return;
  }

  const [type, key] = profVal.split('__');
  const labelKey = decodeHtml(key);

  const entry = allSchedules.find(it => it.label === labelKey);
  if(!entry){
    timetableArea.innerHTML = '';
    notice.textContent = 'Professor / série não encontrado.';
    return;
  }

  notice.textContent = `Horário: ${entry.label}`;
  timetableArea.innerHTML = buildTableHTML(entry, day);
}

// render all in requested order: seriesOrder then professors alphabetical
function renderAll(day){
  notice.textContent = 'Exibindo todos os horários';
  const series = [];
  const professors = [];

  allSchedules.forEach(item => {
    if(item.type && item.type === 'série') series.push(item);
    else professors.push(item);
  });

  // order series by seriesOrder
  series.sort((a,b) => {
    const ia = seriesOrder.indexOf(a.label);
    const ib = seriesOrder.indexOf(b.label);
    if(ia === -1 && ib === -1) return a.label.localeCompare(b.label);
    if(ia === -1) return 1;
    if(ib === -1) return -1;
    return ia - ib;
  });

  // professors alphabetical
  professors.sort((a,b) => a.label.localeCompare(b.label, 'pt-BR'));

  let html = '';
  series.forEach(s => { html += `<div class="table-root p-3">${buildTableHTML(s, day)}</div>`; });
  professors.forEach(p => { html += `<div class="table-root p-3">${buildTableHTML(p, day)}</div>`; });

  timetableArea.innerHTML = html || '<div class="p-3">Nenhum horário disponível.</div>';
}

/* buildTableHTML(entry, dayFilter) -> string */
function buildTableHTML(entry, dayFilter){
  const rows = entry.table;
  let html = `<div class="p-2"><h5 class="mb-3">${escapeHtml(entry.label)} <small class="text-muted">(${entry.type})</small></h5>`;
  html += `<div class="table-root"><table class="table table-borderless mb-0"><thead><tr>
    <th class="time-col">Aula</th>
    <th class="time-col">Horário</th>
    <th class="day-col">Segunda</th>
    <th class="day-col">Terça</th>
    <th class="day-col">Quarta</th>
    <th class="day-col">Quinta</th>
    <th class="day-col">Sexta</th>
  </tr></thead><tbody>`;

  rows.forEach(r=>{
    if((r.aula || '').toLowerCase().includes('intervalo')){
      html += `<tr class="interval-row"><td colspan="7">${escapeHtml(r.aula || 'INTERVALO')} ${r.horario ? '- ' + escapeHtml(r.horario) : ''}</td></tr>`;
      return;
    }

    const monday = (dayFilter === 'monday' && !r.monday) ? '' : (r.monday || '');
    const tuesday = (dayFilter === 'tuesday' && !r.tuesday) ? '' : (r.tuesday || '');
    const wednesday = (dayFilter === 'wednesday' && !r.wednesday) ? '' : (r.wednesday || '');
    const thursday = (dayFilter === 'thursday' && !r.thursday) ? '' : (r.thursday || '');
    const friday = (dayFilter === 'friday' && !r.friday) ? '' : (r.friday || '');

    html += `<tr>
      <td>${escapeHtml(r.aula || '')}</td>
      <td>${escapeHtml(r.horario || '')}</td>
      <td>${escapeHtml(monday)}</td>
      <td>${escapeHtml(tuesday)}</td>
      <td>${escapeHtml(wednesday)}</td>
      <td>${escapeHtml(thursday)}</td>
      <td>${escapeHtml(friday)}</td>
    </tr>`;
  });

  html += `</tbody></table></div></div>`;
  return html;
}

function escapeHtml(s){
  if(!s) return '';
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}
function decodeHtml(s){
  if(!s) return '';
  return s.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>');
}
