const EVENT_NAMES = [
  //"NEW_BLOCK",
  "NEW_TRANSACTION",
  //"NEW_TRANSACTION_OUTPUT",
  //"BLOCK_PARSED",
  //"TRANSACTION_PARSED",
  //"DEBIT",
  //"CREDIT",
  "ENHANCED_SEND",
  "MPMA_SEND",
  "SEND",
  //"ASSET_TRANSFER",
  //"SWEEP",
  //"ASSET_DIVIDEND",
  //"RESET_ISSUANCE",
  "ASSET_CREATION",
  "ASSET_ISSUANCE",
  "ASSET_DESTRUCTION",
  "OPEN_ORDER",
  "ORDER_MATCH",
  "ORDER_UPDATE",
  //"ORDER_FILLED",
  //"ORDER_MATCH_UPDATE",
  //"BTC_PAY",
  "CANCEL_ORDER",
  //"ORDER_EXPIRATION",
  //"ORDER_MATCH_EXPIRATION",
  "OPEN_DISPENSER",
  //"DISPENSER_UPDATE",
  "REFILL_DISPENSER",
  "DISPENSE",
  //"BROADCAST",
  "NEW_FAIRMINTER",
  //"FAIRMINTER_UPDATE",
  "NEW_FAIRMINT",
  "ATTACH_TO_UTXO",
  "DETACH_FROM_UTXO",
  "UTXO_MOVE",
  "BURN",
  //"BET_EXPIRATION",
  //"BET_MATCH",
  //"BET_MATCH_EXPIRATION",
  //"BET_MATCH_RESOLUTON",
  //"BET_MATCH_UPDATE",
  //"BET_UPDATE",
  //"CANCEL_BET",
  //"INCREMENT_TRANSACTION_COUNT",
  //"INVALID_CANCEL",
  //"NEW_ADDRESS_OPTIONS",
  //"OPEN_BET",
  //"OPEN_RPS",
  //"RPS_EXPIRATION",
  //"RPS_MATCH",
  //"RPS_MATCH_EXPIRATION",
  //"RPS_MATCH_UPDATE",
  //"RPS_RESOLVE",
  //"RPS_UPDATE",
  "BITCOIN_TRANSACTIONS"
];

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary Caught an Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('h1', null, 'Algo salió mal.');
    }

    return this.props.children;
  }
}

const dateToTimestamp = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) {
    console.error(`Fecha inválida: ${dateStr}`);
    return 0;
  }
  return Math.floor(date.getTime() / 1000);
};

const aggregateMonth = (dailyData) => {
  const monthlyData = dailyData.reduce((acc, curr) => {
    const date = new Date(curr.time * 1000);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const key = `${year}-${month}`;

    if (!acc[key]) {
      const firstOfMonth = `${year}-${month}-01`;
      acc[key] = { time: dateToTimestamp(firstOfMonth), value: 0 };
    }

    acc[key].value += curr.value;
    return acc;
  }, {});

  return Object.values(monthlyData).sort((a, b) => a.time - b.time);
};

const aggregateYear = (dailyData) => {
  const yearlyData = dailyData.reduce((acc, curr) => {
    const date = new Date(curr.time * 1000);
    const year = date.getFullYear();
    const key = `${year}`;

    if (!acc[key]) {
      const firstOfYear = `${year}-01-01`;
      acc[key] = { time: dateToTimestamp(firstOfYear), value: 0 };
    }

    acc[key].value += curr.value;
    return acc;
  }, {});

  return Object.values(yearlyData).sort((a, b) => a.time - b.time);
};

const fetchApiData = async (eventKey) => {
  try {
    const response = await fetch("/api/v1/blocks/summary");

    if (!response.ok) {
      throw new Error("Api call failed. Cannot retrieve data.");
    }

    const apiData = await response.json();

    return apiData.result.map(item => ({
      time: dateToTimestamp(item.date),
      value: item.events[eventKey] || 0,
    })).filter(item => item.time !== 0);
  } catch (error) {
    console.error("Error al obtener datos de la API:", error);
    return [];
  }
};

function BarChart(props) {
  const { eventKey = "ASSET_ISSUANCE", aggregationLevel = "monthly", height = "800px", width = "100%", rawData, color } = props;
  const { useState, useEffect, useRef, useCallback } = React;

  const [chartData, setChartData] = useState([]);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const processData = useCallback((data) => {
    if (aggregationLevel === "monthly") {
      return aggregateMonth(data);
    } else if (aggregationLevel === "yearly") {
      return aggregateYear(data);
    } else if (aggregationLevel === "daily") {
      return data.sort((a, b) => a.time - b.time);
    } else {
      console.warn(`Nivel de agregación desconocido: ${aggregationLevel}`);
      return data.sort((a, b) => a.time - b.time);
    }
  }, [aggregationLevel]);

  useEffect(() => {
    if (rawData) {
      const processedData = processData(rawData);
      setChartData(processedData);
    }
  }, [rawData, eventKey, aggregationLevel, processData]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (!chartRef.current) {
      chartRef.current = globalThis.LightweightCharts.createChart(chartContainerRef.current, {
        layout: {
          textColor: color,
          background: { type: "solid", color: "black" },
        },
        rightPriceScale: { borderVisible: false },
        grid: {
          vertLines: { color: "rgba(70, 130, 180, 0.3)", style: 1 },
          horzLines: { color: "rgba(70, 130, 180, 0.3)", style: 1 },
        },
      });


      if (typeof chartRef.current.addSeries === "function") {
        seriesRef.current = chartRef.current.addSeries(globalThis.LightweightCharts.HistogramSeries, {
          color: color,
          priceScaleId: "right",
          priceFormat: {
            type: "volume",
          },
        });
      } else {
        console.error("La función addSeries no está disponible en LightweightCharts.");
        return;
      }
    }

    const chart = chartRef.current;
    const series = seriesRef.current;

    if (chartData.length > 0 && series) {
      series.setData(chartData);
      chart.timeScale().fitContent();
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [chartData]);

  return React.createElement("div", {
    ref: chartContainerRef,
    style: { width, height },
  });
}

const getQueryParams = () => {
  const params = new URLSearchParams(globalThis.location.search);
  const eventKey = params.get('eventKey') || "ASSET_ISSUANCE";
  const aggregationLevel = params.get('aggregationLevel') || "monthly";
  const height = params.get('height') || "800px";
  const width = params.get('width') || "100%";
  const color = params.get('color') || "#A0FFA0";

  const validAggregationLevels = ["daily", "monthly", "yearly"];
  const validatedAggregationLevel = validAggregationLevels.includes(aggregationLevel.toLowerCase())
    ? aggregationLevel.toLowerCase()
    : "monthly";

  return { eventKey, aggregationLevel: validatedAggregationLevel, height, width, color };
};

function App() {
  const { useState, useEffect } = React;

  const { eventKey: initialEventKey, aggregationLevel: initialAggregationLevel, height, width, color } = getQueryParams();

  const [eventKey, setEventKey] = useState(initialEventKey);
  const [aggregationLevel, setAggregationLevel] = useState(initialAggregationLevel);
  const [rawData, setRawData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const updateURL = (newEventKey, newAggregationLevel) => {
    const params = new URLSearchParams();
    params.set('eventKey', newEventKey);
    params.set('aggregationLevel', newAggregationLevel);
    if (height) params.set('height', height);
    if (width) params.set('width', width);
    if (color) params.set('color', color);
    const newUrl = `${globalThis.location.pathname}?${params.toString()}`;
    globalThis.history.pushState({}, '', newUrl);
  };


  const handleEventChange = (e) => {
    const selectedEvent = e.target.value;
    setEventKey(selectedEvent);
    updateURL(selectedEvent, aggregationLevel);
  };

  const handleAggregationChange = (level) => {
    setAggregationLevel(level);
    updateURL(eventKey, level);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const data = await fetchApiData(initialEventKey);
        if (isMounted) {
          setRawData(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [initialEventKey]);

  useEffect(() => {
    const onPopState = () => {
      const { eventKey: newEventKey, aggregationLevel: newAggregationLevel } = getQueryParams();
      setEventKey(newEventKey);
      setAggregationLevel(newAggregationLevel);
    };

    globalThis.addEventListener('popstate', onPopState);
    return () => {
      globalThis.removeEventListener('popstate', onPopState);
    };
  }, []);

  const eventSelector = React.createElement(
    'select',
    {
      value: eventKey,
      onChange: handleEventChange,
      style: { color: color, borderColor: color },
      className: 'event-selector'
    },
    EVENT_NAMES.map(eventName =>
      React.createElement('option', { key: eventName, value: eventName }, eventName)
    )
  );

  const aggregationButtons = ['daily', 'monthly', 'yearly'].map(level =>
    React.createElement(
      'button',
      {
        key: level,
        onClick: () => handleAggregationChange(level),
        style: {
          borderColor: color,
          hover: { backgroundColor: color },
          marginRight: '10px',
          padding: '10px 20px',
          fontSize: '16px',
          border: `1px solid ${color}`,
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.3s, color 0.3s',
          backgroundColor: aggregationLevel === level ? color : '#000',
          color: aggregationLevel === level ? '#000' : color,
          textColor: aggregationLevel === level ? '#000' : color
        },
      },
      level.charAt(0).toUpperCase() + level.slice(1)
    )
  );

  const controls = React.createElement(
    'div',
    { className: 'controls-container' },
    React.createElement(
      'label',
      { style: { marginBottom: '10px', fontSize: '18px' } },
      eventSelector
    ),
    React.createElement(
      'div',
      { className: 'aggregation-buttons' },
      aggregationButtons
    )
  );

  if (isLoading) {
    return React.createElement('img', { src: '/static/loader.svg', style: { width: '100px', height: '100px', margin: 'auto', display: 'block', marginTop: "40px", color: color } });
  }

  if (error) {
    return React.createElement('div', { style: { color: 'red', padding: '20px' } }, `Error: ${error.message}`);
  }

  return React.createElement(
    'div',
    { style: { padding: '20px', fontFamily: 'Arial, sans-serif', color: '#fff', backgroundColor: 'black', minHeight: '100vh' } },
    controls,
    React.createElement(BarChart, {
      eventKey,
      aggregationLevel,
      height,
      width,
      rawData,
      color
    })
  );
}


function render() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    React.createElement(ErrorBoundary, null,
      React.createElement(App, null)
    )
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", render);
} else {
  render();
}
