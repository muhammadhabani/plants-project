document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    document.addEventListener('DOMContentLoaded', () => {
    // --- Elements --- (هذا التعليق يمكنك إضافته لتنظيم الكود الخاص بك)
    const slides = [document.getElementById('slide-1'), document.getElementById('slide-2')];
    const backgrounds = [document.getElementById('bg-1'), document.getElementById('bg-2')];
    const startBtn = document.getElementById('startBtn');
    const backBtn = document.getElementById('backBtn');
    const geminiModal = document.getElementById('geminiModal');
    const modalTitle = document.getElementById('modalTitle');
    const geminiTextContent = document.getElementById('geminiTextContent');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const spinner = geminiModal.querySelector('.spinner');
    const plantNameInput = document.getElementById('plantNameInput');
    const explorerButtons = document.querySelectorAll('#slide-2 button[data-type]');

    // عناصر جديدة للخريطة (أضف هذه السطور هنا)
    const goToMapBtn = document.getElementById('goToMapBtn'); // الزر الجديد في index.html
    const map = document.getElementById('saudi-map'); // الخريطة نفسها في map.html
    const provinceInfoModal = document.getElementById('provinceInfoModal'); // الـ Modal الجديد للخريطة
    const closeProvinceModalBtn = document.getElementById('closeProvinceModalBtn'); // زر إغلاق الـ Modal
    const provinceModalTitle = document.getElementById('provinceModalTitle'); // عنوان الـ Modal
    const provinceDetails = document.getElementById('provinceDetails'); // محتوى تفاصيل المنطقة
    const backToHomeBtn = document.getElementById('backToHomeBtn'); // زر العودة من صفحة الخريطة إلى index.html

    // ... بقية الكود الحالي لديك في script.js ...
    // --- Slide Navigation ---
    // ...
    // --- SECURE API Call Logic ---
    // ...
    // --- Event Listeners ---
    // ...
    const slides = [document.getElementById('slide-1'), document.getElementById('slide-2')];
    const backgrounds = [document.getElementById('bg-1'), document.getElementById('bg-2')];
    const startBtn = document.getElementById('startBtn');
    const backBtn = document.getElementById('backBtn');
    const geminiModal = document.getElementById('geminiModal');
    const modalTitle = document.getElementById('modalTitle');
    const geminiTextContent = document.getElementById('geminiTextContent');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const spinner = geminiModal.querySelector('.spinner');
    const plantNameInput = document.getElementById('plantNameInput');
    const explorerButtons = document.querySelectorAll('#slide-2 button[data-type]');

    // --- Slide Navigation ---
    function showSlide(index) {
        backgrounds.forEach((bg, i) => { bg.style.opacity = (i === index) ? '1' : '0'; });
        slides.forEach((slide, i) => { slide.style.display = (i === index) ? 'flex' : 'none'; });
    }
    startBtn.addEventListener('click', () => showSlide(1));
    backBtn.addEventListener('click', () => showSlide(0));
    
    // --- SECURE API Call Logic ---
    async function handleSearch(plantName, type) {
        geminiModal.style.display = 'flex';
        spinner.style.display = 'block';
        geminiTextContent.innerHTML = '';

        const titles = { info: "معلومات عامة", uses: "استخدامات تقليدية", names: "أسماء شعبية", scientific: "الاسم العلمي" };
        
        // --- *** UPDATED PROMPTS *** ---
        // The prompts are now more detailed and direct the AI to not mention its role.
        const prompts = {
            info: `بصفتك خبير نباتات متخصص في الغطاء النباتي للمملكة العربية السعودية، قدم وصفاً تعريفياً موجزاً لنبات '${plantName}'. ركز على شكله المميز، وبيئته الطبيعية التي ينمو فيها داخل المملكة. ابدأ الإجابة مباشرة.`,
            uses: `بصفتك باحث في التراث النباتي للمملكة، اذكر أبرز الاستخدامات التقليدية لنبات '${plantName}' في الثقافة السعودية، سواء كانت طبية أو غذائية. قدم الإجابة في نقاط واضحة. ابدأ الإجابة مباشرة دون تمهيد.`,
            names: `كمختص في اللهجات والنباتات المحلية، ما هي الأسماء الشعبية الأخرى الشائعة لنبات '${plantName}' في مختلف مناطق المملكة؟ ابدأ الإجابة مباشرة.`,
            scientific: `بصفتك عالم نباتات، ما هو الاسم العلمي الدقيق (Scientific Name) لنبات '${plantName}'؟ واذكر أيضاً اسم العائلة النباتية (Family) التي ينتمي إليها. أجب مباشرة.`
        };
        
        modalTitle.textContent = `${titles[type]} عن ${plantName}`;
        const prompt = prompts[type];

        try {
            // This securely calls our serverless function
            const response = await fetch('/.netlify/functions/fetch-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.candidates || result.candidates.length === 0) {
                throw new Error("No valid response from Gemini.");
            }
            
            geminiTextContent.innerHTML = result.candidates[0].content.parts[0].text.replace(/\n/g, '<br>');

        } catch (error) {
            console.error("Search Error:", error);
            geminiTextContent.innerHTML = `<div class="text-center p-4 bg-red-100"><p class="font-bold">حدث خطأ</p><p class="text-sm mt-2">${error.message}</p></div>`;
        } finally {
            spinner.style.display = 'none';
        }
    }

    // --- Event Listeners ---
    explorerButtons.forEach(button => {
        button.addEventListener('click', () => {
            const plantName = plantNameInput.value.trim();
            if (plantName) {
                handleSearch(plantName, button.dataset.type);
            } else {
                alert('الرجاء إدخال اسم النبات أولاً.');
            }
        });
    });
    
    closeModalBtn.addEventListener('click', () => { geminiModal.style.display = 'none'; });
    geminiModal.addEventListener('click', (event) => {
        if (event.target === geminiModal) geminiModal.style.display = 'none';
        // ... الكود الحالي الموجود في script.js ...

// --- Map Interaction Logic (سيتم تفعيله فقط في map.html) ---
// هذا الشرط يضمن أن الكود لن يحاول البحث عن عناصر الخريطة في index.html
// وبالتالي لن يسبب أخطاء إذا لم تكن هذه العناصر موجودة في الصفحة الحالية.
if (map) { // تحقق إذا كانت الخريطة موجودة في الصفحة الحالية
    const provinceArabicNames = {
        'albahah-province': 'منطقة الباحة',
        'eastern-province': 'المنطقة الشرقية',
        'najran-province': 'منطقة نجران',
        'riyadh-province': 'منطقة الرياض',
        'northern-borders_province': 'منطقة الحدود الشمالية',
        'alqassim-province': 'منطقة القصيم',
        'aseer-province': 'منطقة عسير',
        'jazan-province': 'منطقة جازان',
        'almadinah-province': 'منطقة المدينة المنورة',
        'hail-province': 'منطقة حائل',
        'tabuk-province': 'منطقة تبوك',
        'makkah-province': 'منطقة مكة المكرمة' // تأكد من إضافة ID مكة والجوْف إذا كانت موجودة في SVG
        // أضف مناطق أخرى هنا إذا كانت موجودة في SVG ولم يتم تضمينها
    };

    map.addEventListener('click', (event) => {
        const provinceElement = event.target.closest('.province');
        if (provinceElement) {
            const provinceId = provinceElement.id;
            const arabicName = provinceArabicNames[provinceId] || 'منطقة غير معروفة';

            // لفتح الـ Modal وعرض اسم المنطقة (مثال)
            provinceModalTitle.textContent = `معلومات عن ${arabicName}`;
            provinceDetails.innerHTML = `<p>هنا ستظهر معلومات مفصلة عن النباتات في <b>${arabicName}</b>.</p><p>يمكنك دمج منطق لجلب هذه البيانات من ملف JSON أو API.</p>`;
            provinceInfoModal.style.display = 'flex';
        }
    });

    // إغلاق الـ Modal الخاص بالخريطة
    if (closeProvinceModalBtn) {
        closeProvinceModalBtn.addEventListener('click', () => { provinceInfoModal.style.display = 'none'; });
    }
    if (provinceInfoModal) {
        provinceInfoModal.addEventListener('click', (event) => {
            if (event.target === provinceInfoModal) {
                provinceInfoModal.style.display = 'none';
            }
        });
    }
}

// --- Navigation for the new map page ---
if (goToMapBtn) { // تحقق من وجود الزر في index.html
    goToMapBtn.addEventListener('click', () => {
        window.location.href = 'map.html'; // الانتقال إلى صفحة الخريطة
    });
}

if (backToHomeBtn) { // تحقق من وجود الزر في map.html
    backToHomeBtn.addEventListener('click', () => {
        window.location.href = 'index.html'; // العودة إلى الصفحة الرئيسية
    });
}
    });

    // --- Initialize ---
    showSlide(0);
});
