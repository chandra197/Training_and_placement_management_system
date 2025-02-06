// DOM Elements for Mark Attendance
const markYearSelect = document.getElementById("mark-year");
const markBranchSelect = document.getElementById("mark-branch");
const markBatchYearInput = document.getElementById("mark-batch-year");
const markSemesterSelect = document.getElementById("mark-semester");
const markFetchSectionsButton = document.getElementById("mark-fetch-sections");
const markSectionsList = document.getElementById("mark-sections-list");
const markTrainingDates = document.getElementById("mark-training-dates");
const markAttendanceList = document.getElementById("mark-attendance-list");
const markStudentsList = document.getElementById("mark-students-list");
const markSubmitAttendanceButton = document.getElementById("mark-submit-attendance");

// DOM Elements for Update Attendance
const updateYearSelect = document.getElementById("update-year");
const updateBranchSelect = document.getElementById("update-branch");
const updateBatchYearInput = document.getElementById("update-batch-year");
const updateSemesterSelect = document.getElementById("update-semester");
const updateFetchSectionsButton = document.getElementById("update-fetch-sections");
const updateSectionsList = document.getElementById("update-sections-list");
const updateTrainingDates = document.getElementById("update-training-dates");
const updateAttendanceList = document.getElementById("update-attendance-list");
const updateStudentsList = document.getElementById("update-students-list");
const updateSubmitAttendanceButton = document.getElementById("update-submit-attendance");

// State management
let currentSessionId = null;
let absentStudents = new Set();
let currentSection = null;
let isUpdateMode = false;

// Event Listeners
document.querySelectorAll(".sidebar-nav a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const action = e.target.dataset.action;
    showSection(action);
    isUpdateMode = action === "update";
  });
});

markFetchSectionsButton?.addEventListener("click", () => handleFetchSections(false));
updateFetchSectionsButton?.addEventListener("click", () => handleFetchSections(true));
markSubmitAttendanceButton?.addEventListener("click", () => handleSubmitAttendance(false));
updateSubmitAttendanceButton?.addEventListener("click", () => handleSubmitAttendance(true));

// Functions
function showSection(action) {
  document.querySelectorAll(".attendance-section").forEach((section) => {
    section.style.display = "none";
  });

  document.getElementById(`${action}-section`).style.display = "block";

  document.querySelectorAll(".sidebar-nav a").forEach((link) => {
    link.classList.toggle("active", link.dataset.action === action);
  });

  // Reset state when switching sections
  resetState();
}

function resetState() {
  currentSessionId = null;
  absentStudents.clear();
  currentSection = null;
  
  // Reset mark section
  markSectionsList.style.display = "none";
  markTrainingDates.style.display = "none";
  markAttendanceList.style.display = "none";
  
  // Reset update section
  updateSectionsList.style.display = "none";
  updateTrainingDates.style.display = "none";
  updateAttendanceList.style.display = "none";
}

async function handleFetchSections(isUpdate) {
  const batchYear = isUpdate ? updateBatchYearInput.value : markBatchYearInput.value;
  const semester = isUpdate ? updateSemesterSelect.value : markSemesterSelect.value;
  const year = isUpdate ? updateYearSelect.value : markYearSelect.value;
  const branch = isUpdate ? updateBranchSelect.value : markBranchSelect.value;

  if (!batchYear || !semester || !year || !branch) {
    alert("Please fill in all fields");
    return;
  }

  try {
    const response = await fetch(
      `/api/academic-batches?batch_year=${batchYear}&semester=${semester}&year=${year}&branch=${branch}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch sections");
    }

    const sections = await response.json();
    displaySections(sections, isUpdate);
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to fetch sections");
  }
}

function displaySections(sections, isUpdate) {
  const sectionsList = isUpdate ? updateSectionsList : markSectionsList;
  const trainingDates = isUpdate ? updateTrainingDates : markTrainingDates;
  const attendanceList = isUpdate ? updateAttendanceList : markAttendanceList;

  sectionsList.innerHTML = "";
  sectionsList.style.display = "grid";
  trainingDates.style.display = "none";
  attendanceList.style.display = "none";

  sections.forEach((section) => {
    const button = document.createElement("button");
    button.className = "section-button";
    button.textContent = `Section ${section.section}`;
    button.addEventListener("click", (event) => handleSectionClick(section, event, isUpdate));
    sectionsList.appendChild(button);
  });
}

async function handleSectionClick(section, event, isUpdate) {
  const sectionsList = isUpdate ? updateSectionsList : markSectionsList;
  
  // Remove active class from all section buttons
  sectionsList.querySelectorAll(".section-button").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Add active class to clicked button
  event.target.classList.add("active");

  // Store current section
  currentSection = section;

  try {
    const batchYear = isUpdate ? updateBatchYearInput.value : markBatchYearInput.value;
    const semester = isUpdate ? updateSemesterSelect.value : markSemesterSelect.value;
    const year = isUpdate ? updateYearSelect.value : markYearSelect.value;
    const branch = isUpdate ? updateBranchSelect.value : markBranchSelect.value;

    const endpoint = isUpdate ? "/api/marked-sessions" : "/api/unmarked-sessions";
    const response = await fetch(
      `${endpoint}?batch_year=${batchYear}&semester=${semester}&year=${year}&branch=${branch}&section=${section.section}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch training dates");
    }

    const dates = await response.json();
    displayTrainingDates(dates, isUpdate);
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to fetch training dates");
  }
}

function displayTrainingDates(dates, isUpdate) {
  const trainingDates = isUpdate ? updateTrainingDates : markTrainingDates;
  const attendanceList = isUpdate ? updateAttendanceList : markAttendanceList;

  trainingDates.innerHTML = "";
  trainingDates.style.display = "grid";
  attendanceList.style.display = "none";
  absentStudents.clear();

  if (dates.length === 0) {
    const message = document.createElement("div");
    message.className = "no-dates-message";
    message.textContent = isUpdate
      ? "No marked sessions available"
      : "No unmarked sessions available";
    trainingDates.appendChild(message);
    return;
  }

  dates.forEach((date) => {
    const dateObj = new Date(date.date);
    const button = document.createElement("button");
    button.className = "date-button";

    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const monthDay = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    button.innerHTML = `
      <span class="weekday">${weekday}</span>
      <span class="date">${monthDay}</span>
      <span class="time">${formatTime(date.start_time)} - ${formatTime(
      date.end_time
    )}</span>
    `;

    button.addEventListener("click", () => handleDateClick(date.id, isUpdate));
    trainingDates.appendChild(button);
  });
}

function formatTime(timeStr) {
  return timeStr.substring(0, 5);
}

async function handleDateClick(sessionId, isUpdate) {
  if (!currentSection) {
    alert("Please select a section first");
    return;
  }

  currentSessionId = sessionId;
  try {
    const year = isUpdate ? updateYearSelect.value : markYearSelect.value;
    const branch = isUpdate ? updateBranchSelect.value : markBranchSelect.value;
    const section = currentSection.section;

    const studentsResponse = await fetch(
      `/api/students/${year}/${branch}/${section}`
    );
    if (!studentsResponse.ok) {
      throw new Error("Failed to fetch students");
    }

    const students = await studentsResponse.json();

    if (isUpdate) {
      const attendanceResponse = await fetch(`/api/attendance/${sessionId}`);
      if (!attendanceResponse.ok) {
        throw new Error("Failed to fetch attendance");
      }
      const attendance = await attendanceResponse.json();
      displayStudentsListWithAttendance(students, attendance, isUpdate);
    } else {
      displayStudentsList(students, isUpdate);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to fetch data");
  }
}

function displayStudentsList(students, isUpdate) {
  const attendanceList = isUpdate ? updateAttendanceList : markAttendanceList;
  const studentsList = isUpdate ? updateStudentsList : markStudentsList;

  attendanceList.style.display = "block";
  studentsList.innerHTML = "";
  absentStudents.clear();

  students.forEach((student) => {
    const row = document.createElement("tr");
    row.id = `student-${student.id}`;
    row.innerHTML = `
      <td>${student.hall_ticket_number}</td>
      <td>${student.name}</td>
      <td>
        <button class="btn danger mark-absent-btn" onclick="markAbsent(${student.id}, ${isUpdate})">
          Mark Absent
        </button>
      </td>
    `;
    studentsList.appendChild(row);
  });
}

function displayStudentsListWithAttendance(students, attendance, isUpdate) {
  const attendanceList = isUpdate ? updateAttendanceList : markAttendanceList;
  const studentsList = isUpdate ? updateStudentsList : markStudentsList;

  attendanceList.style.display = "block";
  studentsList.innerHTML = "";
  absentStudents.clear();

  students.forEach((student) => {
    const isAbsent = attendance.find(
      (a) => a.student_id === student.id && a.status === "absent"
    );
    if (isAbsent) {
      absentStudents.add(student.id);
    }

    const row = document.createElement("tr");
    row.id = `student-${student.id}`;
    if (isAbsent) {
      row.classList.add("absent");
    }

    row.innerHTML = `
      <td>${student.hall_ticket_number}</td>
      <td>${student.name}</td>
      <td>
        <button class="btn ${
          isAbsent ? "success" : "danger"
        } mark-absent-btn" onclick="markAbsent(${student.id}, ${isUpdate})">
          ${isAbsent ? "Undo Absent" : "Mark Absent"}
        </button>
      </td>
    `;
    studentsList.appendChild(row);
  });
}

function markAbsent(studentId, isUpdate) {
  const row = document.getElementById(`student-${studentId}`);
  const button = row.querySelector(".mark-absent-btn");

  if (absentStudents.has(studentId)) {
    absentStudents.delete(studentId);
    row.classList.remove("absent");
    button.textContent = "Mark Absent";
    button.classList.remove("success");
    button.classList.add("danger");
  } else {
    absentStudents.add(studentId);
    row.classList.add("absent");
    button.textContent = "Undo Absent";
    button.classList.remove("danger");
    button.classList.add("success");
  }
}

async function handleSubmitAttendance(isUpdate) {
  if (!currentSessionId) {
    alert("No session selected");
    return;
  }

  try {
    const response = await fetch("/api/attendance", {
      method: isUpdate ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: currentSessionId,
        absentStudents: Array.from(absentStudents),
      }),
    });

    if (!response.ok) {
      throw new Error(
        isUpdate ? "Failed to update attendance" : "Failed to submit attendance"
      );
    }

    alert(
      isUpdate
        ? "Attendance updated successfully"
        : "Attendance submitted successfully"
    );

    // Reset UI
    const attendanceList = isUpdate ? updateAttendanceList : markAttendanceList;
    const trainingDates = isUpdate ? updateTrainingDates : markTrainingDates;
    const sectionsList = isUpdate ? updateSectionsList : markSectionsList;

    attendanceList.style.display = "none";
    trainingDates.style.display = "none";
    currentSessionId = null;
    absentStudents.clear();
    currentSection = null;

    // Show sections list again
    sectionsList.style.display = "grid";

    // Remove active class from section buttons
    sectionsList.querySelectorAll(".section-button").forEach((btn) => {
      btn.classList.remove("active");
    });
  } catch (error) {
    console.error("Error:", error);
    alert(
      isUpdate ? "Failed to update attendance" : "Failed to submit attendance"
    );
  }
}

// Make functions available globally
window.markAbsent = markAbsent;

// Initialize mark section by default
showSection("mark");