import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import {
  AirportTerminalConfig,
  AmenityPoint,
  NavigationNode,
  SecurityLane,
  findShortestPath,
} from "./terminal-data";

interface TerminalMapD3Props {
  config: AirportTerminalConfig;
  activeLevel: number;
  selectedAmenityId?: string | null;
  highlightGate?: string | null;
  filterCategory?: string;
  searchQuery?: string;
  startNodeId?: string;
  destinationAmenityId?: string | null;
  wheelchairAccessible?: boolean;
  onSelectAmenity?: (amenity: AmenityPoint) => void;
  onRouteCalculated?: (info: { distanceMeters: number; walkTimeMin: number; waypoints: string[] }) => void;
}

export function TerminalMapD3({
  config,
  activeLevel,
  selectedAmenityId,
  highlightGate,
  filterCategory = "all",
  searchQuery = "",
  startNodeId = "n-sec-digi",
  destinationAmenityId,
  wheelchairAccessible = false,
  onSelectAmenity,
  onRouteCalculated,
}: TerminalMapD3Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  const [hoveredAmenity, setHoveredAmenity] = useState<AmenityPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Filter amenities by active level, category, and search query
  const visibleAmenities = useMemo(() => {
    return config.amenities.filter((a) => {
      if (a.level !== activeLevel) return false;

      if (filterCategory !== "all") {
        if (filterCategory === "water_power" && a.category !== "water_power") return false;
        else if (filterCategory === "services" && (a.category !== "service" && a.category !== "restroom" && a.category !== "medical")) return false;
        else if (filterCategory !== "services" && filterCategory !== "water_power" && a.category !== filterCategory) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = a.name.toLowerCase().includes(q);
        const matchGate = a.gateNumber?.toLowerCase().includes(q);
        const matchTags = a.tags.some((t) => t.toLowerCase().includes(q));
        const matchDesc = a.description.toLowerCase().includes(q);
        return matchName || matchGate || matchTags || matchDesc;
      }

      return true;
    });
  }, [config.amenities, activeLevel, filterCategory, searchQuery]);

  // Determine destination node ID for routing
  const routeData = useMemo(() => {
    if (!destinationAmenityId) return null;

    const destAmenity = config.amenities.find((a) => a.id === destinationAmenityId);
    if (!destAmenity) return null;

    // Find closest node to destination amenity
    let closestNode: NavigationNode | null = null;
    let minDist = Infinity;
    config.nodes
      .filter((n) => n.level === activeLevel)
      .forEach((n) => {
        const dx = n.x - destAmenity.x;
        const dy = n.y - destAmenity.y;
        const d = Math.hypot(dx, dy);
        if (d < minDist) {
          minDist = d;
          closestNode = n;
        }
      });

    if (!closestNode) return null;

    const validStartId = config.nodes.some((n) => n.id === startNodeId)
      ? startNodeId
      : config.nodes[0]?.id || "n-entrance-1";

    const pathResult = findShortestPath(
      config.nodes.filter((n) => n.level === activeLevel),
      validStartId,
      (closestNode as NavigationNode).id,
      wheelchairAccessible
    );

    return {
      ...pathResult,
      destinationAmenity: destAmenity,
    };
  }, [config, activeLevel, startNodeId, destinationAmenityId, wheelchairAccessible]);

  useEffect(() => {
    if (routeData && onRouteCalculated) {
      onRouteCalculated({
        distanceMeters: routeData.distanceMeters,
        walkTimeMin: routeData.walkTimeMin,
        waypoints: routeData.path.map((p) => p.id),
      });
    }
  }, [routeData, onRouteCalculated]);

  // ----------------------------------------------------------------------------------
  // Main D3 Render
  // ----------------------------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous drawings

    const { width, height } = config.viewBox;

    // Defs: Gradients, Filters, Markers, Patterns
    const defs = svg.append("defs");

    // Floor grid pattern
    const pattern = defs
      .append("pattern")
      .attr("id", "grid-pattern")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");
    pattern
      .append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 0.5)
      .attr("class", "text-border/40");

    // Route line gradient
    const routeGrad = defs
      .append("linearGradient")
      .attr("id", "route-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");
    routeGrad.append("stop").attr("offset", "0%").attr("stop-color", "#0284c7");
    routeGrad.append("stop").attr("offset", "50%").attr("stop-color", "#38bdf8");
    routeGrad.append("stop").attr("offset", "100%").attr("stop-color", "#10b981");

    // Glow filter for highlighted gate and active route
    const glowFilter = defs.append("filter").attr("id", "glow").attr("x", "-40%").attr("y", "-40%").attr("width", "180%").attr("height", "180%");
    glowFilter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
    glowFilter.append("feComposite").attr("in", "SourceGraphic").attr("in2", "blur").attr("operator", "over");

    // Master Container Group
    const g = svg.append("g").attr("class", "map-root");
    gRef.current = g;

    // Zoom setup
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial centering transform
    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(20, 20).scale(0.92)
    );

    // 1. Grid Background
    g.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#grid-pattern)")
      .attr("rx", 16)
      .attr("class", "opacity-60");

    // 2. Concourse Layout Geometry (Floor polygons)
    const concourseGroup = g.append("g").attr("class", "concourses-layer");
    const activeConcourses = config.concourses.filter((c) => c.level === activeLevel);

    activeConcourses.forEach((concourse) => {
      const lineGen = d3
        .line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3.curveLinearClosed);

      const pathData = lineGen(concourse.polygon);
      if (!pathData) return;

      // Outer shadow & border
      concourseGroup
        .append("path")
        .attr("d", pathData)
        .attr("class", "fill-card/90 stroke-border transition-colors duration-300")
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round");

      // Inner corridor track
      concourseGroup
        .append("path")
        .attr("d", pathData)
        .attr("class", "fill-accent/[0.03] stroke-accent/15")
        .attr("stroke-width", 8)
        .attr("stroke-linejoin", "round");

      // Concourse Label
      const centroid = d3.polygonCentroid(concourse.polygon);
      concourseGroup
        .append("text")
        .attr("x", centroid[0])
        .attr("y", centroid[1] - 40)
        .attr("text-anchor", "middle")
        .attr("class", "fill-foreground/40 font-mono text-[13px] font-semibold uppercase tracking-wider select-none pointer-events-none")
        .text(concourse.name);
    });

    // 3. Security Zones & Queues
    const securityGroup = g.append("g").attr("class", "security-lanes-layer");
    const activeSecLanes = config.securityLanes.filter((s) => s.level === activeLevel);

    activeSecLanes.forEach((sec) => {
      const sGroup = securityGroup
        .append("g")
        .attr("transform", `translate(${sec.x}, ${sec.y})`)
        .attr("class", "cursor-pointer group")
        .on("click", () => {
          const amenityEquivalent = config.amenities.find((a) => a.id === `amenity-${sec.id}` || a.id.includes(sec.id));
          if (amenityEquivalent && onSelectAmenity) onSelectAmenity(amenityEquivalent);
        });

      const waitColor =
        sec.status === "smooth" ? "#10b981" : sec.status === "moderate" ? "#f59e0b" : "#ef4444";

      // Security zone box
      sGroup
        .append("rect")
        .attr("x", -45)
        .attr("y", -20)
        .attr("width", 90)
        .attr("height", 40)
        .attr("rx", 10)
        .attr("class", "fill-background stroke-border shadow-sm")
        .attr("stroke-width", 1.5);

      // Status indicator ring
      sGroup
        .append("circle")
        .attr("cx", -28)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("fill", waitColor);

      // Icon & Wait time text
      sGroup
        .append("text")
        .attr("x", -15)
        .attr("y", -2)
        .attr("class", "fill-foreground font-semibold text-[10px] select-none")
        .text(`${sec.currentWaitMin}m wait`);

      sGroup
        .append("text")
        .attr("x", -15)
        .attr("y", 11)
        .attr("class", "fill-foreground/60 text-[8.5px] uppercase font-mono tracking-tight select-none")
        .text(sec.type === "digiyatra" ? "DigiYatra" : sec.type === "fast_track" ? "FastTrack" : "Main Lane");
    });

    // 4. Navigation Graph Connections (Subtle guide lines)
    const navGroup = g.append("g").attr("class", "nav-mesh-layer opacity-25 pointer-events-none");
    const activeNodes = config.nodes.filter((n) => n.level === activeLevel);
    const nodeMap = new Map<string, NavigationNode>();
    activeNodes.forEach((n) => nodeMap.set(n.id, n));

    const drawnEdges = new Set<string>();
    activeNodes.forEach((n) => {
      n.neighbors.forEach((neighborId) => {
        const neighbor = nodeMap.get(neighborId);
        if (!neighbor) return;
        const edgeKey = [n.id, neighborId].sort().join("--");
        if (drawnEdges.has(edgeKey)) return;
        drawnEdges.add(edgeKey);

        navGroup
          .append("line")
          .attr("x1", n.x)
          .attr("y1", n.y)
          .attr("x2", neighbor.x)
          .attr("y2", neighbor.y)
          .attr("stroke", "currentColor")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "3,3")
          .attr("class", "text-muted-foreground");
      });
    });

    // 5. Active Wayfinding Route Line (D3 Animated Dasharray)
    if (routeData && routeData.path.length > 1) {
      const routeGroup = g.append("g").attr("class", "route-path-layer");

      const lineGen = d3
        .line<NavigationNode>()
        .x((d) => d.x)
        .y((d) => d.y)
        .curve(d3.curveCatmullRom.alpha(0.5));

      const pathString = lineGen(routeData.path);

      if (pathString) {
        // Glowing background trail
        routeGroup
          .append("path")
          .attr("d", pathString)
          .attr("fill", "none")
          .attr("stroke", "#38bdf8")
          .attr("stroke-width", 10)
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("opacity", 0.3)
          .attr("filter", "url(#glow)");

        // Main colored route line
        const routePath = routeGroup
          .append("path")
          .attr("d", pathString)
          .attr("fill", "none")
          .attr("stroke", "url(#route-gradient)")
          .attr("stroke-width", 4.5)
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("class", "route-animated-line");

        // Animated marching ants / flow dashes
        const totalLength = (routePath.node() as SVGPathElement)?.getTotalLength() || 1000;
        routePath
          .attr("stroke-dasharray", `8 6`)
          .style("animation", "dash 20s linear infinite");

        // Waypoint Dots along the route
        routeData.path.forEach((pt, idx) => {
          if (idx > 0 && idx < routeData.path.length - 1) {
            routeGroup
              .append("circle")
              .attr("cx", pt.x)
              .attr("cy", pt.y)
              .attr("r", 3)
              .attr("class", "fill-background stroke-sky-500")
              .attr("stroke-width", 1.5);
          }
        });

        // Start Point Beacon (You are here / Security)
        const startPoint = routeData.path[0];
        const startBeacon = routeGroup
          .append("g")
          .attr("transform", `translate(${startPoint.x}, ${startPoint.y})`);

        startBeacon
          .append("circle")
          .attr("r", 12)
          .attr("class", "fill-sky-500/20 animate-ping");

        startBeacon
          .append("circle")
          .attr("r", 7)
          .attr("class", "fill-sky-600 stroke-white")
          .attr("stroke-width", 2);

        // Destination Marker Beacon
        const endPoint = routeData.path[routeData.path.length - 1];
        const endBeacon = routeGroup
          .append("g")
          .attr("transform", `translate(${endPoint.x}, ${endPoint.y})`);

        endBeacon
          .append("circle")
          .attr("r", 14)
          .attr("class", "fill-emerald-500/25 animate-pulse");

        endBeacon
          .append("circle")
          .attr("r", 8)
          .attr("class", "fill-emerald-500 stroke-white")
          .attr("stroke-width", 2.5);
      }
    }

    // 6. Interactive Amenities, Gates & Points of Interest
    const markerGroup = g.append("g").attr("class", "amenities-layer");

    visibleAmenities.forEach((amenity) => {
      const isSelected = selectedAmenityId === amenity.id;
      const isMyGate =
        amenity.category === "gate" &&
        (amenity.gateNumber === highlightGate ||
          amenity.gateNumber === config.myFlight?.gate ||
          amenity.id === "gate-14a");

      const aGroup = markerGroup
        .append("g")
        .attr("transform", `translate(${amenity.x}, ${amenity.y})`)
        .attr("class", "amenity-node cursor-pointer")
        .on("mouseenter", (event: MouseEvent) => {
          setHoveredAmenity(amenity);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        })
        .on("mousemove", (event: MouseEvent) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        })
        .on("mouseleave", () => {
          setHoveredAmenity(null);
          setTooltipPos(null);
        })
        .on("click", (event) => {
          event.stopPropagation();
          if (onSelectAmenity) onSelectAmenity(amenity);
        });

      // Special Beacon for My Flight Gate
      if (isMyGate) {
        aGroup
          .append("circle")
          .attr("r", 26)
          .attr("class", "fill-amber-500/20 animate-ping pointer-events-none")
          .attr("filter", "url(#glow)");

        aGroup
          .append("circle")
          .attr("r", 20)
          .attr("class", "fill-amber-500/30 stroke-amber-500")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,2");
      }

      // Base marker ring
      const markerSize = isMyGate ? 18 : isSelected ? 17 : amenity.category === "gate" ? 14 : 15;

      const categoryColor =
        isMyGate
          ? "#f59e0b"
          : amenity.category === "gate"
          ? "#0284c7"
          : amenity.category === "lounge"
          ? "#8b5cf6"
          : amenity.category === "dining"
          ? "#f97316"
          : amenity.category === "shopping"
          ? "#ec4899"
          : amenity.category === "water_power"
          ? "#06b6d4"
          : amenity.category === "restroom"
          ? "#64748b"
          : amenity.category === "medical"
          ? "#ef4444"
          : "#6366f1";

      aGroup
        .append("circle")
        .attr("r", markerSize)
        .attr("fill", isSelected ? categoryColor : "#ffffff")
        .attr("stroke", categoryColor)
        .attr("stroke-width", isSelected || isMyGate ? 3 : 2)
        .attr("class", "transition-all duration-200 hover:scale-125 shadow-md");

      // Icon or Gate Number Text
      if (amenity.category === "gate" && amenity.gateNumber) {
        aGroup
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("class", `font-mono text-[10px] font-bold select-none ${isSelected ? "fill-white" : "fill-sky-800 dark:fill-sky-200"}`)
          .text(amenity.gateNumber);
      } else {
        aGroup
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("class", "text-[12px] select-none pointer-events-none")
          .text(amenity.icon);
      }

      // Optional Gate / Amenity mini label under marker
      if (isMyGate || isSelected) {
        aGroup
          .append("rect")
          .attr("x", -40)
          .attr("y", markerSize + 4)
          .attr("width", 80)
          .attr("height", 18)
          .attr("rx", 5)
          .attr("class", isMyGate ? "fill-amber-500" : "fill-foreground")
          .attr("opacity", 0.95);

        aGroup
          .append("text")
          .attr("x", 0)
          .attr("y", markerSize + 16)
          .attr("text-anchor", "middle")
          .attr("class", isMyGate ? "fill-black font-bold text-[10px]" : "fill-background font-medium text-[9px]")
          .text(isMyGate ? `YOUR GATE` : amenity.name.slice(0, 12));
      }
    });
  }, [config, activeLevel, visibleAmenities, selectedAmenityId, highlightGate, routeData, onSelectAmenity]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.75);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(20, 20).scale(0.92));
  };

  const handleFocusMyGate = () => {
    const targetGate = config.amenities.find(
      (a) =>
        a.gateNumber === highlightGate ||
        a.gateNumber === config.myFlight?.gate ||
        a.id === "gate-14a"
    );
    if (!targetGate || !svgRef.current || !zoomBehaviorRef.current) return;

    const { width, height } = config.viewBox;
    const scale = 2.0;
    const x = width / 2 - targetGate.x * scale;
    const y = height / 2 - targetGate.y * scale;

    d3.select(svgRef.current)
      .transition()
      .duration(650)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale));

    if (onSelectAmenity) onSelectAmenity(targetGate);
  };

  const handleFocusSecurity = () => {
    const sec = config.securityLanes[0];
    if (!sec || !svgRef.current || !zoomBehaviorRef.current) return;

    const { width, height } = config.viewBox;
    const scale = 1.8;
    const x = width / 2 - sec.x * scale;
    const y = height / 2 - sec.y * scale;

    d3.select(svgRef.current)
      .transition()
      .duration(650)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale));
  };

  return (
    <div
      ref={containerRef}
      id="terminal-d3-map-container"
      className="relative h-full min-h-[500px] w-full select-none overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card/90 via-card to-background shadow-inner"
    >
      {/* Top Floating Quick Action Bar */}
      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
        <button
          id="btn-focus-my-gate"
          onClick={handleFocusMyGate}
          className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-600 shadow-sm backdrop-blur-md transition-all hover:bg-amber-500/20 dark:text-amber-300"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
          </span>
          Locate My Gate ({config.myFlight?.gate || "14A"})
        </button>

        <button
          id="btn-focus-security"
          onClick={handleFocusSecurity}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card/85 px-3 py-2 text-xs font-medium text-foreground/80 shadow-sm backdrop-blur-md hover:bg-card hover:text-foreground"
        >
          <span>🛡️</span> Security & DigiYatra
        </button>
      </div>

      {/* Floating Zoom & Compass HUD */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 rounded-xl border border-border bg-card/90 p-1.5 shadow-lg backdrop-blur-md">
        <button
          id="btn-map-zoom-in"
          onClick={handleZoomIn}
          title="Zoom In"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold hover:bg-muted"
        >
          +
        </button>
        <button
          id="btn-map-zoom-out"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold hover:bg-muted"
        >
          −
        </button>
        <div className="h-px w-full bg-border" />
        <button
          id="btn-map-reset"
          onClick={handleResetZoom}
          title="Reset View"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium hover:bg-muted"
        >
          ⟲
        </button>
        <div className="text-center font-mono text-[9px] text-foreground/45">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Mini Legend HUD */}
      <div className="absolute bottom-4 left-4 z-10 hidden flex-wrap items-center gap-3 rounded-xl border border-border bg-card/80 px-3.5 py-2 text-[11px] text-foreground/75 shadow-sm backdrop-blur-md md:flex">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>My Gate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
          <span>Gates</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Security</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
          <span>Lounges</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span>Dining</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
          <span>Shopping</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${config.viewBox.width} ${config.viewBox.height}`}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* D3 Dynamic Hover Tooltip */}
      {hoveredAmenity && tooltipPos && (
        <div
          style={{
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y + 15}px`,
            pointerEvents: "none",
          }}
          className="fixed z-50 min-w-[200px] max-w-[280px] rounded-xl border border-border bg-popover/95 p-3 text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{hoveredAmenity.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-xs">{hoveredAmenity.name}</div>
              <div className="text-[10px] text-muted-foreground capitalize">
                {hoveredAmenity.category.replace("_", " & ")} · Level {hoveredAmenity.level}
              </div>
            </div>
            {hoveredAmenity.waitTimeMin && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {hoveredAmenity.waitTimeMin}m wait
              </span>
            )}
          </div>

          <div className="mt-2 text-[11px] text-foreground/80 line-clamp-2">
            {hoveredAmenity.description}
          </div>

          {hoveredAmenity.tags && hoveredAmenity.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {hoveredAmenity.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-medium text-foreground/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2.5 border-t border-border pt-1.5 text-[10px] font-medium text-sky-500">
            Click to view directions & details →
          </div>
        </div>
      )}
    </div>
  );
}
