document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    // المتغيرات الأصلية الموجودة في صفحة index.html
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

    // المتغيرات الجديدة الخاصة بصفحة الخريطة (map.html) والزر الجديد في index.html
    const goToMapBtn = document.getElementById('goToMapBtn'); // الزر في index.html للانتقال للخريطة
    const map = document.getElementById('saudi-map'); // الخريطة نفسها في map.html
    const provinceInfoModal = document.getElementById('provinceInfoModal'); // الـ Modal الجديد للخريطة في map.html
    const closeProvinceModalBtn = document.getElementById('closeProvinceModalBtn'); // زر إغلاق الـ Modal في map.html
    const provinceModalTitle = document.getElementById('provinceModalTitle'); // عنوان الـ Modal في map.html
    const provinceDetails = document.getElementById('provinceDetails'); // محتوى تفاصيل المنطقة في map.html
    const backToHomeBtn = document.getElementById('backToHomeBtn'); // زر العودة من الخريطة إلى index.html


    // --- Slide Navigation for index.html ---
    function showSlide(index) {
        // تأكد من وجود الخلفيات قبل محاولة الوصول إلى style.opacity
        if (backgrounds[0] && backgrounds[1]) {
            backgrounds.forEach((bg, i) => { bg.style.opacity = (i === index) ? '1' : '0'; });
        }
        slides.forEach((slide, i) => { slide.style.display = (i === index) ? 'flex' : 'none'; });
    }

    // استمع لزر "ابدأ الرحلة" في الصفحة الأولى
    if (startBtn) {
        startBtn.addEventListener('click', () => showSlide(1));
    }
    // استمع لزر "العودة للبداية" في صفحة مستكشف النباتات
    if (backBtn) {
        backBtn.addEventListener('click', () => showSlide(0));
    }


    // --- SECURE API Call Logic (for plant explorer in index.html) ---
    async function handleSearch(plantName, type) {
        if (geminiModal) geminiModal.style.display = 'flex';
        if (spinner) spinner.style.display = 'block';
        if (geminiTextContent) geminiTextContent.innerHTML = '';

        const titles = { info: "معلومات عامة", uses: "استخدامات تقليدية", names: "أسماء شعبية", scientific: "الاسم العلمي" };

        const prompts = {
            info: `بصفتك خبير نباتات متخصص في الغطاء النباتي للمملكة العربية السعودية، قدم وصفاً تعريفياً موجزاً لنبات '${plantName}'. ركز على شكله المميز، وبيئته الطبيعية التي ينمو فيها داخل المملكة. ابدأ الإجابة مباشرة.`,
            uses: `بصفتك باحث في التراث النباتي للمملكة، اذكر أبرز الاستخدامات التقليدية لنبات '${plantName}' في الثقافة السعودية، سواء كانت طبية أو غذائية. قدم الإجابة في نقاط واضحة. ابدأ الإجابة مباشرة دون تمهيد.`,
            names: `كمختص في اللهجات والنباتات المحلية، ما هي الأسماء الشعبية الأخرى الشائعة لنبات '${plantName}' في مختلف مناطق المملكة؟ ابدأ الإجابة مباشرة.`,
            scientific: `بصفتك عالم نباتات، ما هو الاسم العلمي الدقيق (Scientific Name) لنبات '${plantName}'؟ واذكر أيضاً اسم العائلة النباتية (Family) التي ينتمي إليها. أجب مباشرة.`
        };

        if (modalTitle) modalTitle.textContent = `${titles[type]} عن ${plantName}`;
        const prompt = prompts[type];

        try {
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

            if (geminiTextContent) {
                geminiTextContent.innerHTML = result.candidates[0].content.parts[0].text.replace(/\n/g, '<br>');
            }

        } catch (error) {
            console.error("Search Error:", error);
            if (geminiTextContent) {
                geminiTextContent.innerHTML = `<div class="text-center p-4 bg-red-100"><p class="font-bold">حدث خطأ</p><p class="text-sm mt-2">${error.message}</p></div>`;
            }
        } finally {
            if (spinner) spinner.style.display = 'none';
        }
    }

    // --- Event Listeners for index.html ---
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

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => { if (geminiModal) geminiModal.style.display = 'none'; });
    }
    if (geminiModal) {
        geminiModal.addEventListener('click', (event) => {
            if (event.target === geminiModal) {
                geminiModal.style.display = 'none';
            }
        });
    }

    // --- Map Interaction Logic (سيتم تفعيله فقط في map.html) ---
    // هذا الشرط يضمن أن الكود لن يحاول البحث عن عناصر الخريطة في index.html
    // وبالتالي لن يسبب أخطاء إذا لم تكن هذه العناصر موجودة في الصفحة الحالية.
    if (map) { // تحقق إذا كانت الخريطة موجودة في الصفحة الحالية (أي map.html)
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
            'makkah-province': 'منطقة مكة المكرمة'
            'aljowf-province': 'منطقة الجوف'
            // أضف مناطق أخرى هنا إذا كانت موجودة في SVG ولم يتم تضمينها (مثل الجوف)
        };

        map.addEventListener('click', (event) => {
            const provinceElement = event.target.closest('.province');
            if (provinceElement) {
                const provinceId = provinceElement.id;
                const arabicName = provinceArabicNames[provinceId] || 'منطقة غير معروفة';
                
                // لفتح الـ Modal وعرض اسم المنطقة (مثال)
                if (provinceModalTitle) provinceModalTitle.textContent = `معلومات عن ${arabicName}`;
                if (provinceDetails) provinceDetails.innerHTML = `<p>هنا ستظهر معلومات مفصلة عن النباتات في <b>${arabicName}</b>.</p><p>يمكنك دمج منطق لجلب هذه البيانات من ملف JSON أو API.</p>`;
                if (provinceInfoModal) provinceInfoModal.style.display = 'flex';
            }
        });

        // إغلاق الـ Modal الخاص بالخريطة
        if (closeProvinceModalBtn) {
            closeProvinceModalBtn.addEventListener('click', () => { if (provinceInfoModal) provinceInfoModal.style.display = 'none'; });
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

    // --- Initialize ---
    // هذه الوظيفة تُشغل فقط عند تحميل index.html
    // تأكد أنك لا تستدعيها في map.html إذا كنت لا تريد سلوك الشرائح هناك.
    if (slides.length > 0 && backgrounds.length > 0) { // تأكد أن elements الشرائح موجودة
        showSlide(0);
    }
});
