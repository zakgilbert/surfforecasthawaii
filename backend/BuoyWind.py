
    
  
"""Latest NDBC standard meteorological observations for a buoy station."""

import json
import sys
from datetime import datetime

import requests

from cache_config import cache
from util import hawaii_12_hour

FIELD_TOOLTIPS = {
    "WDIR": "Wind Direction (degrees true)",
    "WSPD": "Wind Speed (mph)",
    "GST": "Wind Gust (mph)",
    "PRES": "Atmospheric Pressure (hPa)",
    "ATMP": "Air Temperature (°F)",
    "WTMP": "Water Temperature (°F)",
    "DEWP": "Dew Point (°F)",
    "VIS": "Visibility (nautical miles)",
}


def _measurement(value, field):
    """Convert NDBC missing values and display units."""
    if value == "MM":
        return None

    number = float(value)
    if field in ("WSPD", "GST"):
        return round(number * 2.2369362921, 1)
    if field in ("ATMP", "WTMP", "DEWP"):
        return round(number * 9 / 5 + 32, 1)
    return number


def _fetch_buoy_wind(id):
    """Fetch and parse the latest NDBC observation without requiring Flask."""
    print(f"FETCHING NDBC meteorological data for {id}", file=sys.stderr)
    url = f"https://www.ndbc.noaa.gov/data/realtime2/{id}.txt"

    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
    except requests.RequestException as exc:
        return {"error": f"Unable to retrieve meteorological data: {exc}"}

    lines = response.text.splitlines()
    header = next(
        (line for line in lines if line.startswith("#") and "WDIR" in line.split()),
        None,
    )
    if header is None:
        return {"error": "NDBC meteorological header not found"}

    cols = header.split()
    required = ("#YY", "MM", "DD", "hh", "mm")
    if any(field not in cols for field in required):
        return {"error": "NDBC timestamp fields missing"}

    data_line = next(
        (line for line in lines if line.strip() and not line.lstrip().startswith("#")),
        None,
    )
    if data_line is None:
        return {"error": "No meteorological observations available"}

    row = data_line.split()
    if len(row) != len(cols):
        return {"error": "NDBC observation does not match its header"}

    try:
        report_time = datetime(
            int(row[cols.index("#YY")]),
            int(row[cols.index("MM")]),
            int(row[cols.index("DD")]),
            int(row[cols.index("hh")]),
            int(row[cols.index("mm")]),
        )
        fields = [field for field in FIELD_TOOLTIPS if field in cols]
        values = [_measurement(row[cols.index(field)], field) for field in fields]
    except (ValueError, IndexError) as exc:
        return {"error": f"Invalid meteorological observation: {exc}"}

    return {
        "time": hawaii_12_hour(report_time),
        "cols": [{"value": field, "toolTip": FIELD_TOOLTIPS[field]} for field in fields],
        "rows": [values],
    }


@cache.memoize(timeout=300)
def getBuoyWind(id):
    """Cached Flask API entry point, retaining the existing response format."""
    return _fetch_buoy_wind(id)


if __name__ == "__main__":
    station_id = sys.argv[1] if len(sys.argv) > 1 else "51101"
    # Bypass Flask-Caching when testing directly from the terminal.
    result = _fetch_buoy_wind(station_id)
    print(json.dumps(result, indent=2, ensure_ascii=False))

