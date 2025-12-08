import React, { useState, useEffect, useRef } from 'react';
import { Car, CreditCard, Clock, Usb, CheckCircle, XCircle, AlertTriangle, AlertCircle, DollarSign } from 'lucide-react';
import { Routes, Route, Link } from "react-router-dom";
import Analytics from "./Analytics.jsx";

// --- IMPORT THE IMAGE DIRECTLY ---
// (Make sure parking_lot_image.png is in the 'src' folder now!)
import parkingBg from './parking_lot_image.png';

// --- CONFIGURATION FOR SPOT POSITIONS ---
// Adjusted: Narrower width to fit inside lines, adjusted height for clean look
const spotLocations = [
  // Top Row
  { id: 101, top: '12%', left: '21%', width: '12%', height: '28%', isLive: true },
  { id: 102, top: '12%', left: '36%', width: '12%', height: '28%', isDummy: true, dummyStatus: false }, 
  { id: 103, top: '12%', left: '51%', width: '12%', height: '28%', isDummy: true, dummyStatus: true }, 
  { id: 104, top: '12%', left: '65.6%', width: '12%', height: '28%', isDummy: true, dummyStatus: false },
  
  // Bottom Row
  { id: 105, top: '63%', left: '21%', width: '12%', height: '28%', isDummy: true, dummyStatus: true },
  { id: 106, top: '63%', left: '36%', width: '12%', height: '28%', isDummy: true, dummyStatus: false },
  { id: 107, top: '63%', left: '51%', width: '12%', height: '28%', isDummy: true, dummyStatus: false },
  { id: 108, top: '63%', left: '65.6%', width: '12%', height: '28%', isDummy: true, dummyStatus: true },
];

// --- SUB-COMPONENT: PARKING OVERLAY ---
const ParkingOverlay = ({ config, isOccupied }) => {
  const style = {
    top: config.top,
    left: config.left,
    width: config.width,
    height: config.height,
  };

  return (
    <div 
      className={`absolute rounded-md border-2 flex flex-col items-center justify-center transition-all duration-500 backdrop-blur-[2px] shadow-sm
        ${isOccupied 
          ? "bg-red-500/40 border-red-500 text-red-100" 
          : "bg-green-500/30 border-green-400 text-green-100 hover:bg-green-500/40"}`}
      style={style}
    >
      {/* Spot ID Label */}
      <div className={`absolute top-1 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold px-1.5 rounded-full
         ${isOccupied ? "bg-red-700/90" : "bg-green-700/90"}`}>
        #{config.id}
      </div>
      
      {/* Live Sensor Indicator */}
      {config.isLive && (
        <div className="absolute -top-1.5 -right-1.5 z-10">
          <span className="relative flex h-3 w-3 sm:h-4 sm:w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-full w-full bg-blue-500 border-2 border-white"></span>
          </span>
        </div>
      )}

      {/* Icon */}
      {isOccupied ? (
        <Car className="h-6 w-6 sm:h-10 sm:w-10 mb-0.5 drop-shadow-md animate-in zoom-in duration-300" />
      ) : (
        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-green-200/50 flex items-center justify-center mb-0.5 bg-green-600/20">
          <span className="text-sm sm:text-lg font-bold">P</span>
        </div>
      )}
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [isOccupied, setIsOccupied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [entryTime, setEntryTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fee, setFee] = useState(0.00);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [processingExit, setProcessingExit] = useState(false);
  
  const HOURLY_RATE = 20.0; 
  
  // Serial Refs
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const isReadingRef = useRef(false);
  const exitTimeoutRef = useRef(null);
  const entryTimeRef = useRef(null);
  const exitingRef = useRef(false); 



  // --- SERIAL CONNECTION LOGIC ---
  const connectToSerial = async () => {
    setErrorMsg(null);
    if (!navigator.serial) { setErrorMsg("Web Serial API not supported. Use Chrome or Edge."); return; }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port; setIsConnected(true); readSerialData(port);
    } catch (error) { console.error(error); setErrorMsg("Connection failed: " + error.message); }
  };

  const disconnectSerial = async () => {
    try { isReadingRef.current = false; if (readerRef.current) await readerRef.current.cancel(); if (portRef.current) await portRef.current.close(); } catch (e) { console.error(e); }
    setIsConnected(false);
  };

  const readSerialData = async (port) => {
    const reader = port.readable.getReader(); readerRef.current = reader; isReadingRef.current = true;
    let buffer = ""; const decoder = new TextDecoder();
    try {
      while (isReadingRef.current) {
        const { value, done } = await reader.read(); if (done) break;
        buffer += decoder.decode(value);
        let start, end;
        while ((start = buffer.indexOf("{")) !== -1 && (end = buffer.indexOf("}", start)) !== -1) {
          const jsonString = buffer.slice(start, end + 1); buffer = buffer.slice(end + 1);
          try { const data = JSON.parse(jsonString); handleSensorUpdate(data.occupied); } catch (e) { console.warn("Invalid JSON", jsonString); }
        }
      }
    } catch (error) { disconnectSerial(); setErrorMsg("Device disconnected."); } finally { reader.releaseLock(); }
  };

  const handleSensorUpdate = (sensorSaysOccupied) => {

  // 🔵 PREVENT EXIT FROM TRIGGERING MULTIPLE TIMES
  if (processingExit) {
    console.log("Ignoring sensor update (exit already processed)");
    return;
  }

  setIsOccupied(prev => {

    // -----------------------------------------------------
    // 🚗 CAR ENTERED
    // -----------------------------------------------------
    if (!prev && sensorSaysOccupied) {
      console.log("CAR ENTERED");

      const now = Date.now();

      // Save to both state + ref (ref = safe logic timing)
      setEntryTime(now);
      entryTimeRef.current = now;

      setPaymentSuccess(false);

      // Clear any leftover exit debounce
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }

      exitingRef.current = false;
    }


    // -----------------------------------------------------
    // 🛑 RAW EXIT DETECTED → DEBOUNCE IT
    // -----------------------------------------------------
    if (prev && !sensorSaysOccupied) {
      console.log("RAW EXIT detected — debouncing…");

      // Prevent multiple exit events from stacking
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }

      exitTimeoutRef.current = setTimeout(() => {

        console.log("EXIT CONFIRMED after debounce");

        // 🔵 Stop any further exit processing for this session
        setProcessingExit(true);

        const exitTime = Date.now();
        const startTime = entryTimeRef.current ?? entryTime ?? exitTime;

        console.log("Start:", startTime, "Exit:", exitTime);

        // SAFETY CHECK — If startTime invalid, ignore
        if (!startTime || isNaN(startTime)) {
          console.warn("⚠️ Invalid start time. Ignoring session.");
          exitingRef.current = false;
          exitTimeoutRef.current = null;
          setProcessingExit(false);
          return;
        }

        const durationSec = (exitTime - startTime) / 1000;
        console.log("Duration:", durationSec, "sec");

        // Ignore micro sessions (sensor flicker)
        if (durationSec < 3) {
          console.warn("⏱️ Session too short (<3s). Ignored.");
          exitingRef.current = false;
          exitTimeoutRef.current = null;
          setProcessingExit(false);
          return;
        }

        // -----------------------------------------------------
        // 💵 CALCULATE FEE
        // -----------------------------------------------------
        const calculatedFee = (durationSec / 3600) * HOURLY_RATE;

        // -----------------------------------------------------
        // 📝 SAVE SESSION
        // -----------------------------------------------------
        const session = {
          start: startTime,
          end: exitTime,
          duration: durationSec,
          fee: calculatedFee
        };

        console.log("📦 Saving session:", session);

        const history = JSON.parse(localStorage.getItem("parkingHistory")) || [];
        history.push(session);
        localStorage.setItem("parkingHistory", JSON.stringify(history));

        // -----------------------------------------------------
        // 💳 SHOW PAYMENT MODAL
        // -----------------------------------------------------
        setShowPayment(true);

        // Cleanup & reset for next session
        exitingRef.current = false;
        exitTimeoutRef.current = null;
        entryTimeRef.current = null;

        // Prevent multiple modal popups
        setIsOccupied(false);

      }, 1500);   // 1.5 second debounce window
    }


    return sensorSaysOccupied;
  });
};



  // --- TIMER & FEE LOGIC ---
  useEffect(() => {
    let interval;
    if (isOccupied && entryTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - entryTime) / 1000);
        setElapsedTime(diffInSeconds);
        setFee(Math.max(0, (diffInSeconds / 3600) * HOURLY_RATE));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOccupied, entryTime]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60); const s = secs % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  const handleManualSimulate = () => {
     if (!isOccupied) { setIsOccupied(true); setEntryTime(Date.now()); setPaymentSuccess(false); } else { setIsOccupied(false); setShowPayment(true); }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-slate-900 font-sans text-slate-200 pb-10">

            {/* HEADER */}
            <div className="bg-slate-950/50 backdrop-blur-md border-b border-white/10 p-4 sticky top-0 z-20">
              <div className="max-w-5xl mx-auto flex justify-between items-center">

                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="font-bold text-xl tracking-tight text-white">
                    SmartPark View
                  </h1>
                </div>

                <div className="flex items-center gap-3">

                  {/* 🔵 NEW — ANALYTICS BUTTON */}
                  <Link
                    to="/analytics"
                    className="px-4 py-2 rounded-lg bg-blue-700 text-white font-bold hover:bg-blue-600 border border-blue-500 transition"
                  >
                    Analytics
                  </Link>

                  {/* CONNECT USB BUTTON */}
                  <button
                    onClick={isConnected ? disconnectSerial : connectToSerial}
                    className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-all border ${
                      isConnected
                        ? "bg-green-600/20 text-green-400 border-green-500/50 hover:bg-green-600/30"
                        : "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {isConnected ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Usb className="h-4 w-4" />
                    )}
                    {isConnected ? "SENSOR CONNECTED" : "CONNECT USB"}
                  </button>

                </div>
              </div>
            </div>



            <div className="max-w-5xl mx-auto p-4 space-y-6 mt-4">

              {/* --- ERROR MESSAGE --- */}
              {errorMsg && (
                <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 flex items-start gap-3 text-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">Connection Issue</h3>
                    <p className="text-xs opacity-80 mt-1">{errorMsg}</p>
                  </div>
                  <button
                    onClick={() => setErrorMsg(null)}
                    className="text-red-400 hover:text-red-200"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* --- MAP AREA --- */}
              <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700/50 bg-slate-800">
                <img
                  src={parkingBg}
                  alt="Parking Lot Layout"
                  className="w-full h-auto block opacity-90 min-h-[300px] object-cover"
                />

                {spotLocations.map(spot => (
                  <ParkingOverlay
                    key={spot.id}
                    config={spot}
                    isOccupied={spot.isLive ? isOccupied : spot.dummyStatus}
                  />
                ))}
              </div>


              {/* --- LIVE STATUS + FEE PANEL --- */}
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* SENSOR STATUS CARD */}
                <div
                  className={`col-span-1 md:col-span-2 rounded-xl border p-4 flex items-center gap-4 transition-colors duration-500 ${
                    isOccupied
                      ? "bg-red-950/30 border-red-900/50"
                      : "bg-green-950/30 border-green-900/50"
                  }`}
                >
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center border-2 ${
                      isOccupied
                        ? "bg-red-900/50 border-red-500 text-red-100"
                        : "bg-green-900/50 border-green-500 text-green-100"
                    }`}
                  >
                    {isOccupied ? (
                      <Car className="h-8 w-8" />
                    ) : (
                      <span className="text-2xl font-bold">P</span>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-bold opacity-60 mb-1 flex items-center gap-2">
                      LIVE SENSOR STATUS (Spot #101)
                      {isOccupied && (
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>

                    <div
                      className={`text-2xl font-black tracking-wide ${
                        isOccupied ? "text-red-100" : "text-green-100"
                      }`}
                    >
                      {isOccupied ? "OCCUPIED" : "AVAILABLE - Ready to park"}
                    </div>
                  </div>
                </div>

                {/* FEE PANEL */}
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-4 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Duration
                    </div>

                    <div
                      className={`font-mono text-xl font-bold ${
                        isOccupied ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {isOccupied ? formatTime(elapsedTime) : "--:--:--"}
                    </div>
                  </div>

                  <div className="border-t border-slate-700/50 my-2"></div>

                  <div className="flex justify-between items-center">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Current Fee
                    </div>

                    <div
                      className={`font-mono text-2xl font-black ${
                        isOccupied ? "text-blue-400" : "text-slate-500"
                      }`}
                    >
                      ${isOccupied ? fee.toFixed(2) : "0.00"}
                    </div>
                  </div>

                  <div className="text-[10px] text-center text-slate-500 mt-2">
                    Rate: ${HOURLY_RATE.toFixed(2)}/hr
                  </div>
                </div>
              </div>


              {/* SIMULATION MODE */}
              {!isConnected && (
                <div className="bg-yellow-950/30 border border-yellow-700/50 rounded-lg p-4 flex items-center justify-between max-w-md mx-auto text-yellow-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                    <div>
                      <h3 className="text-sm font-bold">Simulation Mode</h3>
                      <p className="text-xs opacity-80">
                        Test the live spot (#101) without hardware.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleManualSimulate}
                    className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Toggle #101
                  </button>
                </div>
              )}

            </div> {/* END MAIN CONTENT */}


            {/* PAYMENT MODAL */}
            {showPayment && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
                <div className="bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">

                  {!paymentSuccess ? (
                    <div className="p-6 text-white">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold">Payment Due</h3>
                          <p className="text-slate-400 text-sm">Spot #101</p>
                        </div>

                        <div className="bg-blue-900/50 text-blue-300 border border-blue-700/50 font-bold px-3 py-1 rounded-lg text-lg">
                          ${fee.toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setTimeout(() => {
                            setPaymentSuccess(true);
                            setTimeout(() => {
                              setShowPayment(false);
                              setIsOccupied(false);
                              setEntryTime(null);
                              setElapsedTime(0);
                              setFee(0);
                            }, 2500);
                          }, 1000);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <CreditCard className="h-5 w-5" />
                        Pay Now
                      </button>
                    </div>
                  ) : (
                    <div className="p-10 flex flex-col items-center bg-green-950/30 text-center text-white">
                      <div className="w-20 h-20 bg-green-900/50 rounded-full flex items-center justify-center mb-4 text-green-400 ring-8 ring-green-900/20 border border-green-500/50">
                        <CheckCircle className="h-10 w-10" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Paid!</h3>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div> // END HOME PAGE
        }
      />



      {/* 🔵 NEW — ANALYTICS ROUTE */}
      <Route path="/analytics" element={<Analytics />} />  {/* 🔵 NEW */}

    </Routes>
  );
}