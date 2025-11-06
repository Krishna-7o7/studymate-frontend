// === Select Elements ===
const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");
const clearBtn = document.getElementById("clearBtn");
const statsArea = document.getElementById("statsArea");
const chunksList = document.getElementById("chunksList");
const askBtn = document.getElementById("askBtn");
const questionInput = document.getElementById("question");
const answerArea = document.getElementById("answer");
const retrievedDiv = document.getElementById("retrieved");

let chunks = [];

// === Extract text from PDFs ===
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(i => i.str).join(" ");
    text += pageText + "\n";
  }
  return text;
}

// === Chunk text ===
function chunkText(text, size = 400) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}

// === Display Chunks ===
function displayChunks() {
  chunksList.innerHTML = "";
  chunks.forEach((chunk, i) => {
    const div = document.createElement("div");
    div.className = "chunk";
    div.textContent = `📄 Chunk ${i + 1}: ${chunk.slice(0, 80)}...`;
    chunksList.appendChild(div);
  });
}

// === Process PDFs ===
processBtn.onclick = async () => {
  const files = fileInput.files;
  if (!files.length) return alert("Please upload a PDF first!");

  statsArea.textContent = "Extracting text...";
  chunks = [];

  for (const file of files) {
    const text = await extractTextFromPDF(file);
    const size = parseInt(document.getElementById("chunkSize").value);
    chunks.push(...chunkText(text, size));
  }

  displayChunks();
  statsArea.textContent = `${files.length} PDF(s) processed. Total chunks: ${chunks.length}.`;
};

// === Ask Question (Improved Search) ===
askBtn.onclick = () => {
  const query = questionInput.value.trim().toLowerCase();
  if (!query) return alert("Please enter a question!");
  if (!chunks.length) return alert("Please process a PDF first!");

  const keywords = query.split(/\s+/).filter(w => w.length > 3);

  const scored = chunks.map(chunk => {
    const text = chunk.toLowerCase();
    let score = 0;
    keywords.forEach(k => {
      if (text.includes(k)) score++;
    });
    return { chunk, score };
  });

  const relevant = scored.filter(c => c.score > 0).sort((a, b) => b.score - a.score);

  if (!relevant.length) {
    retrievedDiv.innerHTML = "<em>No relevant text found in your documents.</em>";
    answerArea.textContent = "No matching information found. Try rephrasing your question.";
    return;
  }

  retrievedDiv.innerHTML = relevant
    .slice(0, 3)
    .map(c => `<div class="context">${c.chunk.slice(0, 250)}...</div>`)
    .join("");

  const bestChunk = relevant[0].chunk;
  answerArea.textContent = `🧠 Based on your documents: ${bestChunk.slice(0, 300)}...`;
};

// === Clear ===
clearBtn.onclick = () => {
  fileInput.value = "";
  chunks = [];
  chunksList.innerHTML = "";
  statsArea.textContent = "No documents loaded.";
  answerArea.textContent = "No answer yet — ask a question.";
  retrievedDiv.innerHTML = "";
};




