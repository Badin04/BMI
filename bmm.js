// ==========================================
// 1. STATE & CORE STORAGE MANAGEMENT
// ==========================================
let bmiHistory = JSON.parse(localStorage.getItem("bmiHistory")) || [];

// ตั้งค่าเวลาปัจจุบันแสดงบนหน้าจอ
document.getElementById("today-date").textContent = 
    "🗓️ วันนี้: " + new Date().toLocaleDateString("th-TH", {
        year: "numeric", month: "long", day: "numeric"
    });

// ดึงตัวแปรจากฟอร์มหลัก
const usernameInput = document.getElementById("username");
const weightInput = document.getElementById("weight");
const heightInput = document.getElementById("height");

// ตัวแปรสำหรับแสดงผลลัพธ์ด่วน
const bmiResultDisplay = document.getElementById("bmi-result");
const bmiStatusDisplay = document.getElementById("bmi-status");

// ส่วนของแผงกรองค้นหาและตารางประวัติ
const searchDateInput = document.getElementById("search-date");
const historyList = document.getElementById("history-list");

// ==========================================
// 2. TAB ROUTING FUNCTION (ระบบสลับ 2 หน้า)
// ==========================================
const tabCalc = document.getElementById("tab-calc");
const tabHistory = document.getElementById("tab-history");
const pageCalc = document.getElementById("page-calc");
const pageHistory = document.getElementById("page-history");

tabCalc.addEventListener("click", () => switchPage("calc"));
tabHistory.addEventListener("click", () => switchPage("history"));

function switchPage(pageName) {
    if (pageName === "calc") {
        tabCalc.classList.add("active");
        tabHistory.classList.remove("active");
        pageCalc.classList.remove("hidden");
        pageHistory.classList.add("hidden");
    } else {
        tabCalc.classList.remove("active");
        tabHistory.classList.add("active");
        pageCalc.classList.add("hidden");
        pageHistory.classList.remove("hidden");
        renderHistoryTable(); // อัปเดตตารางทุกครั้งที่เปิดเข้าหน้าประวัติ
    }
}

// ==========================================
// 3. EVENT LISTENERS
// ==========================================
document.getElementById("calc-btn").addEventListener("click", processBmiCalculation);
document.getElementById("clear-btn").addEventListener("click", clearAllRecords);
searchDateInput.addEventListener("change", renderHistoryTable);

// ==========================================
// 4. BMI COMPUTATION & CORE LOGIC
// ==========================================
function processBmiCalculation() {
    const name = usernameInput.value.trim();
    const weight = parseFloat(weightInput.value);
    const heightCm = parseFloat(heightInput.value);

    if (!name || !weight || !heightCm) {
        alert("⚠️ รบกวนกรอกชื่อ น้ำหนัก และส่วนสูงให้ครบถ้วนก่อนคำนวณนะครับ");
        return;
    }

    const heightM = heightCm / 100;
    const bmiScore = (weight / (heightM * heightM)).toFixed(2);
    const evaluation = evaluateBmiStatus(parseFloat(bmiScore));

    // อัปเดตข้อมูลขึ้นหน้าจอฝั่งผลลัพธ์ (ทันที)
    bmiResultDisplay.textContent = bmiScore;
    bmiStatusDisplay.textContent = evaluation.text;
    
    // เคลียร์คลาสเก่าออกเพื่อลงสีป้ายสถานะตามระดับความอ้วน/ผอม
    bmiStatusDisplay.className = "status-badge"; 
    bmiStatusDisplay.style.backgroundColor = evaluation.color;
    bmiStatusDisplay.style.color = "#ffffff";

    // สร้างออบเจกต์เก็บข้อมูลบันทึกแบบ ISO Date String เพื่อแก้อาการคัดกรองวันที่แล้วบั๊ก
    const currentTimestamp = new Date();
    const newRecord = {
        id: Date.now(),
        rawDate: currentTimestamp.toISOString().split('T')[0], // เก็บสำหรับเปรียบเทียบใน Input Date
        formattedDate: currentTimestamp.toLocaleDateString("th-TH"),
        name: name,
        weight: weight,
        height: heightCm,
        bmi: bmiScore,
        status: evaluation.text,
        badgeClass: evaluation.badgeClass
    };

    bmiHistory.push(newRecord);
    saveDataToStorage();
    resetFormFields();
}

function evaluateBmiStatus(bmi) {
    if (bmi < 18.5) return { text: "น้ำหนักน้อย (ผอม)", color: "#0284c7", badgeClass: "tag-under" };
    if (bmi < 25.0) return { text: "ปกติ (สุขภาพดี)", color: "#059669", badgeClass: "tag-normal" };
    if (bmi < 30.0) return { text: "น้ำหนักเกินเกณฑ์", color: "#d97706", badgeClass: "tag-over" };
    return { text: "โรคอ้วน", color: "#dc2626", badgeClass: "tag-obese" };
}

// ==========================================
// 5. RENDERER COMPONENTS (UI RENDERING)
// ==========================================
function renderHistoryTable() {
    historyList.innerHTML = "";
    
    const filterValue = searchDateInput.value; // จะได้ในฟอร์แมต YYYY-MM-DD
    
    const filteredData = filterValue 
        ? bmiHistory.filter(item => item.rawDate === filterValue)
        : bmiHistory;

    if (filteredData.length === 0) {
        historyList.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #94a3b8; padding: 3rem 0;">
                    📁 ไม่พบประวัติการจดบันทึกข้อมูลในเวลานี้
                </td>
            </tr>`;
        return;
    }

    // แรนเดอร์ข้อมูลแบบย้อนกลับเพื่อหาข้อมูลใหม่ล่าสุดขึ้นก่อน
    [...filteredData].reverse().forEach(record => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="color: #64748b; font-size: 0.9rem;">${record.formattedDate}</td>
            <td style="font-weight: 500;">${record.name}</td>
            <td>${record.weight} กก.</td>
            <td>${record.height} ซม.</td>
            <td style="font-family: 'Inter'; font-weight: 600; color: #0f172a;">${record.bmi}</td>
            <td><span class="status-tag ${record.badgeClass}">${record.status}</span></td>
            <td style="text-align: center;">
                <button class="btn-delete-icon" title="ลบข้อมูลชิ้นนี้">🗑️</button>
            </td>
        `;

        row.querySelector(".btn-delete-icon").addEventListener("click", () => deleteSingleRecord(record.id));
        historyList.appendChild(row);
    });
}

function deleteSingleRecord(id) {
    if (confirm("คุณต้องการลบรายการบันทึกนี้ใช่หรือไม่?")) {
        bmiHistory = bmiHistory.filter(item => item.id !== id);
        saveDataToStorage();
        renderHistoryTable();
    }
}

function clearAllRecords() {
    if (confirm("⚠️ ประกาศเตือน: ประวัติการประเมินผลทั้งหมดจะถูกลบทิ้งอย่างถาวร ยืนยันใช่ไหม?")) {
        bmiHistory = [];
        saveDataToStorage();
        renderHistoryTable();
    }
}

// ==========================================
// 6. UTILITY FUNCTIONS
// ==========================================
function saveDataToStorage() {
    localStorage.setItem("bmiHistory", JSON.stringify(bmiHistory));
}

function resetFormFields() {
    usernameInput.value = "";
    weightInput.value = "";
    heightInput.value = "";
}