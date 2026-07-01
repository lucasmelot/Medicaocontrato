document.addEventListener("DOMContentLoaded", () => {
    const elements = {
        loginSection: document.getElementById("loginSection"),
        appSection: document.getElementById("appSection"),
        userArea: document.getElementById("userArea"),
        userName: document.getElementById("userName"),

        accessForm: document.getElementById("accessForm"),
        emailInput: document.getElementById("emailInput"),
        accessCodeInput: document.getElementById("accessCodeInput"),
        loginMessage: document.getElementById("loginMessage"),

        logoutButton: document.getElementById("logoutButton"),
        searchInput: document.getElementById("searchInput"),

        tutorialList: document.getElementById("tutorialList"),
        emptyState: document.getElementById("emptyState"),

        supplierSearchInput: document.getElementById("supplierSearchInput"),
        supplierList: document.getElementById("supplierList"),
        supplierEmptyState: document.getElementById("supplierEmptyState"),

        videoPlaceholder: document.getElementById("videoPlaceholder"),
        selectedTutorial: document.getElementById("selectedTutorial"),
        selectedTutorialTitle: document.getElementById("selectedTutorialTitle"),
        selectedTutorialDescription: document.getElementById("selectedTutorialDescription"),
        tutorialIframe: document.getElementById("tutorialIframe")
    };

    initializeAnimations();
    initializeApp();

    elements.accessForm.addEventListener("submit", handleAccessSubmit);
    elements.logoutButton.addEventListener("click", handleLogout);
    elements.searchInput.addEventListener("input", handleSearch);
    elements.supplierSearchInput.addEventListener("input", handleSupplierSearch);

    function initializeApp() {
        const hasAccess = sessionStorage.getItem(APP_CONFIG.sessionKey) === "true";
        const savedEmail = sessionStorage.getItem(APP_CONFIG.sessionEmailKey);

        if (hasAccess && savedEmail && isAllowedEmail(savedEmail)) {
            showPortal(savedEmail);
            return;
        }

        showLogin();
    }

    async function handleAccessSubmit(event) {
        event.preventDefault();

        clearMessage();

        const email = elements.emailInput.value.trim().toLowerCase();
        const accessCode = elements.accessCodeInput.value.trim();

        if (!isAllowedEmail(email)) {
            showMessage(`Acesso negado. Use um e-mail com domínio @${APP_CONFIG.allowedDomain}.`);
            return;
        }

        if (!accessCode) {
            showMessage("Informe o código de acesso.");
            return;
        }

        const typedCodeHash = await generateSHA256(accessCode);

        if (typedCodeHash !== APP_CONFIG.accessCodeHash) {
            showMessage("Código de acesso inválido.");
            elements.accessCodeInput.value = "";
            elements.accessCodeInput.focus();
            return;
        }

        sessionStorage.setItem(APP_CONFIG.sessionKey, "true");
        sessionStorage.setItem(APP_CONFIG.sessionEmailKey, email);

        showPortal(email);
    }

    function handleLogout() {
        sessionStorage.removeItem(APP_CONFIG.sessionKey);
        sessionStorage.removeItem(APP_CONFIG.sessionEmailKey);

        elements.searchInput.value = "";
        elements.supplierSearchInput.value = "";
        elements.tutorialIframe.src = "";

        resetSupplierSearch();
        resetSelectedTutorial();
        showLogin();
    }

    function showLogin() {
        elements.loginSection.classList.remove("hidden");
        elements.appSection.classList.add("hidden");
        elements.userArea.classList.add("hidden");
        elements.userName.textContent = "";
    }


    function showPortal(email) {
        elements.loginSection.classList.add("hidden");
        elements.appSection.classList.remove("hidden");
        elements.userArea.classList.remove("hidden");

        elements.userName.textContent = `Olá, ${email}`;

        renderTutorials(tutorials);
        resetSupplierSearch();
        resetSelectedTutorial();
    }


    function resetSelectedTutorial() {
        elements.videoPlaceholder.classList.remove("hidden");
        elements.selectedTutorial.classList.add("hidden");

        elements.selectedTutorialTitle.textContent = "";
        elements.selectedTutorialDescription.textContent = "";
        elements.tutorialIframe.src = "";
        elements.tutorialIframe.title = "";
    }

    function handleSearch(event) {
        const searchTerm = normalizeText(event.target.value);

        const filteredTutorials = tutorials.filter((tutorial) => {
            const searchableText = normalizeText(`
                ${tutorial.title}
                ${tutorial.description}
                ${tutorial.category}
                ${tutorial.tags.join(" ")}
            `);

            return searchableText.includes(searchTerm);
        });

        renderTutorials(filteredTutorials);
    }

    function handleSupplierSearch(event) {
        const searchTerm = normalizeText(event.target.value);

        if (!searchTerm) {
            resetSupplierSearch();
            return;
        }

        const filteredSuppliers = suppliersResponsible.filter((item) => {
            const searchableText = normalizeText(`
            ${item.fornecedor}
            ${item.responsaveis.join(" ")}
            ${item.contratos.join(" ")}
        `);

            return searchableText.includes(searchTerm);
        });

        renderSuppliers(filteredSuppliers);
    }

    function resetSupplierSearch() {
        elements.supplierList.innerHTML = "";

        elements.supplierEmptyState.classList.remove("hidden");
        elements.supplierEmptyState.textContent =
            "Digite o nome do fornecedor, responsável ou número do contrato para pesquisar.";
    }

    function renderTutorials(tutorialsToRender) {
        elements.tutorialList.innerHTML = "";

        if (!tutorialsToRender.length) {
            elements.emptyState.classList.remove("hidden");
            return;
        }

        elements.emptyState.classList.add("hidden");

        tutorialsToRender.forEach((tutorial) => {
            const card = document.createElement("article");
            card.className = "tutorial-card";
            card.tabIndex = 0;

            const category = document.createElement("span");
            category.className = "tutorial-category";
            category.textContent = tutorial.category;

            const title = document.createElement("h3");
            title.textContent = tutorial.title;

            const description = document.createElement("p");
            description.textContent = tutorial.description;

            const tags = document.createElement("div");
            tags.className = "tag-list";

            tutorial.tags.forEach((tag) => {
                const tagElement = document.createElement("span");
                tagElement.className = "tag";
                tagElement.textContent = tag;
                tags.appendChild(tagElement);
            });

            const button = document.createElement("button");
            button.className = "button button-small button-primary";
            button.type = "button";
            button.textContent = "Assistir";
            button.setAttribute("aria-label", `Assistir tutorial ${tutorial.title}`);

            button.addEventListener("click", () => {
                selectTutorial(tutorial);
            });

            card.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    selectTutorial(tutorial);
                }
            });

            card.appendChild(category);
            card.appendChild(title);
            card.appendChild(description);
            card.appendChild(tags);
            card.appendChild(button);

            elements.tutorialList.appendChild(card);
        });
    }

    function renderSuppliers(suppliersToRender) {
        elements.supplierList.innerHTML = "";

        if (!suppliersToRender.length) {
            elements.supplierEmptyState.classList.remove("hidden");
            elements.supplierEmptyState.textContent =
                "Nenhum fornecedor encontrado para sua pesquisa.";
            return;
        }

        elements.supplierEmptyState.classList.add("hidden");

        suppliersToRender.forEach((item) => {
            const card = document.createElement("article");
            card.className = "supplier-card";

            const supplierName = document.createElement("h3");
            supplierName.textContent = item.fornecedor;

            const contractLabel = document.createElement("span");
            contractLabel.className = "supplier-label";
            contractLabel.textContent = "Número do contrato";

            const contractList = document.createElement("div");
            contractList.className = "contract-list";

            item.contratos.forEach((contractNumber) => {
                const contractTag = document.createElement("span");
                contractTag.className = "contract-number";
                contractTag.textContent = contractNumber;

                contractList.appendChild(contractTag);
            });

            const responsibleLabel = document.createElement("span");
            responsibleLabel.className = "supplier-label";
            responsibleLabel.textContent = "Usuário responsável";

            const responsibleList = document.createElement("div");
            responsibleList.className = "responsible-list";

            item.responsaveis.forEach((responsible) => {
                const responsibleName = document.createElement("p");
                responsibleName.className = "responsible-name";
                responsibleName.textContent = responsible;

                responsibleList.appendChild(responsibleName);
            });

            card.appendChild(supplierName);
            card.appendChild(contractLabel);
            card.appendChild(contractList);
            card.appendChild(responsibleLabel);
            card.appendChild(responsibleList);

            elements.supplierList.appendChild(card);
        });
    }

    function selectTutorial(tutorial) {
        if (!tutorial || !isValidYoutubeEmbedUrl(tutorial.youtubeEmbedUrl)) {
            return;
        }

        elements.videoPlaceholder.classList.add("hidden");
        elements.selectedTutorial.classList.remove("hidden");

        elements.selectedTutorialTitle.textContent = tutorial.title;
        elements.selectedTutorialDescription.textContent = tutorial.description;
        elements.tutorialIframe.src = tutorial.youtubeEmbedUrl;
        elements.tutorialIframe.title = `Vídeo tutorial: ${tutorial.title}`;

        elements.selectedTutorial.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function isAllowedEmail(email) {
        return email.endsWith(`@${APP_CONFIG.allowedDomain}`);
    }

    function isValidYoutubeEmbedUrl(url) {
        return (
            typeof url === "string" &&
            url.startsWith("https://www.youtube.com/embed/")
        );
    }

    async function generateSHA256(value) {
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        return hashArray
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    function normalizeText(value) {
        return value
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function showMessage(message) {
        elements.loginMessage.textContent = message;
    }

    function clearMessage() {
        elements.loginMessage.textContent = "";
    }

    function initializeAnimations() {
        const fadeElements = document.querySelectorAll(".fade-in");

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("show");
                    }
                });
            },
            {
                threshold: 0.15
            }
        );

        fadeElements.forEach((element) => {
            observer.observe(element);
        });
    }
});