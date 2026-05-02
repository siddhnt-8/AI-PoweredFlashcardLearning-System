"""
services/scheduler.py — SM-2 spaced repetition algorithm.

Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method

Public API:
  apply_sm2(ease_factor, interval, repetitions, quality) -> dict
"""

from datetime import datetime, timedelta, timezone

from config import settings


# ---------------------------------------------------------------------------
# SM-2 Algorithm
# ---------------------------------------------------------------------------
def apply_sm2(
    ease_factor: float,
    interval:    int,
    repetitions: int,
    quality:     int,
) -> dict:
    """
    Apply one iteration of the SM-2 spaced repetition algorithm.

    Quality scale (0–5):
      0 — complete blackout
      1 — incorrect; remembered on seeing answer
      2 — incorrect; easy to recall
      3 — correct with serious difficulty
      4 — correct after hesitation
      5 — perfect recall

    Args:
        ease_factor:  Current ease factor (≥ 1.3, typically starts at 2.5).
        interval:     Current interval in days.
        repetitions:  Number of consecutive correct reviews so far.
        quality:      User's quality rating (0–5).

    Returns:
        Dict with updated: ease_factor, interval, repetitions, due_date.
    """
    # ------------------------------------------------------------------
    # 1. Update ease factor
    #    EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    # ------------------------------------------------------------------
    new_ease = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    # Clamp ease factor to minimum allowed value
    new_ease = max(new_ease, settings.sr_min_ease_factor)
    new_ease = round(new_ease, 4)

    # ------------------------------------------------------------------
    # 2. Update interval and repetitions
    #    - quality < 3 → reset (card was answered incorrectly)
    #    - quality ≥ 3 → advance the schedule
    # ------------------------------------------------------------------
    if quality < 3:
        # Reset: show again soon
        new_repetitions = 0
        new_interval    = 1
    else:
        # Advance
        new_repetitions = repetitions + 1

        if new_repetitions == 1:
            new_interval = settings.sr_initial_interval        # default: 1 day
        elif new_repetitions == 2:
            new_interval = 6                                   # SM-2 standard
        else:
            # I(n) = I(n-1) * EF
            new_interval = round(interval * new_ease)

    # ------------------------------------------------------------------
    # 3. Calculate next due date
    # ------------------------------------------------------------------
    due_date = datetime.now(timezone.utc) + timedelta(days=new_interval)

    return {
        "ease_factor":  new_ease,
        "interval":     new_interval,
        "repetitions":  new_repetitions,
        "due_date":     due_date,
    }


# ---------------------------------------------------------------------------
# Utility: human-readable next review label
# ---------------------------------------------------------------------------
def due_label(due_date: datetime) -> str:
    """
    Convert a due_date into a human-readable string for the frontend.

    Examples:
      "Due now"
      "Due in 1 day"
      "Due in 6 days"
      "Due in 3 weeks"
    """
    now  = datetime.now(timezone.utc)
    diff = due_date - now

    days = diff.days

    if days < 0:
        return "Overdue"
    if days == 0:
        return "Due today"
    if days == 1:
        return "Due in 1 day"
    if days < 14:
        return f"Due in {days} days"
    if days < 60:
        weeks = days // 7
        return f"Due in {weeks} week{'s' if weeks > 1 else ''}"

    months = days // 30
    return f"Due in {months} month{'s' if months > 1 else ''}"