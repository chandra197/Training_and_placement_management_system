
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const sidebarLinks = document.querySelectorAll(".sidebar-nav a");
  const sections = document.querySelectorAll(".report-section");
  const generateReportBtn = document.getElementById("generate-report");
  const downloadExcelBtn = document.getElementById("download-excel");
  const eligibilityResults = document.getElementById("eligibility-results");
  const eligibleStudentsTable = document.getElementById("eligible-students");

  let currentStudents = []; // Store current results for Excel export

  // Event Listeners
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = e.target.dataset.section;
      showSection(section);
    });
  });

  generateReportBtn?.addEventListener("click", generateReport);
  downloadExcelBtn?.addEventListener("click", downloadExcel);

  // Functions
  function showSection(sectionName) {
    // Update sidebar active state
    sidebarLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.section === sectionName);
    });

    // Show selected section, hide others
    sections.forEach((section) => {
      section.style.display =
        section.id === `${sectionName}-section` ? "block" : "none";
    });
  }

  async function generateReport() {
    const batchYear = document.getElementById("batch-year").value;
    const semester = document.getElementById("semester").value;
    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;
    const minCgpa = document.getElementById("min-cgpa").value;
    const minInter = document.getElementById("min-inter").value;
    const minTenth = document.getElementById("min-tenth").value;
    const maxBacklogs = document.getElementById("max-backlogs").value;

    if (
      !batchYear ||
      !semester ||
      !year ||
      !branch ||
      !minCgpa ||
      !minInter ||
      !minTenth
    ) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch(
        `/api/students/eligible?batchYear=${batchYear}&semester=${semester}&year=${year}&branch=${branch}&minCgpa=${minCgpa}&minInter=${minInter}&minTenth=${minTenth}&maxBacklogs=${maxBacklogs}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch eligible students");
      }

      const students = await response.json();
      currentStudents = students; // Store for Excel export
      displayResults(students);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate report");
    }
  }

  function displayResults(students) {
    eligibilityResults.style.display = "block";
    eligibleStudentsTable.innerHTML = "";
    downloadExcelBtn.disabled = students.length === 0;

    students.forEach((student) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${student.hall_ticket_number}</td>
          <td>${student.name}</td>
          <td>${student.branch}-${student.section}</td>
          <td>${student.cgpa}</td>
          <td>${student.inter_percentage}%</td>
          <td>${student.tenth_percentage}%</td>
          <td>${student.backlogs}</td>
          <td>${student.gender}</td>
          <td>${new Date(student.date_of_birth).toLocaleDateString()}</td>
          <td>${student.email}</td>
          <td>${student.phone || "N/A"}</td>
        `;
      eligibleStudentsTable.appendChild(row);
    });
  }

  function downloadExcel() {
    if (currentStudents.length === 0) {
      alert("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      currentStudents.map((student) => ({
        "Hall Ticket Number": student.hall_ticket_number,
        Name: student.name,
        Branch: student.branch,
        Section: student.section,
        CGPA: student.cgpa,
        "Inter %": student.inter_percentage,
        "10th %": student.tenth_percentage,
        Backlogs: student.backlogs,
        Gender: student.gender,
        "Date of Birth": new Date(student.date_of_birth).toLocaleDateString(),
        Email: student.email,
        Phone: student.phone || "N/A",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Eligible Students");

    const batchYear = document.getElementById("batch-year").value;
    const semester = document.getElementById("semester").value;
    const branch = document.getElementById("branch").value;
    XLSX.writeFile(
      workbook,
      `eligible_students_${batchYear}_${semester}_${branch}.xlsx`
    );
  }

  // Initialize overview section by default
  showSection("overview");
});

// Add these functions to your existing reports.js

let dailyAbsentees = [];
let weeklyAbsentees = [];

// Tab switching functionality
document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    const tabId = button.dataset.tab;

    // Update button states
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.classList.toggle("active", btn === button);
    });

    // Show selected tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.toggle("active", content.id === `${tabId}-tab`);
    });
  });
});

// Daily Report
document
  .getElementById("generate-daily-report")
  ?.addEventListener("click", async () => {
    const date = document.getElementById("daily-date").value;
    const branch = document.getElementById("daily-branch").value;

    if (!date || !branch) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch(
        `/api/reports/attendance/daily?date=${date}&branch=${branch}`
      );
      if (!response.ok) throw new Error("Failed to fetch daily report");

      dailyAbsentees = await response.json();
      displayDailyReport(dailyAbsentees);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate daily report");
    }
  });

document
  .getElementById("download-daily-report")
  ?.addEventListener("click", () => {
    if (dailyAbsentees.length === 0) {
      alert("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      dailyAbsentees.map((student) => ({
        "Hall Ticket Number": student.hall_ticket_number,
        Name: student.name,
        Year: student.year,
        Section: student.section,
        "Session Time": `${formatTime(student.start_time)} - ${formatTime(
          student.end_time
        )}`,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Absentees");

    const date = document.getElementById("daily-date").value;
    const branch = document.getElementById("daily-branch").value;
    XLSX.writeFile(workbook, `${date}_${branch}_TT_absentes.xlsx`);
  });

// Weekly Report
document
  .getElementById("generate-weekly-report")
  ?.addEventListener("click", async () => {
    const batchYear = document.getElementById("weekly-batch-year").value;
    const year = document.getElementById("weekly-year").value;
    const branch = document.getElementById("weekly-branch").value;
    const semester = document.getElementById("weekly-semester").value;
    const startDate = document.getElementById("weekly-start-date").value;
    const endDate = document.getElementById("weekly-end-date").value;

    if (!batchYear || !year || !branch || !semester || !startDate || !endDate) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch(
        `/api/reports/attendance/weekly?startDate=${startDate}&endDate=${endDate}&batchYear=${batchYear}&year=${year}&branch=${branch}&semester=${semester}`
      );
      if (!response.ok) throw new Error("Failed to fetch weekly report");

      weeklyAbsentees = await response.json();
      displayWeeklyReport(weeklyAbsentees);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate weekly report");
    }
  });

document
  .getElementById("download-weekly-report")
  ?.addEventListener("click", () => {
    if (weeklyAbsentees.length === 0) {
      alert("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      weeklyAbsentees.map((student) => ({
        "Hall Ticket Number": student.hall_ticket_number,
        Name: student.name,
        Year: student.year,
        Section: student.section,
        Date: new Date(student.date).toLocaleDateString(),
        "Session Time": `${formatTime(student.start_time)} - ${formatTime(
          student.end_time
        )}`,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weekly Absentees");

    const startDate = document.getElementById("weekly-start-date").value;
    const endDate = document.getElementById("weekly-end-date").value;
    const year = document.getElementById("weekly-year").value;
    const branch = document.getElementById("weekly-branch").value;
    XLSX.writeFile(
      workbook,
      `${startDate}__${endDate}__${year}_${branch}_absentes.xlsx`
    );
  });

function displayDailyReport(absentees) {
  const resultsDiv = document.getElementById("daily-results");
  const tbody = document.getElementById("daily-absentees");
  const downloadBtn = document.getElementById("download-daily-report");

  resultsDiv.style.display = "block";
  tbody.innerHTML = "";
  downloadBtn.disabled = absentees.length === 0;

  absentees.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${student.hall_ticket_number}</td>
        <td>${student.name}</td>
        <td>${student.year}</td>
        <td>${student.section}</td>
        <td>${formatTime(student.start_time)} - ${formatTime(
      student.end_time
    )}</td>
      `;
    tbody.appendChild(row);
  });
}

function displayWeeklyReport(absentees) {
  const resultsDiv = document.getElementById("weekly-results");
  const tbody = document.getElementById("weekly-absentees");
  const downloadBtn = document.getElementById("download-weekly-report");

  resultsDiv.style.display = "block";
  tbody.innerHTML = "";
  downloadBtn.disabled = absentees.length === 0;

  absentees.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${student.hall_ticket_number}</td>
        <td>${student.name}</td>
        <td>${student.year}</td>
        <td>${student.section}</td>
        <td>${new Date(student.date).toLocaleDateString()}</td>
        <td>${formatTime(student.start_time)} - ${formatTime(
      student.end_time
    )}</td>
      `;
    tbody.appendChild(row);
  });
}

function formatTime(timeStr) {
  return timeStr.substring(0, 5);
}
