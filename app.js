const DATA_URL = "data/lessons.json";
const CHANGES_URL = "data/changes.json";
const DAYS = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];
const state = { mode: "teacher", view: "search", lessons: [], changes: [], meta: {}, changesMeta: {} };
const input = document.querySelector("#search-input");
const results = document.querySelector("#results");
const labels = {
  teacher: ["KOD NAUCZYCIELA", "Np. Ga, Zi, WE…", "Wpisz kod nauczyciela, np. Ga albo WE.", "Wyszukaj nauczyciela"],
  room: ["NUMER SALI", "Np. 204, SG3, Aula…", "Wpisz numer lub oznaczenie sali.", "Wyszukaj salę"],
  class: ["KLASA", "Np. 4B, 2A…", "Wpisz symbol klasy, np. 4B.", "Wyszukaj klasę"]
};
const TEACHER_CODE_BY_SURNAME = {
  Adamczyk:{initial:"a",code:"AA"},
  Adamiak:{initial:"r",code:"XA"},
  Bartusik:{initial:"a",code:"Ba"},
  Bębnik:{initial:"e",code:"EB"},
  Boncol:{initial:"a",code:"AN"},
  Brodowska:{initial:"k",code:"Bk"},
  Bubel:{initial:"k",code:"Bu"},
  Buczek:{initial:"m",code:"MB"},
  Cieniek:[{initial:"k",code:"Ci"},{initial:"s",code:"Cs"}],
  Cięciel:{initial:"r",code:"CR"},
  Czaplik:{initial:"a",code:"CA"},
  Czyż:{initial:"k",code:"Cz"},
  Dłubak:{initial:"p",code:"Dł"},
  Domagała:{initial:"a",code:"AD"},
  Ducka:{initial:"k",code:"Du"},
  Dudek:{initial:"i",code:"Dd"},
  Ferdyn:{initial:"ł",code:"FŁ"},
  Gadacz:{initial:"j",code:"Py"},
  Gajewska:{initial:"a",code:"L1"},
  Gawin:{initial:"b",code:"Ga"},
  Głowacka:{initial:"a",code:"AŁ"},
  Goj:{initial:"j",code:"Go"},
  Gowin:{initial:"m",code:"GM"},
  Górny:{initial:"b",code:"BÓ"},
  Grela:{initial:"a",code:"Gr"},
  Gurowiec:{initial:"k",code:"Gu"},
  Haida:{initial:"m",code:"MH"},
  Horzela:{initial:"d",code:"DH"},
  Ibrom:{initial:"o",code:"IO"},
  Kaim:{initial:"m",code:"Ka"},
  Kapica:{initial:"r",code:"KI"},
  Kempys:{initial:"d",code:"Ke"},
  Kotalczyk:{initial:"a",code:"KT"},
  Kowalska:{initial:"r",code:"RO"},
  Krajcer:{initial:"r",code:"RK"},
  Kruk:{initial:"a",code:"K2"},
  Krużołek:{initial:"c",code:"Kr"},
  Krzykowska:{initial:"p",code:"PR"},
  Laskowska:{initial:"a",code:"Lr"},
  Łukaszczyk:{initial:"m",code:"MŁ"},
  Madalińska:{initial:"a",code:"AM"},
  Madeja:[{initial:"k",code:"KM"},{initial:"o",code:"OM"}],
  Markusik:{initial:"d",code:"DM"},
  Maziarz:{initial:"a",code:"Mr"},
  Musiałek:{initial:"k",code:"Mk"},
  "Mzyk-Porada":{initial:"m",code:"Mz"},
  "Nobis-Biernacka":{initial:"s",code:"SN"},
  Oleśkiewicz:{initial:"j",code:"JL"},
  Onak:{initial:"b",code:"On"},
  Opara:{initial:"a",code:"AO"},
  Piasecki:{initial:"j",code:"Pi"},
  Podgórska:{initial:"m",code:"MP"},
  Schaefer:{initial:"p",code:"PS"},
  Smyczek:{initial:"m",code:"Sm"},
  Spendel:{initial:"r",code:"Sp"},
  Strzelec:{initial:"e",code:"ES"},
  Sukiennik:{initial:"k",code:"Su"},
  Szczepańczyk:{initial:"a",code:"AE"},
  Szeremeta:{initial:"m",code:"ZS"},
  Świtała:{initial:"p",code:"PŚ"},
  Totoś:{initial:"w",code:"To"},
  Wachla:{initial:"r",code:"Wa"},
  Wachowiak:{initial:"a",code:"Ww"},
  Walaszek:{initial:"t",code:"Wt"},
  Warchoł:{initial:"g",code:"GW"},
  Wąsowicz:{initial:"e",code:"WE"},
  "Wesołowski-Schwingenschlögel":{initial:"b",code:"BW"},
  Wieczorek:{initial:"i",code:"Wi"},
  Woźniczka:{initial:"m",code:"MO"},
  Zając:{initial:"i",code:"Za"},
  Ziębacz:{initial:"s",code:"Zi"},
  Żalek:{initial:"a",code:"ŻA"}
};
const fieldFor = category => category === "teacher" ? "teacher" : category === "room" ? "room" : "class_name";
const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sortLessons = list => [...list].sort((a,b) => (a.day_index-b.day_index) || (a.lesson_number-b.lesson_number) || String(a.class_name).localeCompare(String(b.class_name), "pl"));
const TEACHER_CODES = new Set(Object.values(TEACHER_CODE_BY_SURNAME).flatMap(entries => (Array.isArray(entries) ? entries : [entries]).map(entry => normalize(entry.code))));

function getTeacherCode(teacher) {
  const value = String(teacher || "").trim();
  if (!value) return "";
  if (TEACHER_CODES.has(normalize(value))) return value;
  if (/^[a-ząćęłńóśźż]{1,3}$/i.test(value)) return value;
  const parts = value.replace(/^p\.\s*/i, "").split(/[\s.]+/).filter(Boolean);
  const surname = normalize(parts[parts.length - 1] || "");
  const entries = Object.entries(TEACHER_CODE_BY_SURNAME).find(([name]) => normalize(name) === surname)?.[1];
  if (!entries) return "";
  const options = Array.isArray(entries) ? entries : [entries];
  const initial = parts.length > 1 ? normalize(parts[0]) : "";
  const matchingOptions = initial ? options.filter(entry => normalize(entry.initial) === initial) : options;
  return matchingOptions.length === 1 ? matchingOptions[0].code : "";
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".tab").forEach(btn => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle("active", active); btn.setAttribute("aria-selected", String(active));
  });
  const [label, placeholder, hint, title] = labels[mode];
  document.querySelector("#search-label").textContent = label;
  input.placeholder = placeholder; document.querySelector("#search-hint").textContent = hint;
  document.querySelector("#results-title").textContent = title; renderSearch();
}
document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));
input.addEventListener("input", renderSearch);
document.querySelector("#clear-btn").addEventListener("click", () => { input.value = ""; input.focus(); renderSearch(); });

document.querySelectorAll(".view-tab").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
function setView(view) {
  state.view = view;
  document.querySelectorAll(".view-tab").forEach(btn => {
    const active = btn.dataset.view === view;
    btn.classList.toggle("active", active); btn.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll(".view-panel").forEach(panel => panel.hidden = panel.id !== `${view}-view`);
  if (view === "day") renderDay();
  if (view === "week") renderWeek();
}
["day-select", "day-category", "day-filter"].forEach(id => document.getElementById(id).addEventListener(id === "day-filter" ? "input" : "change", renderDay));
["week-category", "week-filter"].forEach(id => document.getElementById(id).addEventListener(id === "week-filter" ? "input" : "change", renderWeek));

function renderLesson(row) {
  const lesson = row.lesson || row;
  const change = row.change;
  const status = row.status || "normal";
  const statusLabels = {
    absent: "Nieobecny",
    cancelled: "Odwołano",
    replacement: change?.moved ? "Przeniesiono" : "Zastępstwo",
    "class-current": "Jest teraz",
    "room-current": "Jest teraz",
  };
  const teacher = getTeacherCode(lesson.teacher) || "Brak oznaczenia";
  const date = change?.date ? ` · ${formatDate(change.date)}` : "";
  const details = [lesson.class_name, lesson.group ? `grupa ${lesson.group}` : ""].filter(Boolean).join(" · ");
  const tooltip = row.displayTooltip || changeDescription(row);
  const notice = change?.display_notice && status === "cancelled" ? '<small class="change-note">Informacja z ogłoszenia</small>' : "";
  const classes = ["lesson-card"];
  if (status === "cancelled") classes.push("lesson-cancelled");
  if (status === "replacement" || status === "class-current" || status === "room-current") classes.push("lesson-replacement");
  if (row.roomWholeClassChange) classes.push("lesson-room-current");
  return `<article class="${classes.join(" ")}"${tooltip ? ` title="${esc(tooltip)}"` : ""}>
    <div class="lesson-time">${esc(lesson.time || "—")}<small>${esc(DAYS[lesson.day_index] || lesson.day || "")}${date}, lekcja ${esc(lesson.lesson_number)}</small></div>
    <div class="lesson-main"><strong>${esc(lesson.subject || "Zajęcia")}</strong>${statusLabels[status] ? `<span class="changed-tag">${esc(statusLabels[status])}</span>` : ""}<p>${esc(teacher)} · ${esc(details)}</p>${notice}</div>
    <div class="lesson-room">${esc(lesson.room || "Brak sali")}</div>
  </article>`;
}
function plural(n) { if (n===1) return "lekcja"; if (n%10>=2 && n%10<=4 && (n%100<12 || n%100>14)) return "lekcje"; return "lekcji"; }
function empty(title, description) { return `<div class="empty-state"><div class="empty-icon">⌕</div><h3>${esc(title)}</h3><p>${esc(description)}</p></div>`; }
function renderSearch() {
  const query = normalize(input.value);
  if (!query) { document.querySelector("#result-count").textContent = "—"; results.innerHTML = empty("Wpisz kod, salę lub klasę", "Wyniki pojawią się tutaj po wyszukaniu."); return; }
  let matches = getScheduleGroups().flatMap(group => getRowsForGroup(group))
    .filter(row => matchesQuery(row.lesson, query));
  if (state.mode === "room") matches = mergeWholeClassRoomResults(matches);
  matches.sort(compareRows);
  document.querySelector("#result-count").textContent = `${matches.length} ${plural(matches.length)}`;
  results.innerHTML = matches.length ? matches.map(renderLesson).join("") : empty("Brak wyników", state.lessons.length ? "Nie znaleziono pasujących lekcji. Sprawdź wpisaną frazę." : "Baza nie zawiera jeszcze pobranych planów. Uruchom importer zgodnie z README.");
}

function nextDateForDay(dayIndex) {
  const start = new Date(`${getScheduleWeekStart()}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + dayIndex);
  return start.toISOString().slice(0, 10);
}

function getScheduleWeekStart() {
  const weekStart = state.meta.week_start || state.changesMeta.week_start;
  if (/^\d{4}-\d{2}-\d{2}$/.test(weekStart || "")) return weekStart;
  const today = new Date(`${getWarsawDate()}T00:00:00Z`);
  const day = today.getUTCDay();
  today.setUTCDate(today.getUTCDate() - ((day + 6) % 7) + (day === 0 ? 7 : 0));
  return today.toISOString().slice(0, 10);
}

function getWarsawDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getDayIndex(date) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day >= 1 && day <= 5 ? day - 1 : -1;
}

function formatDate(date) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

function groupMatches(lesson, group) {
  if (!group) return true;
  const clean = value => normalize(value).replace(/^podzial\s*/, "");
  const wanted = clean(group);
  const existing = clean(lesson.group || "");
  if (wanted === "1" || wanted === "2") return existing === wanted || existing === `${wanted}/2`;
  return existing === wanted || normalize(lesson.subject).includes(wanted);
}

function normalizeChanges(messages) {
  return messages.flatMap((message, index) => {
    const rawText = message.original_text || message.raw_text || "";
    if (message.action && Object.prototype.hasOwnProperty.call(message, "lesson_number")) {
      return [{
        ...message,
        id: message.id || `${message.date}:${message.class_name}:${index}`,
        group: message.group || "",
        original_text: rawText,
        raw_text: rawText,
        lesson_numbers: message.lesson_number == null ? [] : [Number(message.lesson_number)],
      }];
    }

    const lessonMatch = rawText.match(/\blekcja\s+((?:\d+\s*[,–-]\s*)*\d+)/i);
    const lessonNumbers = [...new Set((message.lesson_numbers?.length
      ? message.lesson_numbers
      : lessonMatch ? lessonMatch[1].split(/[,\s–-]+/).filter(Boolean).map(Number) : [])
      .map(Number).filter(Number.isInteger))];
    const groupMatch = rawText.match(/\bgrupa\s+([\w/]+)/i);
    const group = message.group || (groupMatch ? groupMatch[1] : "");
    const movedMatch = rawText.match(/\bzajęcia\s+przeniesione\s+z\s+(.+)$/i);
    const movedFrom = message.moved_from || (movedMatch ? movedMatch[1].trim() : null);
    let details = movedMatch ? rawText.slice(0, movedMatch.index) : rawText;
    details = details.replace(/^\s*Lekcja\s+((?:\d+\s*[,–-]\s*)*\d+)/i, "")
      .replace(/\bgrupa\s+[\w/]+/i, "")
      .replace(/\bcałość\b/i, "");
    const teacherMatch = details.match(/\bp\.\s*(.+?)(?=\s+s\.|$)/i);
    const roomMatch = details.match(/\bs\.\s*(.+)$/i);
    const newTeacher = message.new_teacher || message.teacher || (teacherMatch ? teacherMatch[1].trim() : null);
    const newRoom = message.new_room || message.room || (roomMatch ? roomMatch[1].trim() : null);
    let subject = message.new_subject || details;
    if (teacherMatch) subject = subject.replace(teacherMatch[0], "");
    if (roomMatch) subject = subject.replace(roomMatch[0], "");
    subject = subject.replace(/^\s*[–—-]\s*/, "").replace(/^zastępstwo\b\s*/i, "").replace(/^[ \t–—:;-]+|[ \t–—:;-]+$/g, "");
    const isCancelled = /\b(?:odwołan\w*|nie\s+ma\s+zajęć|brak\s+zajęć)\b/i.test(rawText);
    const action = message.action || (lessonNumbers.length
      ? isCancelled ? "cancel" : (subject || newTeacher || newRoom || movedFrom ? "replace" : "note")
      : "note");
    const base = {
      ...message,
      class_name: message.class_name || "",
      group,
      action,
      new_subject: message.new_subject || subject || null,
      new_teacher: newTeacher,
      new_room: newRoom,
      moved: Boolean(message.moved || movedFrom),
      moved_from: movedFrom,
      original_text: rawText,
      raw_text: rawText,
      display_notice: Boolean(message.display_notice),
    };
    const numbers = lessonNumbers.length ? lessonNumbers : [null];
    return numbers.map((lessonNumber, part) => ({
      ...base,
      id: `${message.id || `${message.date}:${message.class_name}:${index}`}:${part + 1}`,
      lesson_number: lessonNumber,
      lesson_numbers: lessonNumber == null ? [] : [lessonNumber],
      scope: lessonNumber == null ? (base.class_name ? "class" : "general") : "lesson",
    }));
  });
}

function getScheduleGroups(dateFilter) {
  const groups = state.lessons.map(lesson => ({ lesson, change: null }));
  const weekStart = getScheduleWeekStart();
  const weekEndDate = new Date(`${weekStart}T00:00:00Z`);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 4);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);
  state.changes
    .filter(change => change.action !== "note"
      && change.date >= weekStart
      && change.date <= weekEnd
      && (!dateFilter || change.date === dateFilter))
    .forEach(change => {
      const dayIndex = getDayIndex(change.date);
      if (dayIndex < 0 || change.lesson_number === null || change.lesson_number === undefined) return;
      const affected = groups.filter(group => !group.change
        && normalize(group.lesson.class_name) === normalize(change.class_name)
        && Number(group.lesson.day_index) === dayIndex
        && Number(group.lesson.lesson_number) === Number(change.lesson_number)
        && groupMatches(group.lesson, change.group));
      if (affected.length) {
        affected.forEach(group => { group.change = change; });
      } else if (change.action === "replace") {
        const time = state.lessons.find(lesson => Number(lesson.lesson_number) === Number(change.lesson_number))?.time || "";
        const lesson = {
            class_name: change.class_name,
            day_index: dayIndex,
            lesson_number: Number(change.lesson_number),
            time,
            subject: "",
            teacher: "",
            room: "",
            group: change.group || "",
          };
        groups.push({
          lesson: getChangedLesson(change, lesson),
          change,
          standalone: true,
        });
      }
    });
  return groups;
}

function groupRows(group) {
  if (!group.change) return [{ group, lesson: group.lesson, change: null, status: "normal" }];
  if (group.change.action === "cancel") return [{ group, lesson: group.lesson, change: group.change, status: "cancelled" }];
  if (group.change.action !== "replace") return [{ group, lesson: group.lesson, change: null, status: "normal" }];
  if (group.standalone) {
    return [{ group, lesson: getChangedLesson(group.change, group.lesson), change: group.change, status: "replacement" }];
  }
  return [
    { group, lesson: group.lesson, change: group.change, status: "cancelled" },
    {
      group,
      lesson: getChangedLesson(group.change, group.lesson),
      change: group.change,
      status: "replacement",
    },
  ];
}

function getRowsForGroup(group, mode = state.mode) {
  const rows = groupRows(group);
  if (mode === "teacher" && group.change?.action === "replace") {
    const replacement = rows.find(row => row.status === "replacement");
    if (!replacement || group.standalone) return replacement ? [replacement] : rows;
    if (!group.change.new_teacher || normalize(getTeacherCode(group.lesson.teacher)) === normalize(getTeacherCode(replacement.lesson.teacher))) {
      return [replacement];
    }
    return [{ ...rows.find(row => row.status === "cancelled"), status: "absent" }, replacement];
  }
  if (mode === "room" && group.change?.action === "replace"
    && group.change.new_room && group.change.new_room === group.lesson.room) {
    return rows.filter(row => row.status !== "cancelled");
  }
  return rows;
}

function getReplacementSubject(group) {
  return getChangedLesson(group.change, group.lesson).subject;
}

function getChangedLesson(change, lesson) {
  const source = getMoveSourceLesson(change, lesson);
  return {
    ...lesson,
    subject: change.new_subject || (change.moved && source?.subject) || lesson.subject,
    teacher: getChangeTeacher(change, source) || lesson.teacher,
    room: getChangeRoom(change, source) || lesson.room,
  };
}

function getMoveSourceLesson(change, lesson) {
  const sourceMatch = String(change.moved_from || "").match(/\blekcj(?:a|ę|i)?\s*(\d+)/i);
  if (!sourceMatch) return null;
  const sourceLessonNumber = Number(sourceMatch[1]);
  const sourceLessons = state.lessons.filter(item => normalize(item.class_name) === normalize(lesson.class_name || change.class_name)
    && Number(item.day_index) === getDayIndex(change.date)
    && Number(item.lesson_number) === sourceLessonNumber);
  return sourceLessons.find(item => item.group === lesson.group)
    || (change.group ? sourceLessons.find(item => groupMatches(item, change.group)) : null)
    || sourceLessons[0]
    || null;
}

function getChangeSubject(change) {
  if (change.new_subject) return change.new_subject;
  const source = getMoveSourceLesson(change, {
    class_name: change.class_name,
    group: change.group || "",
  });
  return change.moved && source ? source.subject : "";
}

function getChangeTeacher(change, source = getMoveSourceLesson(change, { class_name: change.class_name, group: change.group || "" })) {
  return change.new_teacher || (change.moved && source?.teacher) || change.teacher || "";
}

function getChangeRoom(change, source = getMoveSourceLesson(change, { class_name: change.class_name, group: change.group || "" })) {
  return change.new_room || (change.moved && source?.room) || change.room || "";
}

function matchesQuery(lesson, query, mode = state.mode) {
  if (mode === "teacher") return normalize(getTeacherCode(lesson.teacher)).includes(query);
  return normalize(lesson[fieldFor(mode)]).includes(query);
}

function compareRows(a, b) {
  return Number(a.lesson.day_index) - Number(b.lesson.day_index)
    || Number(a.lesson.lesson_number) - Number(b.lesson.lesson_number)
    || String(a.lesson.class_name).localeCompare(String(b.lesson.class_name), "pl");
}

function mergeWholeClassRoomResults(rows, mode = state.mode) {
  if (mode !== "room") return rows;
  const merged = [];
  const processed = new Set();
  rows.forEach(row => {
    const change = row.change;
    if (!change || change.action !== "replace" || String(change.group || "").trim() || !change.new_room || row.status !== "replacement") {
      merged.push(row);
      return;
    }
    if (processed.has(change)) return;
    processed.add(change);
    const replacement = rows.find(candidate => candidate.change === change && candidate.status === "replacement");
    if (!replacement) return;
    const previousGroups = [...new Set(state.lessons
      .filter(lesson => normalize(lesson.class_name) === normalize(change.class_name)
        && Number(lesson.day_index) === getDayIndex(change.date)
        && Number(lesson.lesson_number) === Number(change.lesson_number)
        && lesson.room === change.new_room
        && lesson.group)
      .map(lesson => lesson.group))];
    merged.push({
      ...replacement,
      group: { ...replacement.group, lesson: { ...replacement.group.lesson, group: "" } },
      lesson: { ...replacement.lesson, group: "" },
      displayTooltip: previousGroups.length
        ? `Zmiana z grupy ${previousGroups.join(", ")} na całą klasę.`
        : "Zajęcia dla całej klasy.",
      roomWholeClassChange: true,
      status: "room-current",
    });
  });
  return merged.sort(compareRows);
}

function getResultRows(category, value, dateFilter) {
  const dayIndex = dateFilter ? getDayIndex(dateFilter) : null;
  let rows = getScheduleGroups(dateFilter)
    .filter(group => dayIndex === null || Number(group.lesson.day_index) === dayIndex)
    .flatMap(group => getRowsForGroup(group, category))
    .filter(row => !value || matchesQuery(row.lesson, normalize(value), category));
  if (category === "room") rows = mergeWholeClassRoomResults(rows, category);
  return rows.sort(compareRows);
}

function changeDescription(row) {
  const change = row.change;
  if (!change) return "";
  if (row.status === "cancelled" || change.action === "cancel") return change.display_notice ? "Informacja z ogłoszenia." : "Lekcja odwołana.";
  if (change.action === "replace") {
    const teacher = getTeacherCode(getChangeTeacher(change, row.lesson));
    const room = getChangeRoom(change, row.lesson);
    const details = [getReplacementSubject(row.group), teacher && `p. ${teacher}`, room && `s. ${room}`].filter(Boolean);
    return `${change.moved ? "Przeniesienie" : "Zastępstwo"}: ${details.join(" · ")}`;
  }
  return "Informacja z ogłoszenia.";
}

function messageMatches(message, category, value) {
  if (!value) return true;
  return matchesQuery({
    class_name: message.class_name,
    teacher: message.new_teacher || message.teacher,
    room: message.new_room || message.room,
  }, normalize(value), category);
}

function messagesFor(date, category, value) {
  return state.changes.filter(message => (!date || message.date === date) && messageMatches(message, category, value));
}

function uniqueNotices(messages) {
  const unique = new Map();
  messages.forEach(message => {
    const text = message.original_text || message.raw_text || "";
    const key = `${message.date}|${message.class_name}|${message.group}|${message.action}|${text}`;
    if (!unique.has(key)) unique.set(key, { ...message, lesson_numbers: [] });
    const notice = unique.get(key);
    if (message.lesson_number != null) notice.lesson_numbers.push(Number(message.lesson_number));
  });
  return [...unique.values()].map(notice => ({
    ...notice,
    lesson_numbers: [...new Set(notice.lesson_numbers)].sort((a, b) => a - b),
  }));
}

function noticeText(message) {
  if (message.action === "replace") {
    const subject = getChangeSubject(message);
    const teacher = getTeacherCode(getChangeTeacher(message));
    const room = getChangeRoom(message);
    const details = [subject, teacher && `p. ${teacher}`, room && `s. ${room}`].filter(Boolean);
    return `${message.moved ? "Przeniesienie" : "Zastępstwo"}${details.length ? `: ${details.join(" · ")}` : ""}`;
  }
  if (message.action === "cancel") return "Lekcja odwołana.";
  return "Informacja z ogłoszenia.";
}

function noticeMarkup(messages, date, heading = "KOMUNIKATY O ZMIANACH") {
  const notices = uniqueNotices(messages);
  const dateLabel = /^\d{4}-\d{2}-\d{2}$/.test(date) ? formatDate(date) : date;
  if (!notices.length) return `<div class="notice-empty">Brak opublikowanych komunikatów o zmianach dla ${esc(dateLabel)}.</div>`;
  const weekView = heading === "KOMUNIKATY DOTYCZĄCE WYBRANEGO ELEMENTU";
  return `<div class="notice-heading"><span class="notice-dot"></span> ${heading} · ${esc(dateLabel)}</div>` + notices.map(message => {
    const lessonNumbers = message.lesson_numbers?.length ? ` · lekcja${message.lesson_numbers.length > 1 ? "e" : ""} ${message.lesson_numbers.map(esc).join(", ")}` : "";
    const group = message.group ? ` · grupa ${esc(message.group)}` : "";
    const noticeDate = weekView && message.date ? `${formatDate(message.date)} · ` : "";
    return `<article class="notice-card"><div class="notice-meta">${esc(noticeDate)}${esc(message.class_name || "Informacja ogólna")}${lessonNumbers}${group}</div><p>${esc(noticeText(message))}</p></article>`;
  }).join("");
}

function hasLessonChange(lesson, date = nextDateForDay(lesson.day_index)) {
  return state.changes.some(change => change.date === date
    && normalize(change.class_name) === normalize(lesson.class_name)
    && Number(change.lesson_number) === Number(lesson.lesson_number)
    && groupMatches(lesson, change.group)
    && change.action !== "note");
}

function renderDay() {
  const day = Number(document.querySelector("#day-select").value);
  const category = document.querySelector("#day-category").value;
  const value = document.querySelector("#day-filter").value;
  const date = nextDateForDay(day);
  const rows = getResultRows(category, value, date);
  document.querySelector("#day-count").textContent = `${rows.length} ${plural(rows.length)}`;
  document.querySelector("#day-changes").innerHTML = noticeMarkup(messagesFor(date, category, value), date);
  document.querySelector("#day-results").innerHTML = rows.length ? rows.map(renderLesson).join("") : empty("Brak lekcji", value ? "Nie znaleziono zajęć dla wybranego elementu w tym dniu." : "Brak danych dla wybranego dnia.");
}

function renderWeekLesson(row) {
  const lesson = row.lesson;
  const status = row.status || "normal";
  const className = status === "cancelled" ? " week-lesson-cancelled"
    : status === "replacement" || status === "absent" || status === "room-current" ? " week-lesson-changed" : "";
  const label = status === "cancelled" ? "Odwołano"
    : status === "absent" ? "Nieobecny"
      : status === "replacement" ? row.change?.moved ? "Przeniesiono" : "Zastępstwo"
        : status === "room-current" ? "Jest teraz" : "";
  const details = [
    getTeacherCode(lesson.teacher) || "—",
    lesson.room || "—",
    lesson.class_name,
    lesson.group && `gr. ${lesson.group}`,
  ].filter(Boolean).join(" · ");
  return `<div class="week-lesson${className}"${row.displayTooltip ? ` title="${esc(row.displayTooltip)}"` : ""}><strong>${esc(lesson.time || "—")}</strong><span>${esc(lesson.subject || "Zajęcia")}</span><small>${esc(details)}</small>${label ? `<em>${esc(label)}</em>` : ""}</div>`;
}

function renderWeek() {
  const category = document.querySelector("#week-category").value;
  const value = document.querySelector("#week-filter").value;
  if (!value.trim()) {
    document.querySelector("#week-count").textContent = "—";
    document.querySelector("#week-results").innerHTML = empty("Wybierz element planu", "Wpisz klasę, kod nauczyciela lub salę, aby wyświetlić tabelę tygodniową.");
    document.querySelector("#week-changes").innerHTML = "";
    return;
  }
  const days = DAYS.map((_, index) => getResultRows(category, value, nextDateForDay(index)));
  const rows = days.flat();
  document.querySelector("#week-count").textContent = `${rows.length} ${plural(rows.length)}`;
  if (!rows.length) {
    document.querySelector("#week-results").innerHTML = empty("Brak wyników", "Nie znaleziono planu dla podanego elementu.");
    document.querySelector("#week-changes").innerHTML = ""; return;
  }
  const numbers = [...new Set(rows.map(row => Number(row.lesson.lesson_number)))].sort((a,b)=>a-b);
  const cells = numbers.map(number => `<tr><th class="period-cell">${number}</th>${days.map(dayRows => {
    const entries = dayRows.filter(row => Number(row.lesson.lesson_number) === number);
    return `<td>${entries.map(renderWeekLesson).join("") || '<span class="cell-empty">—</span>'}</td>`;
  }).join("")}</tr>`).join("");
  document.querySelector("#week-results").innerHTML = `<table class="week-table"><thead><tr><th>Lekcja</th>${DAYS.map(day => `<th>${day}</th>`).join("")}</tr></thead><tbody>${cells}</tbody></table>`;
  const notices = DAYS.flatMap((_, index) => messagesFor(nextDateForDay(index), category, value));
  const weekRange = `${formatDate(nextDateForDay(0))} – ${formatDate(nextDateForDay(4))}`;
  document.querySelector("#week-changes").innerHTML = noticeMarkup(notices, weekRange, "KOMUNIKATY DOTYCZĄCE WYBRANEGO ELEMENTU");
}

async function loadJson(url) {
  const response = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Nie udało się pobrać ${url}`);
  return response.json();
}
async function loadData() {
  try {
    const [plans, changes] = await Promise.allSettled([loadJson(DATA_URL), loadJson(CHANGES_URL)]);
    if (plans.status === "fulfilled") {
      state.lessons = Array.isArray(plans.value.lessons) ? plans.value.lessons : [];
      state.meta = plans.value.meta || {};
    } else throw plans.reason;
    const rawChanges = changes.status === "fulfilled"
      ? Array.isArray(changes.value.messages) ? changes.value.messages : (plans.value.changes || [])
      : (plans.value.changes || []);
    state.changes = normalizeChanges(rawChanges);
    state.changesMeta = changes.status === "fulfilled" ? changes.value.meta || {} : state.meta;
    const planStamp = state.meta.updated_at ? new Date(state.meta.updated_at).toLocaleString("pl-PL") : "brak synchronizacji";
    const changeStamp = changes.status === "fulfilled"
      ? (state.changesMeta.updated_at ? new Date(state.changesMeta.updated_at).toLocaleString("pl-PL") : "brak zmian")
      : "zmiany niedostępne";
    document.querySelector("#sync-label").textContent = state.lessons.length ? `Plan: ${planStamp} · zmiany: ${changeStamp}` : "Oczekiwanie na pierwszą synchronizację planu";
    renderSearch(); renderDay(); renderWeek();
  } catch (error) {
    document.querySelector("#sync-label").textContent = "Nie udało się wczytać planu";
    results.innerHTML = empty("Nie można wczytać bazy", "Sprawdź, czy aplikacja została opublikowana razem z folderem data.");
  }
}
loadData();
