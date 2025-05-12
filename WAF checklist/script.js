document.addEventListener("DOMContentLoaded", () => {
    const checklist = document.getElementById("checklist");
    const generatePdfButton = document.getElementById("generate-pdf");
    const exportJsonButton = document.getElementById("export-json");
    const importJsonInput = document.getElementById("import-json");

    const pillars = [
        "Security",
        "Reliability",
        "Performance Efficiency",
        "Cost Optimization",
        "Operational Excellence"
    ];

    const statuses = ["Compliant", "Partially Compliant", "Non-Compliant", "Not Applicable"];

    const priorityLevels = ["High", "Medium", "Low"];

    const loadChecklist = () => {
        checklist.innerHTML = "";
        pillars.forEach(pillar => {
            const pillarSection = document.createElement("div");
            pillarSection.classList.add("pillar-section");

            const title = document.createElement("h2");
            title.textContent = pillar;
            pillarSection.appendChild(title);

            const question = document.createElement("div");
            question.classList.add("question");

            const statusSelect = document.createElement("select");
            statuses.forEach(status => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                statusSelect.appendChild(option);
            });
            question.appendChild(statusSelect);

            const prioritySelect = document.createElement("select");
            priorityLevels.forEach(priority => {
                const option = document.createElement("option");
                option.value = priority;
                option.textContent = priority;
                prioritySelect.appendChild(option);
            });
            question.appendChild(prioritySelect);

            const remarks = document.createElement("textarea");
            remarks.placeholder = "Add remarks or evidence here...";
            question.appendChild(remarks);

            const attachButton = document.createElement("button");
            attachButton.textContent = "Attach Screenshot";
            attachButton.addEventListener("click", () => {
                alert("Feature to attach screenshots coming soon!");
            });
            question.appendChild(attachButton);

            pillarSection.appendChild(question);
            checklist.appendChild(pillarSection);
        });
    };

    const saveToLocalStorage = () => {
        const data = [];
        document.querySelectorAll(".pillar-section").forEach(section => {
            const pillar = section.querySelector("h2").textContent;
            const status = section.querySelector("select").value;
            const priority = section.querySelectorAll("select")[1].value;
            const remarks = section.querySelector("textarea").value;
            data.push({ pillar, status, priority, remarks });
        });
        localStorage.setItem("wafChecklist", JSON.stringify(data));
    };

    const loadFromLocalStorage = () => {
        const data = JSON.parse(localStorage.getItem("wafChecklist"));
        if (data) {
            data.forEach((item, index) => {
                const section = document.querySelectorAll(".pillar-section")[index];
                section.querySelector("select").value = item.status;
                section.querySelectorAll("select")[1].value = item.priority;
                section.querySelector("textarea").value = item.remarks;
            });
        }
    };

    generatePdfButton.addEventListener("click", () => {
        alert("PDF generation feature coming soon!");
    });

    exportJsonButton.addEventListener("click", () => {
        const data = localStorage.getItem("wafChecklist");
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "wafChecklist.json";
        a.click();
    });

    importJsonInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            localStorage.setItem("wafChecklist", e.target.result);
            loadChecklist();
            loadFromLocalStorage();
        };
        reader.readAsText(file);
    });

    loadChecklist();
    loadFromLocalStorage();

    window.addEventListener("beforeunload", saveToLocalStorage);
});