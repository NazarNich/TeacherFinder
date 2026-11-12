const DATA_URL = "data/lessons.json";
const DAYS = ["Poniedziałek","Wtorek","Środa","Czwartek","Piątek"];
const state = { mode: "teacher", lessons: [], meta: {} };
const input = document.querySelector("#search-input");
const results = document.querySelector("#results");

const labels = {
  teacher: ["KOD NAUCZYCIELA","Np. Ga, Zi, WE…","Wpisz kod nauczyciela, np. Ga albo WE.","Wyszukaj nauczyciela"],
  room: ["NUMER SALI","Np. 204, SG3, Aula…","Wpisz numer lub oznaczenie sali.","Wyszukaj salę"],
  class: ["ODDZIAŁ","Np. 4B, 2A…","Wpisz symbol klasy, np. 4B.","Wyszukaj klasę"]
};

function normalize(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function setMode(mode){
  state.mode=mode;
  document.querySelectorAll(".tab").forEach(btn=>{
    const active=btn.dataset.mode===mode;
    btn.classList.toggle("active",active);btn.setAttribute("aria-selected",String(active));
  });
  const [label,placeholder,hint,title]=labels[mode];
  document.querySelector("#search-label").textContent=label;
  input.placeholder=placeholder;document.querySelector("#search-hint").textContent=hint;
  document.querySelector("#results-title").textContent=title;render();
}
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.mode)));
input.addEventListener("input",render);
document.querySelector("#clear-btn").addEventListener("click",()=>{input.value="";input.focus();render();});

function render(){
  const query=normalize(input.value);
  if(!query){showEmpty("⌕","Wpisz kod, salę lub klasę","Wyniki pojawią się tutaj po wyszukaniu.");return;}
  const field=state.mode==="teacher"?"teacher":state.mode==="room"?"room":"class_name";
  const matches=state.lessons.filter(item=>normalize(item[field]).includes(query))
    .sort((a,b)=>(a.day_index-b.day_index)||(a.lesson_number-b.lesson_number)||a.class_name.localeCompare(b.class_name));
  document.querySelector("#result-count").textContent=`${matches.length} ${plural(matches.length)}`;
  if(!matches.length){showEmpty("⌕","Brak wyników",state.lessons.length?"Nie znaleziono pasujących lekcji. Sprawdź wpisaną frazę.":"Baza nie zawiera jeszcze pobranych planów. Uruchom importer zgodnie z instrukcją README.");return;}
  results.innerHTML=matches.map(item=>`
    <article class="lesson-card">
      <div class="lesson-time">${escapeHtml(item.time||"—")}<small>${escapeHtml(DAYS[item.day_index]||item.day||"")}, lekcja ${escapeHtml(item.lesson_number)}</small></div>
      <div class="lesson-main"><strong>${escapeHtml(item.subject||"Zajęcia")}</strong><p>${escapeHtml(item.teacher)} · ${escapeHtml(item.class_name)}${item.group?` · grupa ${escapeHtml(item.group)}`:""}</p></div>
      <div class="lesson-room">${escapeHtml(item.room||"Brak sali")}</div>
    </article>`).join("");
}
function plural(n){if(n===1)return"lekcja";if(n%10>=2&&n%10<=4&&(n%100<12||n%100>14))return"lekcje";return"lekcji";}
function showEmpty(icon,title,description){
  document.querySelector("#result-count").textContent="—";
  results.innerHTML=`<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div>`;
}
async function loadData(){
  try{
    const response=await fetch(`${DATA_URL}?v=${Date.now()}`,{cache:"no-store"});
    if(!response.ok)throw new Error("Nie udało się pobrać bazy");
    const data=await response.json();
    state.lessons=Array.isArray(data.lessons)?data.lessons:[];
    state.meta=data.meta||{};
    const stamp=state.meta.updated_at?new Date(state.meta.updated_at).toLocaleString("pl-PL"):"brak synchronizacji";
    document.querySelector("#sync-label").textContent=state.lessons.length?`Dane: ${stamp}`:"Oczekiwanie na pierwszą synchronizację";
    render();
  }catch(error){
    document.querySelector("#sync-label").textContent="Nie udało się wczytać danych";
    showEmpty("!","Nie można wczytać bazy","Sprawdź, czy aplikacja została opublikowana razem z folderem data.");
  }
}
loadData();
