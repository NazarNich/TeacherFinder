#!/usr/bin/env python3
"""Import the school's published timetable-change notices into data/changes.json.

The original notice text is always retained. Parsed fields are hints for matching
and never modify data/lessons.json.
"""
from __future__ import annotations
import json, sys, tempfile
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo
import requests

from scripts.import_plans import (
    current_week_start,
    merge_week_changes,
    parse_change_line,
    parse_changes,
)

SOURCE = "https://www.zs-1.edu.pl/index.php/plan-lekcji/zmiany-do-planu"
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "changes.json"
HEADERS = {"User-Agent": "TeacherFinder/1.0 (school timetable changes; daily respectful fetch)"}


def atomic_write(payload):
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=OUTPUT.parent, delete=False) as tmp:
        json.dump(payload, tmp, ensure_ascii=False, indent=2)
        name = tmp.name
    Path(name).replace(OUTPUT)


def to_message(change, index, message_id=None):
    lesson_number = change.get("lesson_number")
    original_text = change.get("original_text") or change.get("raw_text") or ""
    class_name = change.get("class_name")
    return {
        **change,
        "id": message_id or f"{change.get('date')}:{class_name or 'ogolne'}:{lesson_number or 'note'}:{index}",
        "lesson_numbers": [lesson_number] if lesson_number is not None else [],
        "teacher": change.get("new_teacher") or change.get("teacher"),
        "room": change.get("new_room") or change.get("room"),
        "scope": "lesson" if lesson_number is not None else ("class" if class_name else "general"),
        "raw_text": original_text,
    }


def parse_messages(html):
    changes = parse_changes(html)
    if not changes:
        raise RuntimeError("Nie rozpoznano żadnych zmian; poprzedni plik pozostaje bez zmian.")
    messages = [to_message(change, index) for index, change in enumerate(changes, start=1)]
    published_date = max(message["date"] for message in messages)
    return published_date, published_date, messages


def normalize_existing_messages(messages):
    normalized = []
    for index, message in enumerate(messages, start=1):
        if message.get("action") and "lesson_number" in message:
            normalized.append(to_message(message, index, message.get("id")))
            continue

        original_text = message.get("original_text") or message.get("raw_text") or ""
        date = message.get("date")
        class_name = message.get("class_name")
        if not original_text or not date:
            continue
        parsed = parse_change_line(date, class_name or "", original_text)
        normalized.extend(
            to_message(change, index * 100 + part, f"{message.get('id', index)}:{part}")
            for part, change in enumerate(parsed, start=1)
        )
    return normalized


def merge_message_snapshots(fresh_messages, existing_messages, week_start):
    previous = normalize_existing_messages(existing_messages)
    return merge_week_changes(fresh_messages, previous, week_start)


def main():
    print(f"Pobieram komunikaty: {SOURCE}")
    response = requests.get(SOURCE, headers=HEADERS, timeout=30)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or "utf-8"
    date, title, fresh_messages = parse_messages(response.text)
    existing_payload = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {}
    week_start = current_week_start()
    messages = merge_message_snapshots(
        fresh_messages,
        existing_payload.get("messages", []),
        week_start,
    )
    now = datetime.now(ZoneInfo("Europe/Warsaw"))
    payload = {
        "meta": {
            "source": SOURCE,
            "updated_at": now.isoformat(),
            "published_date": date,
            "page_title": title,
            "message_count": len(messages),
            "week_start": week_start.isoformat(),
            "week_end": (week_start + timedelta(days=4)).isoformat(),
            "status": "ok",
        },
        "messages": messages,
    }
    atomic_write(payload)
    print(f"Zapisano {len(messages)} komunikatów dla {date} do {OUTPUT}")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"BŁĄD importu zmian: {exc}", file=sys.stderr)
        raise
