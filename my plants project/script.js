document.addEventListener('DOMContentLoaded', () => {

    // --- Global Elements and Navigation (تكون موجودة في كلا الصفحتين أو تتفاعل بينهما) ---
    const goToMapBtn = document.getElementById('goToMapBtn'); // الزر في index.html للانتقال للخريطة
    const backToHomeBtn = document.getElementById('backToHomeBtn'); // زر العودة من الخريطة إلى index.html

    // متغير لتخزين بيانات النباتات
    let plantsData = [];

    // دالة لجلب بيانات النباتات
    async function fetchPlantsData() {
        try {
            const response = await fetch('plants.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            plantsData = await response.json();
            console.log('Plants data loaded:', plantsData); // للتأكد من تحميل البيانات
        } catch (error) {
            console.error('Could not fetch plants data:', error);
        }
    }

    // --- Logic specific to index.html (Main Page) ---
    const slide1 = document.getElementById('slide-1'); // نستخدم slide-1 كعلامة مميزة لصفحة index.html

    if (slide1) { // إذا كانت هذه الصفحة هي index.html
        const slides = [slide1, document.getElementById('slide-2')];
        const backgrounds = [document.getElementById('bg-1'), document.getElementById('bg-2')];
        const startBtn = document.getElementById('startBtn');
        const backBtn = document.getElementById('backBtn');
        
        const geminiModal = document.getElementById('geminiModal');
        const modalTitle = document.getElementById('modalTitle');
        const geminiTextContent = document.getElementById('geminiTextContent');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const spinner = geminiModal ? geminiModal.querySelector('.spinner') : null;

        const plantNameInput = document.getElementById('plantNameInput');
        const explorerButtons = document.querySelectorAll('#slide-2 button[data-type]');

        // --- Slide Navigation for index.html ---
        function showSlide(index) {
            if (backgrounds[0] && backgrounds[1]) {
                backgrounds.forEach((bg, i) => { bg.style.opacity = (i === index) ? '1' : '0'; });
            }
            slides.forEach((slide, i) => { slide.style.display = (i === index) ? 'flex' : 'none'; });
        }

        if (startBtn) {
            startBtn.addEventListener('click', () => showSlide(1));
        }
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
        
        // Initialize first slide on index.html
        showSlide(0);
    } // نهاية if (slide1)
    
    // --- Logic specific to map.html (Map Page) ---
    const map = document.getElementById('saudi-map'); 

    if (map) { // إذا كانت هذه الصفحة هي map.html
        // جلب بيانات النباتات عند تحميل صفحة الخريطة
        fetchPlantsData();

        const provinceInfoModal = document.getElementById('provinceInfoModal');
        const closeProvinceModalBtn = document.getElementById('closeProvinceModalBtn');
        const provinceModalTitle = document.getElementById('provinceModalTitle');
        const provinceDetails = document.getElementById('provinceDetails'); // Div الحاضن للمحتوى والسبينر
        const provinceDetailsText = document.getElementById('provinceDetailsText'); // الفقرة التي ستحمل النص
        const provinceSpinner = provinceInfoModal ? provinceInfoModal.querySelector('.spinner') : null; // السبينر الخاص بالخريطة

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
            'makkah-province': 'منطقة مكة المكرمة',
            'aljowf-province': 'منطقة الجوف'
        };

        // دالة جديدة لاستدعاء Gemini للحصول على معلومات المناطق
        async function handleGeminiProvinceSearch(provinceName) {
            if (provinceSpinner) provinceSpinner.style.display = 'block';
            if (provinceDetailsText) provinceDetailsText.innerHTML = ''; // مسح أي محتوى سابق

            const prompt = `بصفتك خبير نباتات متخصص في الغطاء النباتي للمملكة العربية السعودية، اذكر أبرز أنواع النباتات الشائعة أو المميزة التي تنمو في منطقة ${provinceName}. ابدأ الإجابة مباشرة في نقاط واضحة أو فقرة موجزة دون تمهيد.`;

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
                
                if (provinceDetailsText) {
                    provinceDetailsText.innerHTML = result.candidates[0].content.parts[0].text.replace(/\n/g, '<br>');
                }

            } catch (error) {
                console.error("Gemini Province Search Error:", error);
                if (provinceDetailsText) {
                    provinceDetailsText.innerHTML = `<div class="text-center p-4 bg-red-100"><p class="font-bold">حدث خطأ أثناء جلب المعلومات</p><p class="text-sm mt-2">${error.message}</p></div>`;
                }
            } finally {
                if (provinceSpinner) provinceSpinner.style.display = 'none';
            }
        }


        map.addEventListener('click', (event) => {
            const provinceElement = event.target.closest('.province');
            if (provinceElement) {
                const provinceId = provinceElement.id;
                const arabicName = provinceArabicNames[provinceId] || 'منطقة غير معروفة';
                
                if (provinceModalTitle) provinceModalTitle.textContent = `نباتات في ${arabicName}`;
                
                // تصفية النباتات حسب المنطقة من البيانات المحلية
                const plantsInProvince = plantsData.filter(plant => plant.province === provinceId);

                if (provinceDetails) {
                    if (provinceSpinner) provinceSpinner.style.display = 'none'; // إخفاء السبينر افتراضيا
                    if (provinceDetailsText) provinceDetailsText.innerHTML = ''; // مسح المحتوى القديم

                    if (plantsInProvince.length > 0) {
                        let detailsHtml = '<ul class="list-disc list-inside space-y-2">';
                        plantsInProvince.forEach(plant => {
                            detailsHtml += `<li class="text-gray-700">
                                                <span class="font-bold text-green-700">${plant.name}</span> 
                                                (<span class="italic text-sm">${plant.scientific_name}</span>)
                                                <p class="text-xs text-gray-500 mt-1">${plant.info.substring(0, 100)}...</p>
                                            </li>`;
                        });
                        detailsHtml += '</ul>';
                        provinceDetailsText.innerHTML = detailsHtml; // عرض البيانات المحلية
                    } else {
                        // إذا لم يتم العثور على بيانات محلية، قم باستدعاء Gemini
                        provinceDetailsText.innerHTML = `<p class="text-gray-600">جاري البحث عن نباتات شائعة في ${arabicName}...</p>`;
                        handleGeminiProvinceSearch(arabicName); // استدعاء Gemini
                    }
                    if (provinceInfoModal) provinceInfoModal.style.display = 'flex'; // عرض الـ Modal
                }
            }
        });

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
    } // نهاية if (map)


    // --- General Navigation between index.html and map.html ---
    if (goToMapBtn) {
        goToMapBtn.addEventListener('click', () => {
            window.location.href = 'map.html';
        });
    }

    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

}); // نهاية DOMContentLoaded
