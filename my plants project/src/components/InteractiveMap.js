import React, { useEffect, useRef } from "react";

const provinceNames = {
  "albahah-province": "الباحة",
  "eastern-province": "المنطقة الشرقية",
  "najran-province": "نجران",
  "riyadh-province": "الرياض",
  "northern-borders_province": "الحدود الشمالية",
  "alqassim-province": "القصيم",
  "aseer-province": "عسير",
  "hail-province": "حائل",
  "makkah-province": "مكة المكرمة",
  "jazan-province": "جازان",
  "almadinah-province": "المدينة المنورة",
  "aljowf-province": "الجوف",
  "tabuk-province": "تبوك"
};

export default function InteractiveMap() {
  const containerRef = useRef(null);
  const infoBoxRef = useRef(null);

  useEffect(() => {
    fetch("/map.svg")
      .then((res) => res.text())
      .then((svgText) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svgText;
          makeMapInteractive();
        }
      });

    function makeMapInteractive() {
      const svg = containerRef.current.querySelector("svg");
      if (!svg) return;
      Object.keys(provinceNames).forEach(pid => {
        const el = svg.getElementById(pid);
        if (el) {
          el.style.transition = "fill 0.2s";
          el.style.cursor = "pointer";
          el.addEventListener("mouseover", (e) => {
            el.style.fill = "#f6c26b";
            el.style.opacity = "0.85";
            if (infoBoxRef.current) {
              infoBoxRef.current.textContent = provinceNames[pid];
              infoBoxRef.current.style.display = "block";
            }
          });
          el.addEventListener("mousemove", (e) => {
            if (infoBoxRef.current) {
              infoBoxRef.current.style.left = (e.pageX + 10) + "px";
              infoBoxRef.current.style.top = (e.pageY - 20) + "px";
            }
          });
          el.addEventListener("mouseout", () => {
            el.style.fill = "";
            el.style.opacity = "1";
            if (infoBoxRef.current) infoBoxRef.current.style.display = "none";
          });
          el.addEventListener("click", () => {
            alert(`تم الضغط على: ${provinceNames[pid]}`);
            // يمكنك هنا تنفيذ أي إجراء عند الضغط على المنطقة
          });
        }
      });
    }
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "480px" }}>
      <h3 style={{textAlign:"center"}}>الخريطة التفاعلية للمناطق</h3>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: 800,
          margin: "auto",
          background: "#f8fafd",
          border: "1px solid #ddd"
        }}
      />
      <div
        ref={infoBoxRef}
        style={{
          position: "absolute",
          background: "#fff",
          border: "1px solid #aaa",
          padding: "5px 12px",
          borderRadius: 7,
          boxShadow: "0 2px 6px #0001",
          pointerEvents: "none",
          display: "none",
          fontSize: "1rem",
          color: "#333",
          zIndex: 99
        }}
      />
    </div>
  );
}