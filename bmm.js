let historyData = JSON.parse(localStorage.getItem("bmiHistory")) || [];

document.getElementById("today-date").textContent =
    "วันนี้: " + new Date().toLocaleDateString("th-TH");

const usernameInput = document.getElementById("username");
const weightInput = document.getElementById("weight");
const heightInput = document.getElementById("height");
const bmiResult = document.getElementById("bmi-result");
const bmiStatus = document.getElementById("bmi-status");
const searchDate = document.getElementById("search-date");

document.getElementById("calc-btn").addEventListener("click", calcBMI);
document.getElementById("clear-btn").addEventListener("click", clearAll);
searchDate.addEventListener("change", renderHistory);

function calcBMI() {
    const username = usernameInput.value.trim();
    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value) / 100;

    if (!username || !weight || !height) {
        alert("กรอกข้อมูลให้ครบ");
        return;
    }

    const bmi = (weight / (height * height)).toFixed(2);
    const status = getStatus(bmi);

    bmiResult.textContent = `BMI: ${bmi}`;
    bmiStatus.textContent = `สถานะ: ${status}`;

    const record = {
        id: Date.now(),
        date: new Date().toLocaleDateString("th-TH"),
        name: username,
        weight,
        height: height * 100,
        bmi,
        status
    };

    historyData.push(record);
    saveData();
    clearForm();
    renderHistory();
}

function getStatus(bmi) {
    if (bmi < 18.5) return "น้ำหนักน้อย (ผอม)";
    if (bmi < 25) return "ปกติ";
    if (bmi < 30) return "น้ำหนักเกิน";
    return "อ้วน";
}

function renderHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = "";

    let filtered = historyData;
    if (searchDate.value) {
        const selectedDate = new Date(searchDate.value).toLocaleDateString("th-TH");
        filtered = historyData.filter(h => h.date === selectedDate);
    }

    filtered.forEach(h => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${h.date}</td>
            <td>${h.name}</td>
            <td>${h.weight}</td>
            <td>${h.height}</td>
            <td>${h.bmi}</td>
            <td>${h.status}</td>
            <td><button onclick="deleteRecord(${h.id})">ลบ</button></td>
        `;
        list.appendChild(row);
    });
}

function deleteRecord(id) {
    if (confirm("ลบข้อมูลนี้?")) {
        historyData = historyData.filter(h => h.id !== id);
        saveData();
        renderHistory();
    }
}

function clearAll() {
    if (confirm("ต้องการล้างข้อมูลทั้งหมด?")) {
        historyData = [];
        saveData();
        renderHistory();
    }
}

function saveData() {
    localStorage.setItem("bmiHistory", JSON.stringify(historyData));
}

function clearForm() {
    usernameInput.value = "";
    weightInput.value = "";
    heightInput.value = "";
}


renderHistory();
