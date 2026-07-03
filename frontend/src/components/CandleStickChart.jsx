import React, { useMemo } from "react";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { ChartCanvas, Chart } from "react-financial-charts";
import {
  CandlestickSeries,
  LineSeries,
  BarSeries,
} from "react-financial-charts";
import { XAxis, YAxis } from "react-financial-charts";
import {
  CrossHairCursor,
  EdgeIndicator,
  MouseCoordinateX,
  MouseCoordinateY,
} from "react-financial-charts";
import {
  OHLCTooltip,
  SingleValueTooltip,
  MovingAverageTooltip,
} from "react-financial-charts";
import {
  ema,
  discontinuousTimeScaleProviderBuilder,
} from "react-financial-charts";

// Helper to parse ISO date strings
const parseDate = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? null : date; // Return null if date is invalid
};

// --- CandleStickChart Component ---
const CandleStickChart = ({ initialData, type = "svg", width, height }) => {
  // Log received props immediately
  console.log(
    `CandleStickChart Render - Received Props: width=${width}, height=${height}, initialData length=${initialData?.length}`
  );

  // 1. Process Raw Data (Memoized)
  const processedData = useMemo(() => {
    if (
      !initialData ||
      !Array.isArray(initialData) ||
      initialData.length === 0
    ) {
      // console.log("Initial data is invalid or empty."); // Keep console less noisy unless debugging data flow
      return [];
    }
    return initialData
      .map((d) => {
        const date = parseDate(d.date);
        const open = d.open !== null ? +d.open : NaN;
        const high = d.high !== null ? +d.high : NaN;
        const low = d.low !== null ? +d.low : NaN;
        const close = d.close !== null ? +d.close : NaN;
        const volume = d.volume !== null ? +d.volume : NaN;
        if (
          !date ||
          isNaN(open) ||
          isNaN(high) ||
          isNaN(low) ||
          isNaN(close) ||
          isNaN(volume)
        ) {
          // console.warn("Invalid data point found:", d); // Optional logging
          return null;
        }
        return { date, open, high, low, close, volume };
      })
      .filter((d) => d !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [initialData]);

  // 2. Calculate Indicators (Memoized)
  const ema20 = useMemo(
    () =>
      ema()
        .options({ windowSize: 20 })
        .merge((d, c) => {
          d.ema20 = c;
        })
        .accessor((d) => d?.ema20),
    []
  );
  const ema50 = useMemo(
    () =>
      ema()
        .options({ windowSize: 50 })
        .merge((d, c) => {
          d.ema50 = c;
        })
        .accessor((d) => d?.ema50),
    []
  );

  const calculatedData = useMemo(() => {
    // Need at least 50 points for ema50 calculation
    if (!processedData || processedData.length < 50) {
      return processedData;
    }
    try {
      // Important: Apply indicators sequentially
      const dataWithEma20 = ema20(processedData);
      return ema50(dataWithEma20);
    } catch (error) {
      console.error("Error applying indicators:", error);
      return processedData; // Fallback to data without indicators
    }
  }, [processedData, ema20, ema50]);

  // 3. Prepare Scale and Final Data (Memoized with Error Handling)
  const {
    chartData,
    xScale,
    displayXAccessor,
    finalDisplayXAccessor,
    finalXExtents,
  } = useMemo(() => {
    // Define a default empty state to return on failure
    const emptyState = {
      chartData: [],
      xScale: undefined,
      displayXAccessor: undefined,
      finalDisplayXAccessor: undefined,
      finalXExtents: undefined,
    };

    try {
      // console.log(`Scale Memo Triggered - W: ${width}, H: ${height}, Calc Data Length: ${calculatedData?.length}`);

      // Check prerequisites
      if (!width || !height) {
        // console.log("Scale Memo: No dimensions yet.");
        return emptyState;
      }
      if (!calculatedData || calculatedData.length === 0) {
        // console.log("Scale Memo: No calculated data.");
        return emptyState;
      }

      const xAccessor = (d) => d?.date; // Access date safely
      const xScaleProvider =
        discontinuousTimeScaleProviderBuilder().inputDateAccessor(xAccessor);

      // Call the provider and destructure its results
      const {
        data: providerChartData,
        xScale: providerXScale,
        xAccessor: providerDisplayXAccessor, // Note: Library might call this 'xAccessor' internally
        displayXAccessor: providerFinalDisplayXAccessor, // Note: Library might call this 'displayXAccessor'
      } = xScaleProvider(calculatedData);

      // **CRITICAL CHECKS**
      if (!providerXScale) {
        console.error(
          "Scale Memo Error: xScaleProvider did not return a valid xScale."
        );
        return emptyState;
      }
      if (!providerChartData || providerChartData.length === 0) {
        console.warn(
          "Scale Memo Warning: xScaleProvider filtered out all data points."
        );
        // Decide: Return empty state OR proceed with empty data but valid scale?
        // Let's proceed for now, the final render check will catch empty data.
        // If errors persist related to empty data later, return emptyState here.
        // return emptyState;
      }
      if (!providerDisplayXAccessor || !providerFinalDisplayXAccessor) {
        console.error(
          "Scale Memo Error: xScaleProvider did not return valid accessors."
        );
        return emptyState;
      }

      // --- Calculate Initial Visible Extents ---
      let extents = undefined;
      // Ensure we have data AND the accessor needed before calculating extents
      if (providerChartData && providerChartData.length > 0) {
        const lastIndex = providerChartData.length - 1;
        const startIndex = Math.max(0, lastIndex - 150); // Show ~150 points

        // Check if data points at indices exist before accessing
        const startItem = providerChartData[startIndex];
        const endItem = providerChartData[lastIndex];

        if (startItem && endItem) {
          const startAccessorValue = providerFinalDisplayXAccessor(startItem);
          const endAccessorValue = providerFinalDisplayXAccessor(endItem);

          // Ensure accessor values are valid (not undefined, could be 0)
          if (
            startAccessorValue !== undefined &&
            endAccessorValue !== undefined
          ) {
            extents = [startAccessorValue, endAccessorValue];
          } else {
            console.warn(
              "Scale Memo Warning: Could not calculate valid start/end extent values."
            );
          }
        } else {
          console.warn(
            "Scale Memo Warning: Start or end index out of bounds for extent calculation."
          );
        }
      }
      // --- End Extent Calculation ---

      // console.log("Scale Memo: Success.");
      // Return the full structured data needed for ChartCanvas
      return {
        chartData: providerChartData || [], // Ensure chartData is always an array
        xScale: providerXScale,
        displayXAccessor: providerDisplayXAccessor,
        finalDisplayXAccessor: providerFinalDisplayXAccessor,
        finalXExtents: extents, // Can be undefined, library should handle
      };
    } catch (error) {
      console.error("Error within scale calculation useMemo:", error);
      return emptyState; // Return empty state on any unexpected error
    }
  }, [calculatedData, width, height]); // Dependencies: re-run if data or dimensions change

  // Log results immediately after the memo hook
  console.log("CandleStickChart - After Scale Memo:", {
    chartDataLength: chartData?.length,
    hasXScale: !!xScale,
    // displayXAccessorType: typeof displayXAccessor,
    // finalDisplayXAccessorType: typeof finalDisplayXAccessor,
    finalXExtentsValue: finalXExtents, // See if extents were calculated
  });

  // 4. Final Render Logic Check
  if (
    !width ||
    !height ||
    !chartData ||
    chartData.length === 0 ||
    !xScale ||
    !displayXAccessor ||
    !finalDisplayXAccessor
  ) {
    // Log exactly which condition failed
    console.error("CandleStickChart - Render Check FAILED:", {
      width: !!width,
      height: !!height,
      chartDataValid: !!chartData && chartData.length > 0,
      hasXScale: !!xScale,
      hasDisplayXAccessor: !!displayXAccessor,
      hasFinalDisplayXAccessor: !!finalDisplayXAccessor,
    });
    return (
      <div className="h-full flex justify-center items-center text-gray-500">
        Preparing chart... (Check console for failure reason)
      </div>
    );
  }

  // If it passed the check, log success before rendering the chart
  console.log(
    "CandleStickChart - Render Check PASSED. Rendering ChartCanvas..."
  );

  // --- Chart Dimensions and Layout (Calculate after checks pass) ---
  const ratio = width / height;
  const margin = { left: 10, right: 70, top: 20, bottom: 30 };
  const volumeChartHeight = 150;
  const mainChartHeight = Math.max(
    50,
    height - margin.top - margin.bottom - volumeChartHeight - 50
  ); // Min height 50px

  // Determine if EMAs were calculated and can be shown
  const showIndicators =
    calculatedData !== processedData && calculatedData.length >= 50;

  // --- Return JSX ---
  return (
    <ChartCanvas
      height={height}
      ratio={ratio}
      width={width}
      margin={margin}
      type={type}
      seriesName={initialData?.[0]?.symbol || "ChartData"}
      data={chartData} // Use the final data from memo
      xScale={xScale} // Use the scale from memo
      xAccessor={displayXAccessor} // Use the accessor from memo
      displayXAccessor={finalDisplayXAccessor} // Use the display accessor from memo
      xExtents={finalXExtents} // Use the calculated initial extents (can be undefined)
      zoomEvent={true}
      panEvent={true}
      clamp={false} // Allow panning slightly beyond data
    >
      {/* Main Price Chart */}
      <Chart
        id={1}
        height={mainChartHeight}
        yExtents={[
          (d) => [d?.high, d?.low], // Optional chaining for safety
          showIndicators ? ema20.accessor() : undefined,
          showIndicators ? ema50.accessor() : undefined,
        ].filter(Boolean)} // Filter out undefined accessors
        origin={(w, h) => [0, 0]} // Position at top-left within margin
        padding={{ top: 10, bottom: 20 }}
      >
        <XAxis
          axisAt="bottom"
          orient="bottom"
          showTicks={false}
          strokeStyle="#CCCCCC"
          tickStrokeStyle="#CCCCCC"
        />
        <YAxis
          axisAt="right"
          orient="right"
          ticks={5}
          strokeStyle="#CCCCCC"
          tickStrokeStyle="#CCCCCC"
        />
        <MouseCoordinateY
          at="right"
          orient="right"
          displayFormat={format(".2f")}
        />

        <CandlestickSeries
          wickStroke={(d) => (d.close > d.open ? "#26a69a" : "#ef5350")}
          fill={(d) => (d.close > d.open ? "#26a69a" : "#ef5350")}
          stroke="none"
          opacity={1}
        />

        {/* Conditional EMA Rendering */}
        {showIndicators && (
          <>
            <LineSeries
              yAccessor={ema20.accessor()}
              stroke="#ff7f0e"
              strokeWidth={1.5}
            />
            <LineSeries
              yAccessor={ema50.accessor()}
              stroke="#d62728"
              strokeWidth={1.5}
            />
            <EdgeIndicator
              itemType="last"
              orient="right"
              edgeAt="right"
              yAccessor={ema20.accessor()}
              fill="#ff7f0e"
              displayFormat={format(".2f")}
              textFill="#000000"
            />
            <EdgeIndicator
              itemType="last"
              orient="right"
              edgeAt="right"
              yAccessor={ema50.accessor()}
              fill="#d62728"
              displayFormat={format(".2f")}
              textFill="#000000"
            />
            <MovingAverageTooltip
              origin={[-40, 15]}
              options={[
                {
                  yAccessor: ema20.accessor(),
                  type: "EMA",
                  stroke: "#ff7f0e",
                  windowSize: 20,
                },
                {
                  yAccessor: ema50.accessor(),
                  type: "EMA",
                  stroke: "#d62728",
                  windowSize: 50,
                },
              ]}
            />
          </>
        )}

        <EdgeIndicator
          itemType="last"
          orient="right"
          edgeAt="right"
          yAccessor={(d) => d?.close}
          fill={(d) => (d.close > d.open ? "#26a69a" : "#ef5350")}
          displayFormat={format(".2f")}
        />
        <OHLCTooltip origin={[-40, 0]} textFill="#FFFFFF" />
      </Chart>

      {/* Volume Chart */}
      <Chart
        id={2}
        yExtents={(d) => d?.volume} // Safe access
        height={volumeChartHeight}
        origin={(w, h) => [0, h - volumeChartHeight - margin.bottom]} // Position below main chart
        padding={{ top: 10, bottom: 10 }}
      >
        <XAxis
          axisAt="bottom"
          orient="bottom"
          ticks={Math.max(2, Math.floor(width / 100))}
          strokeStyle="#CCCCCC"
          tickStrokeStyle="#CCCCCC"
          tickFormat={timeFormat("%Y-%m-%d")}
        />
        <YAxis
          axisAt="right"
          orient="right"
          ticks={4}
          tickFormat={format(".2s")}
          strokeStyle="#CCCCCC"
          tickStrokeStyle="#CCCCCC"
        />
        <MouseCoordinateY
          at="right"
          orient="right"
          displayFormat={format(".4s")}
        />
        <BarSeries
          yAccessor={(d) => d?.volume}
          fill={(d) =>
            d.close > d.open
              ? "rgba(38, 166, 154, 0.6)"
              : "rgba(239, 83, 80, 0.6)"
          }
          opacity={0.6}
          widthRatio={0.8}
        />
        <SingleValueTooltip
          yAccessor={(d) => d?.volume}
          yLabel="Volume"
          yDisplayFormat={format(".0s")}
          origin={[-40, 5]}
          textFill="#FFFFFF"
        />
      </Chart>

      {/* Crosshair and Mouse X Coordinate */}
      <CrossHairCursor strokeDasharray="ShortDash" stroke="#FFFFFF" />
      <MouseCoordinateX
        at="bottom" // Position relative to bottom axis
        orient="bottom"
        displayFormat={timeFormat("%Y-%m-%d %H:%M")} // Detailed format
        rectRadius={5}
        // No explicit 'y' prop - let the library position it based on 'at'/'orient'
      />
    </ChartCanvas>
  );
};

export default CandleStickChart;