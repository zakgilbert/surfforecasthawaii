import React, { useState, useEffect, useMemo } from "react";
import "./StationInput.css";
import { Segment, Popup, Header, Divider, Message } from "semantic-ui-react";
import { isMobile } from "react-device-detect";
import WaveEnergy from "./WaveEnergy";
import PowerGraph from "./PowerGraph";
import ArrowIndicator from "./ArrowIndicator";
import useBuoyCoordinates from "./BuoyCoordinates";
import BuoyTabs from "./BuoyTabs";
import Power from "./Power";
import { formatDate } from "../utility";

const StationInput = ({ id }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainView, setMainView] = useState("buoy");
  const [chartView, setChartView] = useState("spectrum");

  const buoyCoordinates = useBuoyCoordinates(id);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setData(null);

        const res = await fetch(`/api/report/${id}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Buoy ${id} unavailable (${res.status})`);
        }

        const d = await res.json();

        if (!d?.cols || !Array.isArray(d.rows) || d.rows.length === 0) {
          throw new Error(`No data available for buoy ${id}`);
        }

        if (alive) setData(d);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(`Error loading buoy ${id}:`, err);
        if (alive) setError(err.message || `Failed to load buoy ${id}`);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadData();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [id]);

  const ready = !!(data?.cols && data?.rows?.length);

  const summaryFields = useMemo(() => {
    if (!ready) return [];

    const base = data.cols.slice(1, 7).map((col, idx) => ({
      key: col.toolTip,
      value: data.rows[0][idx + 1],
      isDir: false,
    }));

    const dir =
      data.cols[10] && data.rows[0][10] !== undefined
        ? {
            key: data.cols[10].toolTip,
            value: data.rows[0][10],
            isDir: true,
          }
        : null;

    return dir ? [...base, dir] : base;
  }, [ready, data]);

  if (loading) {
    return (
      <Segment className="station-input-segment">
        <Header as="h4" className="station-input-section-title">
          Loading buoy {id}...
        </Header>
      </Segment>
    );
  }

  if (error) {
    return (
      <Segment className="station-input-segment">
        <Message negative header={`Buoy ${id} unavailable`} content={error} />
      </Segment>
    );
  }

  if (!ready) {
    return (
      <Segment className="station-input-segment">
        <Message
          warning
          header={`Buoy ${id} has no report data`}
          content="This buoy may be offline or temporarily unavailable."
        />
      </Segment>
    );
  }

  const SummarySection = () => (
    <Segment className="station-input-segment station-input-summary-segment">
      <Header as="h4" className="station-input-section-title">
        {formatDate(data.rows[0][0])}
      </Header>

      <div className="station-input-kv-list">
        {summaryFields.map((row, i) => (
          <div key={i} className="station-input-kv-row">
            <div className="station-input-kv-label">{row.key}:</div>
            <div className="station-input-kv-value">
              {row.isDir ? (
                <Popup
                  content={<ArrowIndicator direction={Number(row.value)} />}
                  trigger={<span>{row.value}&deg;</span>}
                  position="top center"
                />
              ) : (
                String(row.value)
              )}
            </div>
          </div>
        ))}
      </div>
    </Segment>
  );

  const mapSrc =
    buoyCoordinates?.lat != null && buoyCoordinates?.lon != null
      ? `https://www.google.com/maps?q=${buoyCoordinates.lat},${buoyCoordinates.lon}&z=6&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(
          `Buoy Station ${id}`,
        )}&output=embed`;

  const buoyMapTooltip = (
    <iframe
      title={`Buoy ${id} Location`}
      className="station-input-map-tooltip-frame"
      src={mapSrc}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );

  const chartContent =
    chartView === "spectrum" ? <WaveEnergy id={id} /> : <Power id={id} />;

  const chartTitle =
    chartView === "spectrum" ? "Wave Energy" : "Wave Energy Over Time";

  const details = (
    <Segment className="station-input-segment station-input-details-panel">
      <Header as="h4" className="station-input-section-title">
        Buoy Details
      </Header>
      <BuoyTabs data={data} />
    </Segment>
  );

  if (isMobile) {
    return (
      <div className="station-input-mobile-wrap">
        <SummarySection />
        <Divider />
        <Segment className="station-input-segment">
          <Header as="h4" className="station-input-section-title">
            Wave Energy
          </Header>
          <WaveEnergy id={id} />
        </Segment>
        <Divider />
        {details}
        <div className="station-input-bottom-spacer" />
      </div>
    );
  }

  return (
    <div className="station-input-desktop-wrap">
      <div className="station-input-card-header">
        <button
          type="button"
          className={`station-input-view-button ${
            mainView === "buoy" ? "active" : ""
          }`}
          onClick={() => setMainView("buoy")}
        >
          Buoy
        </button>

        <button
          type="button"
          className={`station-input-view-button ${
            mainView === "details" ? "active" : ""
          }`}
          onClick={() => setMainView("details")}
        >
          Buoy Details
        </button>
      </div>

      {mainView === "details" ? (
        <div className="station-input-details-full">{details}</div>
      ) : (
        <>
          <div className="station-input-top-layout station-input-top-layout-summary-only">
            <SummarySection />
          </div>

          <div className="station-input-chart-toggle-row">
            <button
              type="button"
              className={`station-input-chart-button ${
                chartView === "spectrum" ? "active" : ""
              }`}
              onClick={() => setChartView("spectrum")}
            >
              Wave Energy
            </button>

            <button
              type="button"
              className={`station-input-chart-button ${
                chartView === "power" ? "active" : ""
              }`}
              onClick={() => setChartView("power")}
            >
              Wave Energy Over Time
            </button>
          </div>

          <Segment className="station-input-segment station-input-chart-panel">
            <Header as="h4" className="station-input-section-title">
              {chartTitle}
            </Header>
            <div className="station-input-chart-fill">{chartContent}</div>
          </Segment>
        </>
      )}
    </div>
  );
};

export default StationInput;
