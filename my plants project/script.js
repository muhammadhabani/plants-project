document.addEventListener('DOMContentLoaded', () => {
    const slides = Array.from(document.querySelectorAll('.slide'));
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const geminiModal = document.getElementById('geminiModal');
    const modalTitle = document.getElementById('modalTitle');
    const plantImage = document.getElementById('plantImage');
    const geminiTextContent = document.getElementById('geminiTextContent');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const spinner = document.querySelector('.spinner');
    const plantNameInput = document.getElementById('plantNameInput');
    const generalInfoBtn = document.getElementById('generalInfoBtn');
    const traditionalUsesBtn = document.getElementById('traditionalUsesBtn');
    const otherNamesBtn = document.getElementById('otherNamesBtn');
    const scientificNameBtn = document.getElementById('scientificNameBtn');
    let currentSlideIndex = 0;
    let plantImagesData = [];

    async function loadPlantData() {
        try {
            const response = await fetch('plants.json');
            plantImagesData = await response.json();
        } catch (error) {
            console.error("Could not load plant data:", error);
        }
    }

    function getPlantImageUrl(plantName) {
        if (!plantName) return null;
        const plant = plantImagesData.find(p => p.name.toLowerCase() === plantName.trim().toLowerCase());
        return plant ? plant.imageUrl : null;
    }
    
    function convertMarkdownToHtml(text) {
        return text ? text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') : '';
    }

    function showSlide(index) {
        slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === slides.length - 1;
    }

    async function callGeminiAPI(prompt, title, plantName) {
        modalTitle.textContent = title;
        geminiTextContent.innerHTML = '';
        plantImage.classList.add('hidden');
        spinner.classList.remove('hidden');
        geminiModal.classList.remove('hidden');

        try {
            const response = await fetch('/.netlify/functions/fetch-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (!result.candidates || result.candidates.length === 0) throw new Error("No valid response from Gemini.");
            
            geminiTextContent.innerHTML = convertMarkdownToHtml(result.candidates[0].content.parts[0].text);
            const imageUrl = getPlantImageUrl(plantName);
            if (imageUrl) {
                plantImage.src = imageUrl;
                plantImage.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Error in callGeminiAPI:", error);
            geminiTextContent.innerHTML = `<p class="text-red-600">عذرًا، حدث خطأ أثناء جلب المعلومات. يرجى المحاولة مرة أخرى.<br><small>${error.message}</small></p>`;
        } finally {
            spinner.classList.add('hidden');
        }
    }

    function handleSearch(promptTemplate, titleTemplate) {
        const plantName = plantNameInput.value.trim();
        if (!plantName) return alert('الرجاء إدخال اسم النبات أولاً.');
        const prompt = promptTemplate.replace(/{plantName}/g, plantName);
        const title = titleTemplate.replace(/{plantName}/g, plantName);
        callGeminiAPI(prompt, title, plantName);
    }

    nextBtn.addEventListener('click', () => showSlide(++currentSlideIndex));
    prevBtn.addEventListener('click', () => showSlide(--currentSlideIndex));
    
    generalInfoBtn.addEventListener('click', () => handleSearch(`بصفتك خبير نباتات متخصص في شبه الجزيرة العربية، قدم لمحة عامة وموجزة عن نبات {plantName}.`, `معلومات عامة عن {plantName}`));
    traditionalUsesBtn.addEventListener('click', () => handleSearch(`بصفتك باحث في التراث وعلم النباتات الشعبي السعودي، فصل لي الاستخدامات التقليدية لنبات {plantName}.`, `استخدامات {plantName} التقليدية`));
    otherNamesBtn.addEventListener('click', () => handleSearch(`ما هي الأسماء المحلية أو الشعبية الأخرى لنبات {plantName} المستخدمة في المملكة العربية السعودية؟`, `أسماء أخرى لـ {plantName}`));
    scientificNameBtn.addEventListener('click', () => handleSearch(`بصفتك عالم نباتات، ما هو الاسم العلمي الدقيق لنبات {plantName}؟`, `الاسم العلمي لـ {plantName}`));
    
    closeModalBtn.addEventListener('click', () => geminiModal.classList.add('hidden'));
    geminiModal.addEventListener('click', (e) => e.target === geminiModal && geminiModal.classList.add('hidden'));
    
    loadPlantData().then(() => showSlide(currentSlideIndex));
});