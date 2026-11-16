import re
import requests
import sys
import json
from bs4 import BeautifulSoup
from cache_config import cache


def fetch_buoy_coordinates(station_id):
    url = f"https://www.ndbc.noaa.gov/station_page.php?station={station_id}"

    r = requests.get(url, timeout=10)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")
    text = soup.get_text(" ", strip=True)

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*([NS])\s+(\d+(?:\.\d+)?)\s*([EW])",
        text,
    )

    if not match:
        return None

    lat = float(match.group(1))
    lat_dir = match.group(2)
    lon = float(match.group(3))
    lon_dir = match.group(4)

    if lat_dir == "S":
        lat *= -1

    if lon_dir == "W":
        lon *= -1

    return {
        "lat": lat,
        "lon": lon,
    }


@cache.memoize(timeout=8000)
def get_buoy_coordinates(station_id):
    return fetch_buoy_coordinates(station_id)


if __name__ == "__main__":
    station_id = sys.argv[1] if len(sys.argv) > 1 else "51208"

    try:
        coordinates = fetch_buoy_coordinates(station_id)
        print(json.dumps(coordinates, indent=2))
    except requests.RequestException as e:
        print(f"Error fetching buoy {station_id}: {e}", file=sys.stderr)
        sys.exit(1)