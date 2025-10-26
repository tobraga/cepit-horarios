const profSelect = document.getElementById('profSelect');
const timetableArea = document.getElementById('timetableArea');
const notice = document.getElementById('notice');
const printBtn = document.getElementById('printBtn');
const themeToggle = document.getElementById('themeToggle');

let allSchedules = [];

const seriesOrder = [
  'Infantil 1','Infantil 2','Infantil 3',
  '1º Ano','2º Ano','3º Ano','4º Ano','5º Ano',
  '6º Ano','7º Ano','8º Ano','9º Ano'
];

// Carregar dados JSON
fetch('data/horarios.json')
  .then(r => r.json())
  .then(data => { allSchedules = data; populateProfSelect(); })
  .catch(err => console.error('Erro ao carregar JSON:', err));

function populateProfSelect(){
  const series = allSchedules.filter(x => x.type?.toLowerCase() === 'série');
  const profs = allSchedules.filter(x => x.type?.toLowerCase() !== 'série');

  // Ordenar séries
  series.sort((a,b) => {
    const ia = seriesOrder.indexOf(a.label);
    const ib = seriesOrder.indexOf(b.label);
    if(ia === -1 && ib === -1) return a.label.localeCompare(b.label, 'pt-BR');
    if(ia === -1) return 1;
    if(ib === -1) return -1;
    return ia - ib;
  });

  // Professores por ordem alfabética
  profs.sort((a,b) => a.label.localeCompare(b.label, 'pt-BR'));

  let html = '<option value="">-- Selecione --</option><option value="__all">Mostrar todos</option>';
  series.forEach(s => html += `<option value="s__${s.label}">${s.label}</option>`);
  profs.forEach(p => html += `<option value="p__${p.label}">${p.label}</option>`);
  profSelect.innerHTML = html;
}

profSelect.addEventListener('change', renderSelected);
printBtn.addEventListener('click', () => window.print());

// Tema claro/escuro
themeToggle.addEventListener('click', () => {
  const body = document.body;
  const dark = body.classList.toggle('dark');
  body.classList.toggle('light', !dark);
  themeToggle.textContent = dark ? 'Modo Claro' : 'Modo Escuro';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
});

(function restoreTheme(){
  const theme = localStorage.getItem('theme') || 'light';
  document.body.classList.add(theme);
  themeToggle.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
})();

function renderSelected(){
  const val = profSelect.value;
  if(!val){ notice.textContent = 'Selecione um professor ou série.'; timetableArea.innerHTML=''; return; }
  if(val==='__all') return renderAll();
  const key = val.split('__')[1];
  const entry = allSchedules.find(x => x.label === key);
  if(!entry){ timetableArea.innerHTML=''; return; }
  notice.textContent = `Horário de ${entry.label}`;
  timetableArea.innerHTML = buildTable(entry);
}

function renderAll(){
  const series = allSchedules.filter(x => x.type?.toLowerCase() === 'série');
  const profs = allSchedules.filter(x => x.type?.toLowerCase() !== 'série');
  series.sort((a,b)=>seriesOrder.indexOf(a.label)-seriesOrder.indexOf(b.label));
  profs.sort((a,b)=>a.label.localeCompare(b.label,'pt-BR'));
  let html = '';
  [...series,...profs].forEach(x => html += buildTable(x));
  notice.textContent = 'Exibindo todos os horários';
  timetableArea.innerHTML = html;
}

function buildTable(entry){
  const rows = entry.table || [];
  let html = `<div class="mb-4"><h5>${entry.label} <small class="text-muted">(${entry.type||''})</small></h5>
  <table class="table table-bordered"><thead><tr>
  <th>Aula</th><th>Horário</th><th>Segunda</th><th>Terça</th><th>Quarta</th><th>Quinta</th><th>Sexta</th>
  </tr></thead><tbody>`;
  rows.forEach(r=>{
    if((r.aula||'').toLowerCase().includes('intervalo')){
      html+=`<tr class="interval-row"><td colspan="7">${r.aula} - ${r.horario}</td></tr>`;
    } else {
      html+=`<tr><td>${r.aula||''}</td><td>${r.horario||''}</td>
      <td>${r.monday||''}</td><td>${r.tuesday||''}</td><td>${r.wednesday||''}</td>
      <td>${r.thursday||''}</td><td>${r.friday||''}</td></tr>`;
    }
  });
  return html+'</tbody></table></div>';
}
