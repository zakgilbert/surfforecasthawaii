import { useEffect, useState } from "react";

const useBuoyCoordinates = (id) => {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchCoords = async () => {
      try {
        const res = await fetch(`/api/buoy-coordinates/${id}`, {
          signal: controller.signal,
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data?.lat != null && data?.lon != null) {
          setCoords(data);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("coords error:", err);
        }
      }
    };

    fetchCoords();

    return () => controller.abort();
  }, [id]);
  return coords;
};

export default useBuoyCoordinates;