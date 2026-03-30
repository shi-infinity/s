/* ===========================
   ConsultBrief — app.js
   =========================== */

(function () {
  "use strict";

  /* ---- State ---- */
  let currentBrief = null;
  let selectedDomain = null; // null = Any domain

  /* ---- DOM References ---- */
  const generateBtn = document.getElementById("generateBtn");
  const domainBtns = document.querySelectorAll(".domain-btn");
  const briefSection = document.getElementById("briefSection");
  const briefPlaceholder = document.getElementById("briefPlaceholder");

  // Brief fields
  const briefId = document.getElementById("briefId");
  const briefDomainBadge = document.getElementById("briefDomainBadge");
  const briefProject = document.getElementById("briefProject");
  const clientType = document.getElementById("clientType");
  const clientIndustry = document.getElementById("clientIndustry");
  const clientSize = document.getElementById("clientSize");
  const clientRevenue = document.getElementById("clientRevenue");
  const briefChallenge = document.getElementById("briefChallenge");
  const briefAudience = document.getElementById("briefAudience");
  const briefBudget = document.getElementById("briefBudget");
  const briefTimeline = document.getElementById("briefTimeline");
  const deliverablesList = document.getElementById("deliverablesList");
  const copyBtn = document.getElementById("copyBtn");
  const saveBtn = document.getElementById("saveBtn");
  const savedCount = document.getElementById("savedCount");

  /* ---- Saved Briefs ---- */
  let saved = JSON.parse(localStorage.getItem("cb_saved") || "[]");

  function updateSavedCount() {
    savedCount.textContent = saved.length;
  }
  updateSavedCount();

  /* ---- Domain selection ---- */
  domainBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      domainBtns.forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      selectedDomain = btn.dataset.domain === "any" ? null : btn.dataset.domain;
    });
  });

  /* ---- Generate ---- */
  generateBtn.addEventListener("click", function () {
    triggerGenerate();
  });

  // Keyboard shortcut: Space / Enter when focused on nothing specific
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      triggerGenerate();
    }
  });

  function triggerGenerate() {
    // Animate button
    generateBtn.classList.add("spinning");
    generateBtn.disabled = true;

    setTimeout(function () {
      currentBrief = generateBrief(selectedDomain);
      renderBrief(currentBrief);
      generateBtn.classList.remove("spinning");
      generateBtn.disabled = false;
    }, 400);
  }

  /* ---- Render ---- */
  function renderBrief(brief) {
    briefPlaceholder.style.display = "none";
    briefSection.style.display = "block";

    // Header
    briefId.textContent = brief.id;
    briefDomainBadge.textContent = brief.domainIcon + " " + brief.domainLabel;
    briefDomainBadge.style.background = brief.domainColor + "22";
    briefDomainBadge.style.color = brief.domainColor;
    briefDomainBadge.style.borderColor = brief.domainColor + "55";
    briefProject.textContent = brief.project;

    // Client
    clientType.textContent = brief.client.type;
    clientIndustry.textContent = brief.client.industry;
    clientSize.textContent = brief.client.size;
    clientRevenue.textContent = brief.client.revenue;

    // Narrative
    briefChallenge.textContent = brief.challenge;
    briefAudience.textContent = brief.audience;

    // Constraints
    briefBudget.textContent = brief.constraint.budget;
    briefTimeline.textContent = brief.constraint.timeline;

    // Deliverables
    deliverablesList.innerHTML = "";
    brief.deliverables.forEach(function (d) {
      var li = document.createElement("li");
      li.textContent = d;
      deliverablesList.appendChild(li);
    });

    // Animate in
    briefSection.classList.remove("brief-in");
    void briefSection.offsetWidth; // reflow
    briefSection.classList.add("brief-in");

    // Update save button state
    var isSaved = saved.some(function (s) { return s.id === brief.id; });
    saveBtn.classList.toggle("saved", isSaved);
    saveBtn.title = isSaved ? "Saved!" : "Save brief";
  }

  /* ---- Copy to clipboard ---- */
  copyBtn.addEventListener("click", function () {
    if (!currentBrief) return;
    var text = buildPlainText(currentBrief);
    navigator.clipboard.writeText(text).then(function () {
      copyBtn.textContent = "✓ Copied!";
      setTimeout(function () { copyBtn.textContent = "📋 Copy brief"; }, 2000);
    }).catch(function () {
      // Fallback for older browsers
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      copyBtn.textContent = "✓ Copied!";
      setTimeout(function () { copyBtn.textContent = "📋 Copy brief"; }, 2000);
    });
  });

  /* ---- Save brief ---- */
  saveBtn.addEventListener("click", function () {
    if (!currentBrief) return;
    var idx = saved.findIndex(function (s) { return s.id === currentBrief.id; });
    if (idx === -1) {
      saved.push(currentBrief);
      saveBtn.classList.add("saved");
      saveBtn.title = "Saved!";
      showToast("Brief saved!");
    } else {
      saved.splice(idx, 1);
      saveBtn.classList.remove("saved");
      saveBtn.title = "Save brief";
      showToast("Brief removed.");
    }
    localStorage.setItem("cb_saved", JSON.stringify(saved));
    updateSavedCount();
  });

  /* ---- Saved panel toggle ---- */
  var savedPanelBtn = document.getElementById("savedPanelBtn");
  var savedPanel = document.getElementById("savedPanel");
  var closeSavedPanel = document.getElementById("closeSavedPanel");
  var savedList = document.getElementById("savedList");

  savedPanelBtn.addEventListener("click", function () {
    renderSavedList();
    savedPanel.classList.add("open");
  });

  closeSavedPanel.addEventListener("click", function () {
    savedPanel.classList.remove("open");
  });

  function renderSavedList() {
    savedList.innerHTML = "";
    if (saved.length === 0) {
      savedList.innerHTML = "<p class='empty-saved'>No saved briefs yet. Generate a brief and click the bookmark icon to save it.</p>";
      return;
    }
    saved.forEach(function (brief) {
      var card = document.createElement("div");
      card.className = "saved-card";
      card.innerHTML =
        "<span class='saved-card-domain' style='color:" + brief.domainColor + "'>" +
          brief.domainIcon + " " + brief.domainLabel +
        "</span>" +
        "<span class='saved-card-title'>" + esc(brief.project) + "</span>" +
        "<span class='saved-card-client'>" + esc(brief.client.type) + "</span>" +
        "<div class='saved-card-actions'>" +
          "<button class='sc-load'>Load</button>" +
          "<button class='sc-del'>Remove</button>" +
        "</div>";

      card.querySelector(".sc-load").addEventListener("click", function () {
        renderBrief(brief);
        currentBrief = brief;
        savedPanel.classList.remove("open");
      });
      card.querySelector(".sc-del").addEventListener("click", function () {
        saved = saved.filter(function (s) { return s.id !== brief.id; });
        localStorage.setItem("cb_saved", JSON.stringify(saved));
        updateSavedCount();
        renderSavedList();
      });

      savedList.appendChild(card);
    });
  }

  /* ---- Toast ---- */
  function showToast(msg) {
    var toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("visible");
    setTimeout(function () { toast.classList.remove("visible"); }, 2500);
  }

  /* ---- Plain text export ---- */
  function buildPlainText(brief) {
    var lines = [
      "CONSULTING PROJECT BRIEF — " + brief.id,
      "Domain: " + brief.domainIcon + " " + brief.domainLabel,
      "Project: " + brief.project,
      "",
      "CLIENT",
      "  Type: " + brief.client.type,
      "  Industry: " + brief.client.industry,
      "  Size: " + brief.client.size,
      "  Revenue: " + brief.client.revenue,
      "",
      "THE CHALLENGE",
      "  " + brief.challenge,
      "",
      "YOUR AUDIENCE",
      "  " + brief.audience,
      "",
      "DELIVERABLES",
    ];
    brief.deliverables.forEach(function (d, i) {
      lines.push("  " + (i + 1) + ". " + d);
    });
    lines.push("");
    lines.push("CONSTRAINTS");
    lines.push("  Budget: " + brief.constraint.budget);
    lines.push("  Timeline: " + brief.constraint.timeline);
    lines.push("");
    lines.push("Generated at consultbrief.io");
    return lines.join("\n");
  }

  /* ---- Escape HTML ---- */
  function esc(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---- Auto-generate on first load ---- */
  setTimeout(triggerGenerate, 600);
})();
