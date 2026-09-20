import csv
import io
import json
import os
import zipfile
import hashlib
from collections import Counter, defaultdict
from datetime import datetime


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS = os.path.join(os.path.expanduser("~"), "Downloads")
OUTPUT = os.path.join(ROOT, "src", "data", "receipts.js")


def read_zip_csv(zip_name, file_name):
    with zipfile.ZipFile(os.path.join(DOWNLOADS, zip_name)) as archive:
        with archive.open(file_name) as source:
            return list(csv.DictReader(io.TextIOWrapper(source, encoding="utf-8-sig", errors="replace")))


def find_csv(zip_name, suffix):
    with zipfile.ZipFile(os.path.join(DOWNLOADS, zip_name)) as archive:
        return next(name for name in archive.namelist() if name.lower().endswith(suffix.lower()))


def parse_datetime(value):
    for pattern in ("%Y-%m-%d %H:%M:%S", "%m/%d/%Y %H:%M", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y"):
        try:
            return datetime.strptime(value.strip(), pattern)
        except (ValueError, AttributeError):
            continue
    return None


def clean(value, fallback="Unknown"):
    value = (value or "").strip()
    return value or fallback


def amount(value):
    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return 0


def india_transaction_key(row):
    transaction_id = clean(row.get("trans_id"), "")
    if transaction_id:
        return f"trans_id:{transaction_id}"
    fallback_fields = (
        row.get("trans_date_trans_time"), row.get("merchant"), row.get("category"),
        row.get("amt"), row.get("city"), row.get("state"), row.get("is_fraud"),
    )
    fallback = "|".join(clean(value, "") for value in fallback_fields)
    return f"fallback:{hashlib.sha256(fallback.encode('utf-8')).hexdigest()}"


def deduplicate_india(rows):
    unique_rows = {}
    for row in rows:
        key = india_transaction_key(row)
        if key not in unique_rows:
            unique_rows[key] = row
    return list(unique_rows.values())


def make_receipt(category, title, when, description, detail, tags, **extra):
    return {
        "category": category,
        "title": title[:100],
        "date": when.strftime("%Y-%m-%d"),
        "time": when.strftime("%H:%M"),
        "description": description[:180],
        "detail": detail[:300],
        "tags": tags[:4],
        **extra,
    }


def choose_music(rows):
    artists = Counter(clean(row.get("artist_name")) for row in rows)
    tracks = Counter(clean(row.get("track_name")) for row in rows)
    selected = []
    seen_tracks = Counter()
    seen_artists = Counter()
    ranked = sorted(rows, key=lambda row: parse_datetime(row.get("ts", "")) or datetime.min)
    for row in ranked:
        artist = clean(row.get("artist_name"))
        track = clean(row.get("track_name"))
        if tracks[track] < 3 and artists[artist] < 3:
            continue
        if seen_tracks[track] >= 3 or seen_artists[artist] >= 8:
            continue
        when = parse_datetime(row.get("ts", ""))
        if not when:
            continue
        minutes = round(amount(row.get("ms_played")) / 60000, 1)
        skipped = clean(row.get("skipped"), "false").lower() == "true"
        selected.append(make_receipt(
            "Music", track, when,
            f"{artist} / {clean(row.get('album_name'))}",
            f"{clean(row.get('album_name'))} on {clean(row.get('platform'))}; {minutes} minutes played.",
            ["listening", artist.lower().replace(" ", "-")],
            location=clean(row.get("platform")), artist=artist, album=clean(row.get("album_name")),
            durationMinutes=minutes, skipped=skipped, source="Spotify history",
        ))
        seen_tracks[track] += 1
        seen_artists[artist] += 1
        if len(selected) >= 120:
            break
    return selected


def choose_household(rows):
    selected = []
    category_counts = Counter(clean(row.get("Category")) for row in rows)
    seen = Counter()
    ranked = sorted(rows, key=lambda row: parse_datetime(row.get("Date", "")) or datetime.min)
    for row in ranked:
        category = clean(row.get("Category"))
        subcategory = clean(row.get("Subcategory"))
        if category_counts[category] < 3 or seen[category] >= 28:
            continue
        when = parse_datetime(row.get("Date", ""))
        if not when:
            continue
        note = clean(row.get("Note"), subcategory)
        value = amount(row.get("Amount"))
        selected.append(make_receipt(
            "Purchases", subcategory if subcategory != "Unknown" else category, when,
            f"{category} / {note}",
            f"{clean(row.get('Income/Expense'))} through {clean(row.get('Mode'))}; {note}.",
            ["household", category.lower(), subcategory.lower()],
            location=clean(row.get("Mode")), amount=value, currency=clean(row.get("Currency")),
            spendingCategory=category, subcategory=subcategory, source="Household transactions",
        ))
        seen[category] += 1
        if len(selected) >= 100:
            break
    return selected


def choose_india(rows):
    selected = []
    unique_rows = deduplicate_india(rows)
    category_counts = Counter(clean(row.get("category")) for row in unique_rows)
    merchant_counts = Counter(clean(row.get("merchant"), "Unlisted merchant") for row in unique_rows)
    seen = Counter()
    ranked = sorted(unique_rows, key=lambda row: parse_datetime(row.get("trans_date_trans_time", "")) or datetime.min)
    for row in ranked:
        category = clean(row.get("category"))
        merchant = clean(row.get("merchant"), "Unlisted merchant")
        if category_counts[category] < 3 or (merchant_counts[merchant] < 3 and not row.get("merchant")):
            continue
        if seen[category] >= 30:
            continue
        when = parse_datetime(row.get("trans_date_trans_time", ""))
        if not when:
            continue
        city = clean(row.get("city"), "Unspecified city")
        state = clean(row.get("state"), "Unspecified state")
        selected.append(make_receipt(
            "Purchases", merchant if merchant != "Unlisted merchant" else category, when,
            f"{category} transaction in {city}",
            f"{category} purchase recorded in {city}, {state}.",
            ["transaction", category.lower(), state.lower()],
            location=f"{city}, {state}", amount=amount(row.get("amt")), currency="INR",
            spendingCategory=category, merchant=merchant, fraudStatus=clean(row.get("is_fraud"), "unknown"),
            source="India transactions", sourceId=clean(row.get("trans_id"), india_transaction_key(row)),
        ))
        seen[category] += 1
        if len(selected) >= 120:
            break
    return selected


def build_insights(music_rows, household_rows, india_rows):
    artists = Counter(clean(row.get("artist_name")) for row in music_rows)
    tracks = Counter(clean(row.get("track_name")) for row in music_rows)
    spend_categories = Counter(clean(row.get("Category")) for row in household_rows)
    unique_india_rows = deduplicate_india(india_rows)
    spend_categories.update(clean(row.get("category")) for row in unique_india_rows)
    merchants = Counter(clean(row.get("merchant"), "Unlisted merchant") for row in unique_india_rows if row.get("merchant"))
    total_minutes = round(sum(amount(row.get("ms_played")) for row in music_rows) / 60000)
    return {
        "mostListenedArtist": {"value": artists.most_common(1)[0][0], "count": artists.most_common(1)[0][1]},
        "mostPlayedTrack": {"value": tracks.most_common(1)[0][0], "count": tracks.most_common(1)[0][1]},
        "totalListeningMinutes": total_minutes,
        "commonSpendingCategory": {"value": spend_categories.most_common(1)[0][0], "count": spend_categories.most_common(1)[0][1]},
        "recurringMerchant": {"value": merchants.most_common(1)[0][0], "count": merchants.most_common(1)[0][1]},
    }


def build_activity(receipts):
    by_month = Counter(f"{receipt['date'][:7]}-01" for receipt in receipts)
    months = sorted(by_month.items())
    selected = months[-10:] if len(months) > 10 else months
    return [{"day": datetime.strptime(month, "%Y-%m-%d").strftime("%b %Y"), "receipts": count} for month, count in selected]


def main():
    music_rows = read_zip_csv("archive.zip", find_csv("archive.zip", "spotify_history.csv"))
    household_rows = read_zip_csv("archive (1).zip", find_csv("archive (1).zip", "Daily Household Transactions.csv"))
    india_rows = read_zip_csv("archive (2).zip", find_csv("archive (2).zip", "Augmented_IndiaTransactMultiFacet2024.csv"))
    receipts = choose_music(music_rows) + choose_household(household_rows) + choose_india(india_rows)
    receipts.sort(key=lambda receipt: (receipt["date"], receipt["time"]), reverse=True)
    for index, receipt in enumerate(receipts, 1):
        receipt["id"] = index
    output = "// Generated by scripts/process-datasets.py. Do not edit by hand.\n"
    output += f"export const receipts = {json.dumps(receipts, ensure_ascii=True, indent=2)}\n\n"
    output += f"export const activityData = {json.dumps(build_activity(receipts), ensure_ascii=True, indent=2)}\n\n"
    output += f"export const insights = {json.dumps(build_insights(music_rows, household_rows, india_rows), ensure_ascii=True, indent=2)}\n\n"
    output += "export const categories = ['All', 'Music', 'Purchases']\n"
    with open(OUTPUT, "w", encoding="utf-8", newline="\n") as target:
        target.write(output)
    print(f"Generated {len(receipts)} receipts at {OUTPUT}")


if __name__ == "__main__":
    main()