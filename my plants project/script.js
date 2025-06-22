document.addEventListener('DOMContentLoaded', () => {
    const slides = [document.getElementById('slide-1'), document.getElementById('slide-2'), document.getElementById('slide-3')];
    const backgrounds = [document.getElementById('bg-1'), document.getElementById('bg-2'), document.getElementById('bg-3')];
    const startBtn = document.getElementById('startBtn');
    const mapBtn = document.getElementById('mapBtn');
    const backToStartBtn = document.getElementById('backToStartBtn');
    const backToExplorerBtn = document.getElementById('backToExplorerBtn');
    const mapContainer = document.getElementById('map-container');
    const geminiModal = document.getElementById('geminiModal');
    const modalTitle = document.getElementById('modalTitle');
    const geminiTextContent = document.getElementById('geminiTextContent');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const spinner = geminiModal.querySelector('.spinner');
    const plantNameInput = document.getElementById('plantNameInput');
    const explorerButtons = document.querySelectorAll('#slide-2 button[data-type]');

    function showSlide(index) {
        backgrounds.forEach((bg, i) => bg.style.opacity = (i === index) ? '1' : '0');
        slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    }

    startBtn.addEventListener('click', () => showSlide(1));
    mapBtn.addEventListener('click', () => showSlide(2));
    backToExplorerBtn.addEventListener('click', () => showSlide(1)); 
    backToStartBtn.addEventListener('click', () => showSlide(0));

    async function handleSearch(plantName, type) {
        // Modal and spinner logic...
    }

    explorerButtons.forEach(button => {
        button.addEventListener('click', () => {
            const plantName = plantNameInput.value.trim();
            if (plantName) handleSearch(plantName, button.dataset.type);
            else alert('الرجاء إدخال اسم النبات أولاً.');
        });
    });

    closeModalBtn.addEventListener('click', () => geminiModal.style.display = 'none');

    // Load map
    fetch('map.svg')
        .then(response => response.text())
        .then(svgData => {
            mapContainer.innerHTML = svgData;
            const map = document.getElementById('saudi-map');
            const provinceArabicNames = { /* ... all province names ... */ };
            map.addEventListener('click', (event) => {
                const provinceElement = event.target.closest('.province');
                if (provinceElement) {
                    alert(`لقد نقرت على: ${provinceArabicNames[provinceElement.id]}`);
                }
            });
        });

    showSlide(0);
});