import unittest
from datetime import date

from scripts.import_changes import merge_message_snapshots, parse_messages


class ParseMessagesTests(unittest.TestCase):
    def test_retains_structured_replacement_and_original_text(self):
        original_text = "Lekcja 6 – j. angielski p. Wieczorek s. 111"
        html = f"""
        <article id="article-20">
          <div property="text">
            <h3>2026-11-17</h3>
            <p>5D</p>
            <p>{original_text}</p>
          </div>
        </article>
        """

        published_date, _, messages = parse_messages(html)

        self.assertEqual("2026-11-17", published_date)
        self.assertEqual(1, len(messages))
        self.assertEqual("replace", messages[0]["action"])
        self.assertEqual("j. angielski", messages[0]["new_subject"])
        self.assertEqual("Wieczorek", messages[0]["new_teacher"])
        self.assertEqual("111", messages[0]["new_room"])
        self.assertEqual(original_text, messages[0]["raw_text"])
        self.assertEqual([6], messages[0]["lesson_numbers"])

    def test_empty_parse_fails_closed(self):
        with self.assertRaises(RuntimeError):
            parse_messages('<article id="article-20"><h1>Zmiany do planu</h1></article>')


class MessageSnapshotTests(unittest.TestCase):
    def test_migrates_legacy_messages_and_keeps_other_dates_in_week(self):
        existing = [{
            "id": "2026-11-16:4B:1",
            "date": "2026-11-16",
            "class_name": "4B",
            "lesson_numbers": [2],
            "group": "1",
            "raw_text": "Lekcja 2 grupa 1 – p. Wieczorek s. 111",
        }]
        fresh = [{
            "date": "2026-11-17",
            "class_name": "4B",
            "lesson_number": 3,
            "lesson_numbers": [3],
            "group": "",
            "action": "cancel",
            "original_text": "Lekcja 3 – odwołana",
        }]

        merged = merge_message_snapshots(fresh, existing, date(2026, 11, 16))

        self.assertEqual(2, len(merged))
        self.assertEqual("replace", merged[0]["action"])
        self.assertEqual("Wieczorek", merged[0]["new_teacher"])
        self.assertEqual("1", merged[0]["group"])
        self.assertEqual("cancel", merged[1]["action"])


if __name__ == "__main__":
    unittest.main()
