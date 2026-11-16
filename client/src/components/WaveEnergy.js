import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./WaveEnergy.css";
import { Table } from "semantic-ui-react";
import ArrowIndicator from "./ArrowIndicator";
import { formatDate } from "../utility";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, coordinate, chartRef }) => {
  if (
    !active ||
    !payload ||
    !payload.length ||
    !payload[0]?.payload ||
    !coordinate
  ) {
    return null;
  }

  const rect = chartRef.current?.getBoundingClientRect();

  if (!rect) return null;

  const selectedPoint = payload[0].payload;
  const direction = (selectedPoint.cord1 + selectedPoint.cord2) / 2;

  // Convert chart coordinates to viewport coordinates.
  const x = rect.left + coordinate.x;
  const y = rect.top + coordinate.y;

  return createPortal(
    <div
      className="wave-energy-floating-tooltip"
      style={{
        position: "fixed",
        left: x,
        top: y - 20,
        transform: "translate(-50%, -100%)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <Table celled className="wave-energy-tooltip-table">
        <Table.Body>
          <Table.Row>
            <Table.Cell className="wave-energy-tooltip-label">
              <strong>Swell Direction:</strong>
            </Table.Cell>
            <Table.Cell className="wave-energy-tooltip-value">
              <div className="wave-energy-direction-cell">
                <span>{direction}&deg;</span>
                <ArrowIndicator direction={direction} />
              </div>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell className="wave-energy-tooltip-label">
              <strong>Period:</strong>
            </Table.Cell>
            <Table.Cell className="wave-energy-tooltip-value">
              {(1 / selectedPoint.frequency).toFixed(2)} seconds
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell className="wave-energy-tooltip-label">
              <strong>Energy:</strong>
            </Table.Cell>
            <Table.Cell className="wave-energy-tooltip-value">
              {selectedPoint.energy} m<sup>2</sup>/Hz 
            </Table.Cell>
          </Table.Row>

        </Table.Body>
      </Table>
    </div>,
    document.body,
  );
};

const WaveEnergy = ({ id }) => {
  const [data, setData] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    fetch(`/api/power/${id}`)
      .then((res) => res.json())
      .then((responseData) => {
        setData(Array.isArray(responseData) ? responseData : []);
      })
      .catch(() => {
        setData([]);
      });
  }, [id]);

  const firstPoint = data?.[0];
  const chartData = Array.isArray(firstPoint?.values) ? firstPoint.values : [];

  if (!firstPoint || chartData.length === 0) {
    return null;
  }

  return (
    <div className="wave-energy-container">
      <p className="wave-energy-timestamp">{formatDate(firstPoint.dataTime)}</p>

      <div className="wave-energy-chart-wrap" ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 18,
              left: 12,
              bottom: 28,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="frequency"
              tick={{ fontSize: 11 }}
              label={{
                value: "Frequency (Hz)",
                position: "insideBottom",
                offset: -18,
              }}
            />

            <YAxis
              width={42}
              tick={{ fontSize: 11 }}
              label={{
                value: "m^2/Hz",
                angle: -90,
                position: "insideLeft",
                offset: 0,
              }}
            />

            <Tooltip
              content={<CustomTooltip chartRef={chartRef} />}
              isAnimationActive={false}
              cursor={true}
            />

            <Legend wrapperStyle={{ display: "none" }} />

            <Line
              type="monotone"
              dataKey="energy"
              stroke="#fa1010"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WaveEnergy;
