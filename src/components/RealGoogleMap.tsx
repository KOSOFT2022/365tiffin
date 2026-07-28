import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { 
  Navigation, 
  Compass, 
  MapPin, 
  RotateCcw, 
  Layers, 
  Activity, 
  Info,
  Clock,
  Compass as CompassIcon,
  Globe,
  Plus,
  Minus,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Interfaces
interface Stop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'kitchen' | 'customer';
  status?: string;
  index?: number;
}

interface RealGoogleMapProps {
  stops: Stop[];
  riderLatLng?: { lat: number; lng: number };
  activeStopId?: string | null;
  mapViewMode?: 'batch' | 'active';
  height?: string;
}

// Polyline component to draw route lines between coordinates
interface MapPolylineProps {
  path: google.maps.LatLngLiteral[];
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
}

export const MapPolyline: React.FC<MapPolylineProps> = ({
  path,
  strokeColor = '#f97316',
  strokeWeight = 5,
  strokeOpacity = 0.9,
}) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length < 2) return;

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Create new polyline
    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      map,
    });

    polylineRef.current = polyline;

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, path, strokeColor, strokeWeight, strokeOpacity]);

  return null;
};

// Component to dynamically fetch actual street directions from Google Maps Directions API
interface DirectionsRouteProps {
  stops: Stop[];
  onRouteCalculated: (
    path: google.maps.LatLngLiteral[],
    distance: string,
    duration: string,
    error?: string,
    isApiRestricted?: boolean
  ) => void;
}

const DirectionsRoute: React.FC<DirectionsRouteProps> = ({ stops, onRouteCalculated }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || stops.length < 2) return;

    const directionsService = new google.maps.DirectionsService();

    // Origin is always the first stop (typically the central kitchen)
    const origin = { lat: stops[0].lat, lng: stops[0].lng };
    // Destination is the final stop in the current filter list
    const destination = { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng };

    // Intermediate stops as waypoints (excluding start and end)
    const waypoints: google.maps.DirectionsWaypoint[] = stops.slice(1, -1).map(stop => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true,
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0];
          const pathCoords: google.maps.LatLngLiteral[] = [];
          let totalDistance = 0; // meters
          let totalDuration = 0; // seconds

          route.legs.forEach(leg => {
            if (leg.distance?.value) totalDistance += leg.distance.value;
            if (leg.duration?.value) totalDuration += leg.duration.value;

            leg.steps.forEach(step => {
              step.path.forEach(latLng => {
                pathCoords.push({ lat: latLng.lat(), lng: latLng.lng() });
              });
            });
          });

          // Format readable strings
          const distanceText = totalDistance > 1000 
            ? `${(totalDistance / 1000).toFixed(1)} km` 
            : `${totalDistance} m`;

          const mins = Math.ceil(totalDuration / 60);
          const durationText = mins > 60 
            ? `${Math.floor(mins / 60)}h ${mins % 60}m` 
            : `${mins} mins`;

          onRouteCalculated(pathCoords, distanceText, durationText);
        } else {
          console.warn('Google Maps Directions Service failed:', status);
          const isRestricted = status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT' || status === 'INVALID_REQUEST';
          onRouteCalculated([], '', '', `Using point-to-point fallback (${status})`, isRestricted);
        }
      }
    );
  }, [map, stops]);

  return null;
};

// Component to handle auto-fitting the map bounds to contain all stops and the rider
interface FitBoundsEffectProps {
  stops: { lat: number; lng: number }[];
  riderLatLng?: { lat: number; lng: number };
  gpsLatLng?: { lat: number; lng: number } | null;
  triggerRefit: number;
}

const FitBoundsEffect: React.FC<FitBoundsEffectProps> = ({ stops, riderLatLng, gpsLatLng, triggerRefit }) => {
  const map = useMap();
  const riderRef = useRef(riderLatLng);
  const gpsRef = useRef(gpsLatLng);

  // Keep riderLatLng ref updated
  useEffect(() => {
    riderRef.current = riderLatLng;
  }, [riderLatLng]);

  // Keep gpsLatLng ref updated
  useEffect(() => {
    gpsRef.current = gpsLatLng;
  }, [gpsLatLng]);

  // Generate a stable key for stops to detect actual structure/length changes instead of reference changes
  const stopsKey = React.useMemo(() => {
    return stops.map((s) => `${s.lat.toFixed(6)},${s.lng.toFixed(6)}`).join('|');
  }, [stops]);

  useEffect(() => {
    if (!map || stops.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    stops.forEach((s) => bounds.extend(s));
    
    if (riderRef.current) {
      bounds.extend(riderRef.current);
    }

    if (gpsRef.current) {
      bounds.extend(gpsRef.current);
    }

    // Fit bounds with responsive padding
    map.fitBounds(bounds, {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60,
    });
  }, [map, stopsKey, triggerRefit]);

  return null;
};

// Child helper component to safely access the map context inside APIProvider
interface MapControlHelperProps {
  onMapReady: (map: google.maps.Map | null) => void;
}

const MapControlHelper: React.FC<MapControlHelperProps> = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

// Haversine distance formula helper to estimate distances locally if Directions API fails
const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};

// Main RealGoogleMap Component
export const RealGoogleMap: React.FC<RealGoogleMapProps> = ({
  stops,
  riderLatLng,
  activeStopId,
  mapViewMode = 'batch',
  height = '350px',
}) => {
  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Map state
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid' | 'terrain'>('roadmap');
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  
  // Directions state
  const [directionsPath, setDirectionsPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [directionsError, setDirectionsError] = useState<string>('');
  
  // Refit triggers
  const [refitCount, setRefitCount] = useState<number>(0);

  // Actual GPS Geolocation state
  const [gpsLatLng, setGpsLatLng] = useState<google.maps.LatLngLiteral | null>(null);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>('');
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [isInternalMaximized, setIsInternalMaximized] = useState<boolean>(false);

  // Custom zoom handlers
  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.setZoom((mapInstance.getZoom() || 13) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.setZoom((mapInstance.getZoom() || 13) - 1);
    }
  };

  // Watch actual live GPS coordinates when active
  useEffect(() => {
    if (!gpsActive) {
      setGpsLatLng(null);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation sensor is not supported by your browser environment.");
      setGpsActive(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLatLng({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("GPS tracking error:", error);
        setGpsError(error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [gpsActive]);

  const handleToggleGPS = () => {
    if (gpsActive) {
      setGpsActive(false);
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation sensor is not supported by your browser.");
        return;
      }
      setGpsActive(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLoc = { lat: latitude, lng: longitude };
          setGpsLatLng(newLoc);
          if (mapInstance) {
            mapInstance.panTo(newLoc);
            mapInstance.setZoom(15);
          }
        },
        (error) => {
          console.error("GPS position query error:", error);
          alert("Could not retrieve your precise location. Please ensure location permissions are enabled for this app.");
          setGpsActive(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Filter stops based on mapViewMode
  const visibleStops = React.useMemo(() => {
    return stops.filter((stop) => {
      if (mapViewMode === 'active' && activeStopId) {
        return stop.type === 'kitchen' || stop.id === activeStopId;
      }
      return true;
    });
  }, [stops, mapViewMode, activeStopId]);

  // Extract simple point-to-point coordinates for initial loading & fallback
  const fallbackCoords = React.useMemo(() => {
    return visibleStops.map((s) => ({ lat: s.lat, lng: s.lng }));
  }, [visibleStops]);

  // Pre-calculate fallback estimation stats using geographic coordinates (so we never display blank or infinite loading state)
  const fallbackStats = React.useMemo(() => {
    if (visibleStops.length < 2) return { distance: '0.0 km', duration: '0 mins' };
    
    let totalDistanceMeters = 0;
    for (let i = 0; i < visibleStops.length - 1; i++) {
      totalDistanceMeters += calculateHaversineDistance(
        visibleStops[i].lat,
        visibleStops[i].lng,
        visibleStops[i + 1].lat,
        visibleStops[i + 1].lng
      );
    }
    
    // Multiply by a winding factor of 1.35 to simulate actual road turns and routing overhead
    const estimatedRoadDistance = totalDistanceMeters * 1.35;
    
    const distanceText = estimatedRoadDistance > 1000 
      ? `${(estimatedRoadDistance / 1000).toFixed(1)} km` 
      : `${Math.round(estimatedRoadDistance)} m`;
    
    // Average rider delivery speed of 25 km/h (6.94 m/s) + 2 minutes dwell time per stop
    const estimatedSeconds = (estimatedRoadDistance / 6.94) + (visibleStops.length * 120);
    const mins = Math.ceil(estimatedSeconds / 60);
    const durationText = mins > 60 
      ? `${Math.floor(mins / 60)}h ${mins % 60}m` 
      : `${mins} mins`;

    return { distance: distanceText, duration: durationText };
  }, [visibleStops]);

  // Check if Directions API calls are disabled persistently (due to API authorization restrictions)
  const [directionsDisabled, setDirectionsDisabled] = useState<boolean>(() => {
    return localStorage.getItem('gmaps_directions_disabled_v1') === 'true';
  });

  // Automatically reset directions disabled status if the API Key changes (so new keys are retried immediately)
  useEffect(() => {
    localStorage.removeItem('gmaps_directions_disabled_v1');
    setDirectionsDisabled(false);
    setDirectionsError('');
  }, [API_KEY]);

  // Directions state hooks
  const [tripDistance, setTripDistance] = useState<string>(fallbackStats.distance);
  const [tripDuration, setTripDuration] = useState<string>(fallbackStats.duration);

  // Update estimates whenever visibleStops changes or route loads
  useEffect(() => {
    setTripDistance(fallbackStats.distance);
    setTripDuration(fallbackStats.duration);
  }, [fallbackStats]);

  // Callback from Directions API hook
  const handleRouteCalculated = React.useCallback((
    path: google.maps.LatLngLiteral[],
    distance: string,
    duration: string,
    error?: string,
    isApiRestricted?: boolean
  ) => {
    if (path && path.length >= 2) {
      setDirectionsPath(path);
      setTripDistance(distance);
      setTripDuration(duration);
      setDirectionsError('');
    } else {
      // Clear directions to trigger fallback
      setDirectionsPath([]);
      setTripDistance(fallbackStats.distance);
      setTripDuration(fallbackStats.duration);
      setDirectionsError(error || 'Using local geometric routing fallback.');

      if (isApiRestricted) {
        setDirectionsDisabled(true);
        localStorage.setItem('gmaps_directions_disabled_v1', 'true');
      }
    }
  }, [fallbackStats]);

  const handleRetryDirections = () => {
    localStorage.removeItem('gmaps_directions_disabled_v1');
    setDirectionsDisabled(false);
    setDirectionsError('');
  };

  // Recenter map on active rider
  const handleRecenterRider = () => {
    if (mapInstance && riderLatLng) {
      mapInstance.panTo(riderLatLng);
      mapInstance.setZoom(15);
    }
  };

  // Fit bounds manually
  const handleFitAll = () => {
    setRefitCount(prev => prev + 1);
  };

  // Auto clear selected stop if visibleStops change and it's no longer included
  useEffect(() => {
    if (selectedStop) {
      const exists = visibleStops.some(s => s.id === selectedStop.id);
      if (!exists) {
        setSelectedStop(null);
      }
    }
  }, [stops, mapViewMode, activeStopId]);

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div 
        className={isInternalMaximized 
          ? "fixed inset-0 z-50 w-screen h-screen bg-slate-900 flex flex-col" 
          : "rounded-2xl overflow-hidden border border-slate-200 relative shadow-md flex flex-col"
        } 
        style={isInternalMaximized ? { height: '100vh', width: '100vw' } : { height }}
      >
        {/* Top Floating Stats and Control overlay bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2 items-center justify-between pointer-events-none">
          
          {/* Route Info Stats HUD card */}
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-medium py-1.5 px-3 rounded-xl shadow-lg border border-slate-800 pointer-events-auto flex items-center gap-4" style={{ width: '253.887px' }}>
            <div className="flex items-center gap-1.5">
              <Activity className="text-emerald-500 animate-pulse" size={13} />
              <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[9px]">Live Route</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-slate-300">
                <Navigation size={11} className="text-blue-400 rotate-45" />
                <span>Distance: <strong className="text-white font-bold">{tripDistance}</strong></span>
              </div>
              
              <div className="flex items-center gap-1 text-slate-300">
                <Clock size={11} className="text-emerald-400" />
                <span>ETA: <strong className="text-white font-bold">{tripDuration}</strong></span>
              </div>
            </div>

            {directionsDisabled ? (
              <div className="text-[9px] bg-red-950/90 text-red-300 border border-red-900/50 px-2 py-0.5 rounded-lg flex items-center gap-1" title="The API Key lacks Directions API enablement. Turn it on in your Google Cloud Console.">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                <span>Directions Restricted</span>
                <button 
                  type="button" 
                  onClick={handleRetryDirections} 
                  className="ml-1 bg-red-900 hover:bg-red-800 text-red-100 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase transition-all cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : directionsError ? (
              <div className="text-[9px] bg-amber-950/90 text-amber-300 border border-amber-900/50 px-1.5 py-0.5 rounded flex items-center gap-1" title={directionsError}>
                <Info size={9} />
                <span>Simulated Route</span>
              </div>
            ) : null}
          </div>

          {/* Map Styling Controls Overlay */}
          <div className="bg-white/95 backdrop-blur-md text-[10px] p-1 rounded-xl shadow-lg border border-slate-200/80 pointer-events-auto flex items-center gap-0.5 font-bold">
            <button
              type="button"
              onClick={() => setMapTypeId('roadmap')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                mapTypeId === 'roadmap' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Roadmap View"
            >
              <CompassIcon size={12} />
              <span>Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMapTypeId('hybrid')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                mapTypeId === 'hybrid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Satellite Imagery"
            >
              <Globe size={12} />
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => setMapTypeId('terrain')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                mapTypeId === 'terrain' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Terrain View"
            >
              <Layers size={12} />
              <span>Terrain</span>
            </button>
          </div>
        </div>

        {/* Main Map Canvas rendering */}
        <div className="w-full flex-1 relative bg-slate-100">
          <Map
            defaultCenter={{ lat: 18.5204, lng: 73.8567 }} // Pune center default
            defaultZoom={13}
            mapId="DEMO_MAP_ID"
            mapTypeId={mapTypeId}
            gestureHandling="cooperative"
            disableDefaultUI={true}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Custom map control hook descendant of APIProvider */}
            <MapControlHelper onMapReady={setMapInstance} />

            {/* Auto-calculate route using Directions API - conditional on permission status */}
            {!directionsDisabled && (
              <DirectionsRoute stops={visibleStops} onRouteCalculated={handleRouteCalculated} />
            )}

            {/* Fit map bounds dynamically to show all path elements */}
            <FitBoundsEffect 
              stops={directionsPath.length >= 2 ? directionsPath : fallbackCoords} 
              riderLatLng={riderLatLng} 
              gpsLatLng={gpsLatLng}
              triggerRefit={refitCount}
            />

            {/* Draw Actual Route path (Real streets) */}
            {directionsPath.length >= 2 ? (
              <>
                {/* Thick dark underlay outline */}
                <MapPolyline path={directionsPath} strokeColor="#0f172a" strokeWeight={7} strokeOpacity={0.3} />
                {/* Core route emerald highlight path */}
                <MapPolyline path={directionsPath} strokeColor="#f97316" strokeWeight={4.5} strokeOpacity={0.95} />
              </>
            ) : (
              /* Fallback to point-to-point lines if Directions Service fails */
              fallbackCoords.length >= 2 && (
                <>
                  <MapPolyline path={fallbackCoords} strokeColor="#475569" strokeWeight={6} strokeOpacity={0.4} />
                  <MapPolyline path={fallbackCoords} strokeColor="#f97316" strokeWeight={3.5} strokeOpacity={0.9} />
                </>
              )
            )}

            {/* Render Stops (Kitchen & Customers) with Advanced Markers */}
            {visibleStops.map((stop) => {
              const isKitchen = stop.type === 'kitchen';
              const isDelivered = stop.status === 'delivered';
              const isActive = stop.id === activeStopId;

              return (
                <AdvancedMarker
                  key={stop.id}
                  position={{ lat: stop.lat, lng: stop.lng }}
                  title={`${isKitchen ? 'Kitchen' : 'Customer'}: ${stop.name}`}
                  onClick={() => setSelectedStop(stop)}
                >
                  <div className="relative flex flex-col items-center select-none" style={{ minWidth: '80px' }}>
                    {/* Pulsing indicator for active stop */}
                    {isActive && !isKitchen && !isDelivered && (
                      <div className="absolute w-10 h-10 top-0 rounded-full bg-blue-500/30 animate-ping"></div>
                    )}
                    
                    {/* Circle Pin Icon */}
                    <div
                      className={`w-9 h-9 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-xs font-extrabold text-white transition-all transform hover:scale-110 cursor-pointer ${
                        isKitchen
                          ? 'bg-gradient-to-tr from-emerald-600 to-amber-500 ring-4 ring-emerald-500/20'
                          : isDelivered
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 ring-2 ring-emerald-500/10'
                          : isActive
                          ? 'bg-gradient-to-tr from-blue-700 to-indigo-500 ring-4 ring-blue-500/25'
                          : 'bg-gradient-to-tr from-slate-600 to-slate-400'
                      }`}
                    >
                      {isKitchen ? '🍳' : stop.index ? `#${stop.index}` : '🏡'}
                    </div>

                    {/* Highly descriptive label ONLY for key locations (Kitchen and Active Stop) to prevent overlapping clutter */}
                    {(isKitchen || (isActive && !isKitchen && !isDelivered)) && (
                      <div className="mt-1 flex flex-col items-center">
                        <div
                          className={`text-[9px] font-black tracking-wide px-2 py-0.5 rounded-md shadow-md border flex items-center gap-1 whitespace-nowrap ${
                            isKitchen
                              ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
                              : 'bg-blue-900 text-blue-50 border-blue-600 animate-pulse ring-2 ring-blue-500/40'
                          }`}
                        >
                          {isKitchen ? (
                            <span>🍳 PICKUP KITCHEN</span>
                          ) : (
                            <span className="font-extrabold text-blue-100 flex items-center gap-0.5">
                              ⭐ NEXT STOP #{stop.index}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Render Active Rider Marker */}
            {riderLatLng && (
              <AdvancedMarker position={riderLatLng} title="Rider Active Location">
                <div className="relative flex flex-col items-center select-none" style={{ minWidth: '80px' }}>
                  {/* Ping animation under the rider */}
                  <div className="absolute w-10 h-10 top-0 rounded-full bg-blue-500/40 animate-ping"></div>
                  
                  {/* Rider bubble */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 border-2 border-white shadow-2xl flex items-center justify-center text-sm transform transition-transform hover:scale-110 cursor-pointer z-10">
                    🚴
                  </div>

                  {/* Rider label */}
                  <div className="mt-1 bg-blue-950 text-blue-200 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-lg border border-blue-800">
                    Your Location
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Render Actual GPS Location Marker if available */}
            {gpsLatLng && (
              <AdvancedMarker position={gpsLatLng} title="Your Actual Live Location">
                <div className="relative flex flex-col items-center select-none animate-fade-in" style={{ minWidth: '80px' }}>
                  {/* Glowing pulsing ping */}
                  <div className="absolute w-10 h-10 top-0 rounded-full bg-emerald-500/45 animate-ping"></div>
                  
                  {/* Glowing core dot */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-white shadow-2xl flex items-center justify-center text-sm transform transition-transform hover:scale-120 cursor-pointer z-20 animate-pulse">
                    📍
                  </div>

                  {/* High contrast label */}
                  <div className="mt-1 bg-emerald-950 text-emerald-100 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-lg border border-emerald-600">
                    YOU ARE HERE
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Interactive Info Window for clicked stops */}
            {selectedStop && (
              <InfoWindow
                position={{ lat: selectedStop.lat, lng: selectedStop.lng }}
                onCloseClick={() => setSelectedStop(null)}
              >
                <div className="p-1 min-w-[200px] text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate pr-2 max-w-[140px]">
                      {selectedStop.name}
                    </h4>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${
                      selectedStop.type === 'kitchen' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : selectedStop.status === 'delivered' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {selectedStop.type === 'kitchen' ? 'Central Kitchen' : selectedStop.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-[10px]">
                    <p className="text-slate-500 font-medium flex items-start gap-1">
                      <span className="text-slate-400 select-none">📍</span>
                      <span className="max-w-[170px] leading-tight">{selectedStop.address}</span>
                    </p>
                    
                    <p className="text-slate-400 text-[9px] font-mono mt-1 pt-1 border-t border-slate-50">
                      Lat: {selectedStop.lat.toFixed(5)}, Lng: {selectedStop.lng.toFixed(5)}
                    </p>
                  </div>
                  
                  <div className="mt-2.5 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (mapInstance) {
                          mapInstance.panTo({ lat: selectedStop.lat, lng: selectedStop.lng });
                          mapInstance.setZoom(16);
                        }
                      }}
                      className="px-2 py-1 text-[9px] font-black bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all cursor-pointer"
                    >
                      Focus
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>

          {/* Floating Route & Map Status Legend (Bottom Left) - Collapsible to avoid overlap clutter */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-col items-start pointer-events-auto select-none">
            {showLegend ? (
              <div className="bg-slate-950/95 backdrop-blur-md text-slate-300 py-2.5 px-3 rounded-xl shadow-2xl border border-slate-800 flex flex-col gap-1.5 max-w-[155px] animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1 gap-4">
                  <span className="font-extrabold text-slate-100 uppercase tracking-wider text-[8px]">Map Legend</span>
                  <button 
                    onClick={() => setShowLegend(false)}
                    className="text-[10px] text-slate-400 hover:text-white font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1 text-[9px] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-emerald-600 to-amber-500 border border-white shrink-0"></span>
                    <span>🍳 Kitchen</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-500 border border-white shrink-0 animate-pulse"></span>
                    <span className="text-blue-400 font-extrabold">⭐ Next Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-slate-600 to-slate-400 border border-white shrink-0"></span>
                    <span>📍 Pending Stop</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border border-white shrink-0"></span>
                    <span>✅ Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 border border-white shrink-0"></span>
                    <span>🚴 Rider Spot</span>
                  </div>
                  {gpsLatLng && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border border-white shrink-0 animate-pulse"></span>
                      <span className="text-emerald-400 font-extrabold">📍 Your GPS</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLegend(true)}
                className="w-8 h-8 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-white rounded-lg shadow-lg flex items-center justify-center text-xs font-extrabold transition-all cursor-pointer"
                title="Show Map Legend"
              >
                ❓
              </button>
            )}
          </div>

          {/* Floating Utility Toolbar (Bottom Right) */}
          <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2 pointer-events-none">
            {/* Custom Zoom In Button */}
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-9 h-9 bg-white/95 backdrop-blur-md text-slate-800 hover:bg-slate-50 hover:scale-110 active:scale-95 rounded-xl shadow-lg border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer pointer-events-auto font-black"
              title="Zoom In (बड़ा करें)"
            >
              <Plus className="text-blue-600" size={18} />
            </button>

            {/* Custom Zoom Out Button */}
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-9 h-9 bg-white/95 backdrop-blur-md text-slate-800 hover:bg-slate-50 hover:scale-110 active:scale-95 rounded-xl shadow-lg border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer pointer-events-auto font-black"
              title="Zoom Out (छोटा करें)"
            >
              <Minus className="text-blue-600" size={18} />
            </button>

            {/* Locate Me (GPS) Toggle Button */}
            <button
              type="button"
              onClick={handleToggleGPS}
              className={`w-9 h-9 backdrop-blur-md hover:scale-105 active:scale-95 rounded-xl shadow-lg border flex items-center justify-center transition-all cursor-pointer pointer-events-auto ${
                gpsActive 
                  ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse' 
                  : 'bg-white/95 border-slate-200/80 text-slate-800 hover:bg-slate-50'
              }`}
              title={gpsActive ? "GPS Active - Click to Disable" : "Locate Me (Use Real-World GPS)"}
            >
              <Navigation className={gpsActive ? "text-white fill-white rotate-45" : "text-emerald-600"} size={18} />
            </button>

            {/* Recenter Rider Location Button */}
            <button
              type="button"
              onClick={handleRecenterRider}
              className="w-9 h-9 bg-white/95 backdrop-blur-md text-slate-800 hover:bg-slate-50 hover:scale-105 active:scale-95 rounded-xl shadow-lg border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer pointer-events-auto"
              title="Recenter Map on Active Rider"
            >
              <Compass className="text-blue-600 animate-spin-slow" size={18} />
            </button>
            
            {/* Fit All Button */}
            <button
              type="button"
              onClick={handleFitAll}
              className="w-9 h-9 bg-white/95 backdrop-blur-md text-slate-800 hover:bg-slate-50 hover:scale-105 active:scale-95 rounded-xl shadow-lg border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer pointer-events-auto"
              title="Zoom Out to Fit Whole Batch Route"
            >
              <RotateCcw className="text-slate-600 hover:rotate-180 transition-transform duration-500" size={18} />
            </button>

            {/* Maximize / Minimize Toggle Button */}
            <button
              type="button"
              onClick={() => setIsInternalMaximized(!isInternalMaximized)}
              className="w-9 h-9 bg-white/95 backdrop-blur-md text-slate-800 hover:bg-slate-50 hover:scale-105 active:scale-95 rounded-xl shadow-lg border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer pointer-events-auto"
              title={isInternalMaximized ? "Exit Fullscreen Mode" : "Maximize Map (बड़ा करें)"}
            >
              {isInternalMaximized ? (
                <Minimize2 className="text-blue-600" size={18} />
              ) : (
                <Maximize2 className="text-blue-600" size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </APIProvider>
  );
};
