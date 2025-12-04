import React, { useState, useEffect, useRef } from 'react';
import { Car, CreditCard, Clock, MapPin, AlertCircle, Usb, DollarSign, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function App() {
  const [isOccupied, setIsOccupied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [entryTime, setEntryTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fee, setFee] = useState(0.00);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Settings
  const HOURLY_RATE = 2.50; 
  
  // Refs for Serial Connection to persist across renders
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const isReadingRef = useRef(false);

  // -------------------------------------------------------------------
  //  CONNECT TO SERIAL
  // -------------------------------------------------------------------
  const connectToSerial = async () => {
    setErrorMsg(null);

    if (!navigator.serial) {
      setErrorMsg("Web Serial API not supported in this browser. Use Chrome or Edge.");
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      portRef.current = port;
      setIsConnected(true);

      readSerialData(port);

    } catch (error) {
      console.error("Connection failed:", error);

      if (error.name === "SecurityError") {
        setErrorMsg("USB Access Blocked: Browser environment restricted. Download & run locally.");
      } else if (error.name !== "NotFoundError") {
        setErrorMsg("Connection Error: " + error.message);
      }
    }
  };

  const disconnectSerial = async () => {
    try {
      if (readerRef.current) await readerRef.current.cancel();
      if (portRef.current) await portRef.current.close();
    } catch (e) {
      console.error("Error closing port:", e);
    }
    setIsConnected(false);
    isReadingRef.current = false;
  };

  // -------------------------------------------------------------------
  //  **WORKING SERIAL READER** (your working logic integrated!)
  // -------------------------------------------------------------------
  const readSerialData = async (port) => {
    const reader = port.readable.getReader();
    readerRef.current = reader;
    isReadingRef.current = true;

    let buffer = "";
    const decoder = new TextDecoder();

    try {
      while (isReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        const text = decoder.decode(value);
        buffer += text;

        let start, end;

        // Process full JSON objects
        while (
          (start = buffer.indexOf("{")) !== -1 &&
          (end = buffer.indexOf("}", start)) !== -1
        ) {
          const jsonString = buffer.slice(start, end + 1);
          buffer = buffer.slice(end + 1);

          try {
            const data = JSON.parse(jsonString);
            handleSensorUpdate(data.occupied);
          } catch (e) {
            console.warn("Invalid JSON received:", jsonString);
          }
        }
      }
    } catch (error) {
      console.error("Read error:", error);
      disconnectSerial();
      setErrorMsg("Device disconnected unexpectedly.");
    } finally {
      reader.releaseLock();
    }
  };

  // -------------------------------------------------------------------
  //  HANDLE SENSOR UPDATE FROM ESP32
  // -------------------------------------------------------------------
  const handleSensorUpdate = (sensorSaysOccupied) => {
    setIsOccupied(prev => {
      if (prev !== sensorSaysOccupied) {
        if (sensorSaysOccupied) {
          setEntryTime(Date.now());
          setPaymentSuccess(false);
        } else {
          setShowPayment(true);
        }
      }
      return sensorSaysOccupied;
    });
  };

  // -------------------------------------------------------------------
  //  TIMER / FEE LOGIC
  // -------------------------------------------------------------------
  useEffect(() => {
    let interval;
    if (isOccupied && entryTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - entryTime) / 1000);
        setElapsedTime(diff);

        const currentFee = (diff / 60) * HOURLY_RATE;
        setFee(Math.max(0, currentFee));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOccupied, entryTime]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  const handleManualSimulate = () => {
    if (!isOccupied) {
      setIsOccupied(true);
      setEntryTime(Date.now());
      setPaymentSuccess(false);
    } else {
      setIsOccupied(false);
      setShowPayment(true);
    }
  };

  // -------------------------------------------------------------------
  //  UI RENDER
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">

          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-blue-400" />
            <h1 className="font-bold text-lg tracking-tight">SmartPark</h1>
          </div>

          <button 
            onClick={isConnected ? disconnectSerial : connectToSerial}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              isConnected ? "bg-green-500/20 text-green-400 border border-green-500/50" :
                            "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            {isConnected ? <CheckCircle className="h-3 w-3" /> : <Usb className="h-3 w-3" />}
            {isConnected ? "CONNECTED" : "CONNECT SENSOR"}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-800">Connection Issue</h3>
              <p className="text-xs text-red-700 mt-1">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Status Display */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative">

          <div className={`h-3 w-full ${isOccupied ? "bg-red-500" : "bg-green-500"} transition-colors duration-500`} />

          <div className="p-8 flex flex-col items-center min-h-[220px]">
            <div className={`relative w-48 h-64 border-4 border-dashed rounded-xl flex items-center justify-center
               ${isOccupied ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"} transition-all duration-500`}>
              
              <div className="absolute top-3 font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">
                Spot #101
              </div>

              {isOccupied ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                  <Car className="h-28 w-28 text-red-500 drop-shadow-lg mb-3" />
                  <span className="font-extrabold text-red-600 tracking-wider">OCCUPIED</span>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-60">
                  <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <span className="text-4xl font-bold text-green-500">P</span>
                  </div>
                  <span className="font-bold text-green-600 tracking-wider">AVAILABLE</span>
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50">
            <div className="p-4 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Duration</span>
              <div className={`font-mono text-xl font-bold flex items-center gap-2 ${
                isOccupied ? "text-slate-800" : "text-slate-300"
              }`}>
                <Clock className="h-4 w-4" />
                {isOccupied ? formatTime(elapsedTime) : "00:00:00"}
              </div>
            </div>
            <div className="p-4 flex flex-col items-center bg-blue-50/50">
              <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Current Fee</span>
              <div className={`font-mono text-xl font-bold ${isOccupied ? "text-blue-600" : "text-slate-300"}`}>
                ${isOccupied ? fee.toFixed(2) : "0.00"}
              </div>
            </div>
          </div>
        </div>

        {/* Simulation mode */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-bold text-yellow-800">Simulation Mode</h3>
              <p className="text-xs text-yellow-700 mt-1 mb-2">
                Can't connect to USB in this preview? Use the button below to test manually.
              </p>
              <button 
                onClick={handleManualSimulate}
                className="text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold py-1 px-3 rounded"
              >
                Toggle Car (Simulate)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">

            {!paymentSuccess ? (
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Payment Due</h3>
                    <p className="text-slate-500 text-sm">Thank you for parking.</p>
                  </div>
                  <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-lg">
                    ${fee.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-mono text-slate-700 font-bold">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Rate</span>
                    <span className="font-mono text-slate-700">$2.50/hr</span>
                  </div>
                  <div className="border-t border-slate-200 my-2" />
                  <div className="flex justify-between font-bold text-lg text-slate-900">
                    <span>Total</span>
                    <span>${fee.toFixed(2)}</span>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-5 w-5" />
                  Pay Now
                </button>

                <button 
                  onClick={() => setShowPayment(false)}
                  className="w-full mt-3 py-2 text-slate-400 text-sm hover:text-slate-600 font-medium"
                >
                  Cancel / Debug
                </button>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center bg-green-50 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 ring-8 ring-green-50">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Paid!</h3>
                <p className="text-slate-600">Have a safe drive.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}