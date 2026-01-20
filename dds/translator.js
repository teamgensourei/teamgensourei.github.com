let DICT = null;

async function loadDict() {
  const res = await fetch("dictionary.json");
  DICT = await res.json();
}

/* ===== 共通 ===== */

function tokenize(text) {
  return text.trim().split(/\s+/);
}

/* ===== 活用処理 ===== */

function applyGrammar(baseJa, suffix) {
  if (!suffix) return baseJa;

  const g = DICT.grammar;
  if (suffix === "ir") return baseJa + "している";
  if (suffix === "eth") return baseJa + "されている";
  if (suffix === "an") return baseJa + "した";
  if (suffix === "el") return baseJa + "するだろう";

  return baseJa;
}

/* ===== アルカ語 → 日本語 ===== */

function arcaToJapanese(text) {
  const tokens = tokenize(text);
  let result = [];

  tokens.forEach(token => {
    let base = token;
    let suffix = null;

    if (token.includes("-")) {
      [base, suffix] = token.split("-");
    }

    if (DICT.words[base]) {
      let ja = DICT.words[base].ja;
      result.push(applyGrammar(ja, suffix));
    } else if (DICT.particles[base]) {
      result.push(DICT.particles[base].ja);
    } else {
      result.push(base);
    }
  });

  return polishJapanese(result.join(""));
}

/* ===== 日本語 → アルカ語 ===== */

function japaneseToArca(text) {
  let out = text;

  // 文法（活用）
  out = out.replace(/している/g, "-ir");
  out = out.replace(/されている/g, "-eth");
  out = out.replace(/した/g, "-an");
  out = out.replace(/するだろう/g, "-el");

  // 単語
  Object.entries(DICT.words).forEach(([arca, data]) => {
    out = out.replaceAll(data.ja, arca);
  });

  // 助詞
  Object.entries(DICT.particles).forEach(([arca, data]) => {
    out = out.replaceAll(data.ja, " " + arca);
  });

  return out.trim();
}

/* ===== 日本語整形 ===== */

function polishJapanese(text) {
  return text
    .replace(/はは/g, "は")
    .replace(/がが/g, "が")
    .replace(/をを/g, "を")
    .replace(/にに/g, "に")
    .replace(/。。/g, "。");
}

/* ===== UI ===== */

window.onload = async () => {
  await loadDict();

  document.getElementById("toJa").onclick = () => {
    const input = document.getElementById("input").value;
    document.getElementById("output").value = arcaToJapanese(input);
  };

  document.getElementById("toArca").onclick = () => {
    const input = document.getElementById("input").value;
    document.getElementById("output").value = japaneseToArca(input);
  };
};
