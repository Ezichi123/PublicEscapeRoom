# game_logic.py — README

**Author:** Ezichi Chimezie
**Module:** `gameplay/game_logic.py`
**Project:** Escape Room Platform

---

## What I Built and Why

`game_logic.py` is the core backend logic file I wrote for the Escape Room Platform. It contains all the rules that govern gameplay — validating answers, escalating hints, sequencing puzzles, tracking progress, and handling timed mode.

This file does **not** handle HTTP requests or responses directly. It gets called by `views.py`, which receives requests from the frontend, calls the appropriate functions I wrote here, and sends responses back.

---

## Functions I Wrote

### 1. `start_session(user, challenge)`

I use this to create a new `GameSession` when a user clicks "Play" on a challenge. It records the start time and initializes all counters to zero, then returns the session and the first puzzle to present to the user.

### 2. `check_answer(submitted, puzzle)`

This is the most important function I wrote. It validates the user's submitted answer against the puzzle's correct answer. I built it to support three match types because the functional requirements (FR2.2) specifically asked for it:

- **string** — case-insensitive exact text match
- **regex** — full regex pattern match (the pattern is stored as the correct answer)
- **numeric** — numeric equality, handles both integers and floats

### 3. `get_hint(puzzle, attempt_count)`

This function handles hint escalation (FR2.4). It fetches hints from the database and returns the right one based on how many times the user has failed. The escalation works like this:

- Under 2 failed attempts → no hint shown
- 2–3 failed attempts → level 1 hint (vague)
- 4–5 failed attempts → level 2 hint (more specific)
- 6+ failed attempts → level 3 hint (most detailed)

### 4. `can_reveal_answer(attempt_count)`

Returns `True` if the user has failed enough times (default: 8) to unlock the "Reveal Answer" button, as required by FR2.5.

### 5. `reveal_answer(puzzle, session)`

Returns the correct answer text and marks the puzzle as completed in the session so the user can move on.

### 6. `get_next_puzzle(current_puzzle, submitted_answer)`

This handles puzzle sequencing (FR2.1, FR3.2). I built it to support both flow types:

- **Linear** — always moves to the single designated next puzzle
- **Branching** — routes to a different puzzle depending on the answer given. The branching map is stored as a JSON dictionary on the puzzle (e.g. `{"yes": puzzle_id_4a, "no": puzzle_id_4b}`)

### 7. `update_progress(session, puzzle, correct, hint_used)`

I call this after every single attempt regardless of whether it was correct or not. It increments attempt count, records hint usage, and adds the puzzle to the completed set if the answer was correct.

### 8. `check_completion(session, challenge)`

Returns `True` if the user has completed all puzzles in the challenge.

### 9. `finalize_run(session, challenge)`

I call this when a challenge is fully completed. It records the end time, calculates total duration in seconds, and marks the session as complete. The leaderboard and analytics modules depend on the data this function saves.

### 10. `check_timeout(session, challenge)`

Returns `True` if the user has exceeded the challenge's time limit. I only apply this to challenges with `timed_mode` enabled, as required by FR4.4.

### 11. `handle_timeout(session)`

Marks the session as failed due to timeout. Sets `timed_out = True` and `completed = False`.

---

## How It All Flows Together

Every time a user submits an answer, `views.py` calls my functions in this order:

```
User submits answer (frontend)
        ↓
views.py receives the POST request
        ↓
check_timeout()      → is time up? if yes, end the session immediately
check_answer()       → is the answer right or wrong?
update_progress()    → save the attempt to the database
get_hint()           → should a hint be shown?
can_reveal_answer()  → should the reveal button appear?
get_next_puzzle()    → where does the user go next? (linear or branching)
check_completion()   → is the whole room finished?
finalize_run()       → save final stats if the room is done
        ↓
views.py sends JSON response back to frontend
```

---

## What Needs to Be in Place for My Code to Work

This section is important. My `game_logic.py` does not work in isolation — it depends on other parts of the project being set up correctly. If any of the following are missing or misconfigured, my code will either crash or behave incorrectly. Please read this carefully.

---

### 1. Django Must Be Installed and Configured

My file uses Django's ORM and timezone utilities throughout. For my code to run, Django needs to be installed and the project needs a valid `settings.py` with all our apps registered:

```bash
pip install django
```

```python
# settings.py
INSTALLED_APPS = [
    'users',
    'challenges',
    'gameplay',
    'leaderboard',
]
```

If Django is not installed or these apps are not registered, **nothing in my file works at all.**

---

### 2. The `challenges` and `gameplay` Apps Must Be Built

My file imports models from two apps that need to exist before my code can run:

```python
from challenges.models import Hint, Puzzle
from gameplay.models import GameSession
```

This means:

- Whoever is building the `challenges` app needs to create a `Puzzle` model and a `Hint` model
- The `gameplay` app needs a `GameSession` model
- All models need to be migrated to the database:

```bash
python manage.py makemigrations
python manage.py migrate
```

If those models do not exist yet, every function in my file that touches the database will crash.

---

### 3. The Models Must Have These Exact Fields

This is the most critical thing I need from the rest of the team. My code accesses specific fields on each model by name. If a field is named differently than what I expect, my functions will throw an `AttributeError` and break.

**Please make sure the models are built with exactly these fields:**

**Puzzle model:**
| Field | Type | Description |
|---|---|---|
| `match_type` | CharField | `"string"`, `"regex"`, or `"numeric"` |
| `correct_answer` | CharField | The answer text or regex pattern |
| `flow_type` | CharField | `"linear"` or `"branching"` |
| `next_puzzle` | ForeignKey (self, nullable) | The next puzzle in a linear sequence |
| `branches` | JSONField | `{"answer": puzzle_id}` map for branching |
| `order` | IntegerField | Puzzle sequence number |
| `hints` | Reverse relation | Links to the `Hint` model |

**Hint model:**
| Field | Type | Description |
|---|---|---|
| `text` | TextField | The hint content shown to the user |
| `level` | IntegerField | 1 = vague, 2 = medium, 3 = specific |
| `puzzle` | ForeignKey | Links back to the `Puzzle` model |

**GameSession model:**
| Field | Type | Description |
|---|---|---|
| `user` | ForeignKey | The user playing |
| `challenge` | ForeignKey | The challenge being played |
| `start_time` | DateTimeField | When the session started |
| `end_time` | DateTimeField (nullable) | When the session ended |
| `attempts` | IntegerField | Total answer attempts |
| `hints_used` | IntegerField | Total hints shown |
| `revealed_answers` | IntegerField | Number of answers revealed |
| `completed` | BooleanField | Whether the room was finished |
| `timed_out` | BooleanField | Whether the session timed out |
| `total_time_seconds` | IntegerField | Total duration in seconds |
| `completed_puzzles` | ManyToManyField | Set of completed puzzle IDs |

**EscapeRoom / Challenge model:**
| Field | Type | Description |
|---|---|---|
| `timed_mode` | BooleanField | Whether a time limit is active |
| `time_limit_seconds` | IntegerField | Time limit in seconds |
| `puzzles` | Reverse relation | Links to all `Puzzle` objects in the room |

---

### 4. The Database Must Be Running and Migrated

Any function I wrote that reads or writes data requires a live database connection. The `settings.py` needs a valid `DATABASES` config pointing to a running database.

**SQLite:**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

**PostgreSQL:**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'escaperoom_db',
        'USER': 'your_db_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

If the database is not running or the credentials are wrong, any function that calls `.save()`, `.filter()`, `.get()`, or `.count()` will crash.

---

### 5. The Challenge Builder Must Validate Regex Patterns

For puzzles where a creator sets `match_type = "regex"`, my `check_answer()` function runs:

```python
re.fullmatch(pattern, submitted, re.IGNORECASE)
```

I have error handling in place for broken patterns, but if an invalid regex gets saved to the database, my function will always return `False` for that puzzle — meaning **no user will ever be able to solve it.**

I need whoever is building the Challenge Builder to validate that any regex entered by a creator is a valid pattern before it gets saved to the database.

---

### 6. Logging Must Be Configured in Settings

I added logging throughout my file so we can debug issues during QA. For those logs to actually show up, the project's `settings.py` needs a logging configuration:

```python
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

Without this, my code will not crash — but all debug information will be silently lost, which will make QA much harder for everyone.

---

### 7. `views.py` Must Pass Model Instances, Not IDs

All of my functions expect **actual Django model instances**, not raw IDs or dictionaries. Whoever writes `views.py` needs to perform the database lookup before calling any of my functions:

```python
# This is what views.py MUST do before calling my functions
puzzle = Puzzle.objects.get(id=puzzle_id)    # ✅ correct — model instance
session = GameSession.objects.get(...)        # ✅ correct — model instance

# This will crash my functions
game_logic.check_answer("1776", puzzle_id)   # ❌ wrong — passing an integer
```

---

## Summary of Everything I Need

| What I Need                                      | What Breaks Without It                           |
| ------------------------------------------------ | ------------------------------------------------ |
| Django installed and configured                  | Everything                                       |
| `challenges` and `gameplay` apps built           | All database operations                          |
| Models built with the exact field names I listed | Any function that touches those fields           |
| Database running and migrated                    | Any function that reads or writes data           |
| Challenge Builder to validate regex patterns     | `check_answer()` silently always returns `False` |
| Logging configured in settings                   | No crash, but all debug info is lost             |
| `views.py` to pass model instances, not IDs      | Functions receive the wrong type and crash       |

---

## A Note on Why Some Imports Are Inside the Functions

You may notice that some imports in my file are placed inside the functions rather than at the top:

```python
def get_hint(puzzle, attempt_count):
    from challenges.models import Hint  # inside the function, intentionally
```

This is intentional and is a well known Django pattern. Django models are prone to **circular imports** — where file A imports from file B, which imports back from file A, causing Python to crash on startup before anything runs. By placing these imports inside the functions, they only load at the exact moment the function is called, by which point Django has fully initialized all models and the circular dependency is no longer a problem.

The imports at the very top of my file (`re`, `logging`, `timezone`) are standard Python and Django utilities that carry no risk of circular dependency, so those are safe to keep at the module level.
