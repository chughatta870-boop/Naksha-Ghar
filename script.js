/* ===========================================================
   Naqsha Ghar - House Map Generator
   by M Ijaz
   =========================================================== */

// ---------- 1. Plot size data (standard/approx dimensions in feet) ----------
const PLOT_SIZES = [
  { key: "2.5", label: "2.5 Marla", front: 20, depth: 28, tier: "compact" },
  { key: "3",   label: "3 Marla",   front: 20, depth: 45, tier: "compact" },
  { key: "4",   label: "4 Marla",   front: 22, depth: 45, tier: "medium"  },
  { key: "5",   label: "5 Marla",   front: 25, depth: 45, tier: "medium"  },
  { key: "7",   label: "7 Marla",   front: 30, depth: 52.5, tier: "large" },
  { key: "10",  label: "10 Marla",  front: 35, depth: 65, tier: "large"  },
  { key: "15",  label: "15 Marla",  front: 42, depth: 75, tier: "grand"  },
  { key: "20",  label: "20 Marla",  front: 50, depth: 90, tier: "grand"  },
];

// ---------- 2. Room layout templates per tier ----------
// Each row has a height % (of usable inner area) and columns with width %.
// A column may instead have "subrows" that stack vertically within that column.
const TEMPLATES = {
  compact: [
    { h: 18, cols: [{ w: 100, name: "Verandah" }] },
    { h: 52, cols: [
        { w: 62, name: "Bedroom" },
        { w: 38, subrows: [
            { h: 55, name: "Kitchen" },
            { h: 45, name: "Bathroom" },
        ]},
    ]},
    { h: 30, cols: [{ w: 100, name: "Lounge / TV Lounge" }] },
  ],

  medium: [
    { h: 12, cols: [{ w: 100, name: "Car Porch / Verandah" }] },
    { h: 20, cols: [{ w: 100, name: "Drawing Room" }] },
    { h: 38, cols: [
        { w: 55, name: "Bedroom 1" },
        { w: 45, subrows: [
            { h: 50, name: "Bathroom" },
            { h: 50, name: "Store" },
        ]},
    ]},
    { h: 30, cols: [
        { w: 60, name: "Lounge" },
        { w: 40, name: "Kitchen" },
    ]},
  ],

  large: [
    { h: 10, cols: [{ w: 100, name: "Car Porch" }] },
    { h: 18, cols: [
        { w: 50, name: "Drawing Room" },
        { w: 50, name: "Lawn / Garden" },
    ]},
    { h: 36, cols: [
        { w: 35, name: "Bedroom 1" },
        { w: 35, name: "Bedroom 2" },
        { w: 30, subrows: [
            { h: 34, name: "Bathroom 1" },
            { h: 33, name: "Staircase" },
            { h: 33, name: "Store" },
        ]},
    ]},
    { h: 18, cols: [
        { w: 40, name: "Kitchen" },
        { w: 60, name: "Lounge / TV Lounge" },
    ]},
    { h: 18, cols: [
        { w: 50, name: "Dining" },
        { w: 50, name: "Bathroom 2" },
    ]},
  ],

  grand: [
    { h: 10, cols: [{ w: 100, name: "Car Porch / Driveway" }] },
    { h: 16, cols: [
        { w: 60, name: "Lawn / Garden" },
        { w: 40, name: "Drawing Room" },
    ]},
    { h: 30, cols: [
        { w: 28, name: "Bedroom 1" },
        { w: 28, name: "Bedroom 2" },
        { w: 22, name: "Bedroom 3 (Master)" },
        { w: 22, subrows: [
            { h: 34, name: "Bathroom 1" },
            { h: 33, name: "Bathroom 2" },
            { h: 33, name: "Staircase" },
        ]},
    ]},
    { h: 22, cols: [
        { w: 35, name: "Kitchen" },
        { w: 40, name: "TV Lounge" },
        { w: 25, name: "Store" },
    ]},
    { h: 22, cols: [
        { w: 55, name: "Dining Room" },
        { w: 45, name: "Bathroom 3" },
    ]},
  ],
};

// ---------- 3. State ----------
let selectedPlot = null;
const canvas = document.getElementById("planCanvas");
const ctx = canvas.getContext("2d");
const SAVE_KEY = "naqshaGhar_savedPlans";

// ---------- 4. Build plot selector buttons ----------
const plotGrid = document.getElementById("plotGrid");
PLOT_SIZES.forEach((p) => {
  const btn = document.createElement("button");
  btn.className = "plot-btn";
  btn.textContent = p.label;
  btn.dataset.key = p.key;
  btn.addEventListener("click", () => {
    document.querySelectorAll(".plot-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedPlot = p;
    document.getElementById("generateBtn").disabled = false;
  });
  plotGrid.appendChild(btn);
});

// ---------- 5. Canvas drawing engine ----------
function drawPlan(plot) {
  const scale = 14; // px per foot
  const marginPx = 46; // space for labels/title/watermark around plot
  const wallPx = 6;

  const plotWpx = plot.front * scale;
  const plotDpx = plot.depth * scale;

  canvas.width = plotWpx + marginPx * 2;
  canvas.height = plotDpx + marginPx * 2 + 40; // extra bottom for footer text

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = "#15573D";
  ctx.font = "bold 16px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${plot.label} Naqsha  (${plot.front}' x ${plot.depth}')`, canvas.width / 2, 24);

  const originX = marginPx;
  const originY = marginPx;

  // Outer boundary wall
  ctx.strokeStyle = "#15573D";
  ctx.lineWidth = wallPx;
  ctx.strokeRect(originX, originY, plotWpx, plotDpx);

  // usable inner area (inset from boundary wall)
  const inset = wallPx;
  const innerX = originX + inset;
  const innerY = originY + inset;
  const innerW = plotWpx - inset * 2;
  const innerH = plotDpx - inset * 2;

  const template = TEMPLATES[plot.tier];
  renderRows(template, innerX, innerY, innerW, innerH, plot);

  // North arrow (top-right)
  drawNorthArrow(originX + plotWpx - 26, originY - 8);

  // Front label (bottom, street side)
  ctx.fillStyle = "#6b7a73";
  ctx.font = "italic 12px Segoe UI, Arial";
  ctx.fillText("FRONT / STREET SIDE", originX + plotWpx / 2, originY + plotDpx + 18);

  // Watermark - diagonal repeated "M Ijaz"
  drawWatermark();

  // Footer credit
  ctx.fillStyle = "#8a958f";
  ctx.font = "10px Segoe UI, Arial";
  ctx.textAlign = "right";
  ctx.fillText("Generated by Naqsha Ghar \u2022 M Ijaz", canvas.width - 8, canvas.height - 6);
  ctx.textAlign = "left";
}

function renderRows(rows, x, y, w, h, plot) {
  let curY = y;
  rows.forEach((row) => {
    const rowH = (row.h / 100) * h;
    let curX = x;
    row.cols.forEach((col) => {
      const colW = (col.w / 100) * w;
      if (col.subrows) {
        let subY = curY;
        col.subrows.forEach((sr) => {
          const subH = (sr.h / 100) * rowH;
          drawRoom(curX, subY, colW, subH, sr.name, plot);
          subY += subH;
        });
      } else {
        drawRoom(curX, curY, colW, rowH, col.name, plot);
      }
      curX += colW;
    });
    curY += rowH;
  });
}

function drawRoom(x, y, w, h, name, plot) {
  const scale = 14;
  // wall
  ctx.strokeStyle = "#2f4a3f";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  // fill tint
  ctx.fillStyle = "rgba(21,87,61,0.04)";
  ctx.fillRect(x, y, w, h);

  const areaSqFt = Math.round((w / scale) * (h / scale));

  ctx.fillStyle = "#1c2b25";
  ctx.textAlign = "center";

  // fit font size to room size
  let fontSize = Math.min(13, Math.max(8, Math.floor(Math.min(w, h) / 6)));
  ctx.font = `600 ${fontSize}px Segoe UI, Arial`;

  const cx = x + w / 2;
  const cy = y + h / 2;

  wrapText(name, cx, cy - 6, w - 6, fontSize + 2);

  ctx.font = `${Math.max(8, fontSize - 2)}px Segoe UI, Arial`;
  ctx.fillStyle = "#5c6b64";
  if (h > 24 && w > 34) {
    ctx.fillText(`${areaSqFt} sqft`, cx, cy + fontSize + 4);
  }
}

function wrapText(text, cx, cy, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  words.forEach((word) => {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);

  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
}

function drawNorthArrow(x, y) {
  ctx.save();
  ctx.strokeStyle = "#15573D";
  ctx.fillStyle = "#15573D";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + 16);
  ctx.lineTo(x, y);
  ctx.lineTo(x - 4, y + 6);
  ctx.moveTo(x, y);
  ctx.lineTo(x + 4, y + 6);
  ctx.stroke();
  ctx.font = "10px Arial";
  ctx.textAlign = "center";
  ctx.fillText("N", x, y - 3);
  ctx.restore();
}

function drawWatermark() {
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = "#15573D";
  ctx.font = "bold 26px Segoe UI, Arial";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.textAlign = "center";
  const gapY = 70;
  const rows = Math.ceil(canvas.height / gapY) + 4;
  for (let i = -rows; i < rows; i++) {
    ctx.fillText("M Ijaz", 0, i * gapY);
  }
  ctx.restore();
}

// ---------- 6. Generate button ----------
document.getElementById("generateBtn").addEventListener("click", () => {
  if (!selectedPlot) return;
  drawPlan(selectedPlot);
  document.getElementById("resultCard").hidden = false;
  document.getElementById("resultCard").scrollIntoView({ behavior: "smooth" });
});

// ---------- 7. Download ----------
document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!selectedPlot) return;
  const link = document.createElement("a");
  link.download = `Naqsha-${selectedPlot.key}-Marla-MIjaz.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("Naqsha download ho gaya!");
});

// ---------- 8. Share ----------
document.getElementById("shareBtn").addEventListener("click", async () => {
  if (!selectedPlot) return;
  canvas.toBlob(async (blob) => {
    const file = new File([blob], `Naqsha-${selectedPlot.key}-Marla.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Naqsha Ghar",
          text: `${selectedPlot.label} ka naqsha - by M Ijaz`,
        });
      } catch (e) {
        /* user cancelled share - no action needed */
      }
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Naqsha-${selectedPlot.key}-Marla-MIjaz.png`;
      link.click();
      showToast("Share support nahi mila, isliye download ho gaya.");
    }
  }, "image/png");
});

// ---------- 9. Save (to localStorage gallery) ----------
document.getElementById("saveBtn").addEventListener("click", () => {
  if (!selectedPlot) return;
  const thumbCanvas = document.createElement("canvas");
  const scaleDown = 220 / canvas.width;
  thumbCanvas.width = 220;
  thumbCanvas.height = canvas.height * scaleDown;
  const tctx = thumbCanvas.getContext("2d");
  tctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

  const entry = {
    id: Date.now().toString(),
    plotKey: selectedPlot.key,
    label: selectedPlot.label,
    thumb: thumbCanvas.toDataURL("image/jpeg", 0.7),
    savedAt: new Date().toLocaleDateString(),
  };

  const list = getSavedPlans();
  list.unshift(entry);
  localStorage.setItem(SAVE_KEY, JSON.stringify(list.slice(0, 30)));
  renderSavedGrid();
  showToast("Naqsha save ho gaya!");
});

function getSavedPlans() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function renderSavedGrid() {
  const grid = document.getElementById("savedGrid");
  const list = getSavedPlans();
  grid.innerHTML = "";
  if (list.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-msg";
    p.id = "emptyMsg";
    p.textContent = "Abhi koi naqsha save nahi hua.";
    grid.appendChild(p);
    return;
  }
  list.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "saved-item";
    item.innerHTML = `<img src="${entry.thumb}" alt="${entry.label}"><div class="label">${entry.label}</div>`;
    item.addEventListener("click", () => {
      const plot = PLOT_SIZES.find((p) => p.key === entry.plotKey);
      if (plot) {
        selectedPlot = plot;
        document.querySelectorAll(".plot-btn").forEach((b) => {
          b.classList.toggle("selected", b.dataset.key === plot.key);
        });
        document.getElementById("generateBtn").disabled = false;
        drawPlan(plot);
        document.getElementById("resultCard").hidden = false;
        document.getElementById("resultCard").scrollIntoView({ behavior: "smooth" });
      }
    });
    grid.appendChild(item);
  });
}

document.getElementById("clearSavedBtn").addEventListener("click", () => {
  if (confirm("Kya aap tamam saved naqsha jat delete karna chahte hain?")) {
    localStorage.removeItem(SAVE_KEY);
    renderSavedGrid();
  }
});

// ---------- 10. Toast ----------
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2200);
}

// ---------- 11. PWA install prompt ----------
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBanner").hidden = false;
});

document.getElementById("installBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById("installBanner").hidden = true;
});

document.getElementById("dismissInstall").addEventListener("click", () => {
  document.getElementById("installBanner").hidden = true;
});

// ---------- 12. Service worker registration ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// ---------- 13. Init ----------
renderSavedGrid();
