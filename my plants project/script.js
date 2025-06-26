document.addEventListener('DOMContentLoaded', () => {

    // --- Global Elements and Navigation (تكون موجودة في كلا الصفحتين أو تتفاعل بينهما) ---
    const goToMapBtn = document.getElementById('goToMapBtn'); // الزر في index.html للانتقال للخريطة
    const backToHomeBtn = document.getElementById('backToHomeBtn'); // زر العودة من الخريطة إلى index.html

    // متغير لتخزين بيانات النباتات
    let plantsData = [];
    let highlightedProvince = null; // لتتبع المنطقة المميزة حالياً

    // دالة لجلب بيانات النباتات
    async function fetchPlantsData() {
        try {
            const response = await fetch('plants.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            plantsData = await response.json();
            console.log('Plants data loaded:', plantsData);
        } catch (error) {
            console.error('Could not fetch plants data:', error);
        }
    }

    // --- Logic specific to index.html (Main Page) ---
    const slide1 = document.getElementById('slide-1');

    if (slide1) {
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
        
        showSlide(0);
    } // نهاية if (slide1)
    
    // --- Logic specific to map.html (Map Page) ---
    const map = document.getElementById('saudi-map'); 

    if (map) {
        fetchPlantsData();

        const provinceInfoModal = document.getElementById('provinceInfoModal');
        const closeProvinceModalBtn = document.getElementById('closeProvinceModalBtn');
        const provinceModalTitle = document.getElementById('provinceModalTitle');
        const provinceDetails = document.getElementById('provinceDetails');
        const provinceDetailsText = document.getElementById('provinceDetailsText');
        const provinceSpinner = provinceInfoModal ? provinceInfoModal.querySelector('.spinner') : null;

        // عناصر البحث الجديدة
        const provinceSearchInput = document.getElementById('provinceSearchInput');
        const searchProvinceBtn = document.getElementById('searchProvinceBtn');


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

        // دالة لإزالة التظليل من المناطق
        function resetProvinceHighlight() {
            if (highlightedProvince) {
                highlightedProvince.style.fill = ''; // إعادة اللون الافتراضي (من CSS)
                highlightedProvince.style.stroke = ''; // إعادة الحدود الافتراضية
                highlightedProvince.style.transform = ''; // إزالة أي تحريك
                highlightedProvince = null;
            }
        }

        // دالة لتمييز منطقة معينة
        function highlightProvince(provinceId) {
            resetProvinceHighlight(); // إزالة التمييز السابق أولاً
            const targetProvince = document.getElementById(provinceId);
            if (targetProvince) {
                targetProvince.style.fill = '#FFD700'; // لون أصفر ذهبي للتمييز
                targetProvince.style.stroke = '#FF4500'; // حدود حمراء برتقالية
                targetProvince.style.transform = 'scale(1.02)'; // تكبير بسيط
                highlightedProvince = targetProvince;
                
                // يمكنك أيضًا التمرير إلى المنطقة إذا كانت الخريطة كبيرة
                // targetProvince.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // دالة جديدة لاستدعاء Gemini للحصول على معلومات المناطق
        async function handleGeminiProvinceSearch(provinceName) {
            if (provinceSpinner) provinceSpinner.style.display = 'block';
            if (provinceDetailsText) provinceDetailsText.innerHTML = '';

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
            resetProvinceHighlight(); // إزالة التمييز عند النقر على أي مكان في الخريطة

            const provinceElement = event.target.closest('.province');
            if (provinceElement) {
                const provinceId = provinceElement.id;
                const arabicName = provinceArabicNames[provinceId] || 'منطقة غير معروفة';
                
                highlightProvince(provinceId); // تمييز المنطقة عند النقر
                
                if (provinceModalTitle) provinceModalTitle.textContent = `نباتات في ${arabicName}`;
                
                const plantsInProvince = plantsData.filter(plant => plant.province === provinceId);

                if (provinceDetails) {
                    if (provinceSpinner) provinceSpinner.style.display = 'none';
                    if (provinceDetailsText) provinceDetailsText.innerHTML = '';

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
                        provinceDetailsText.innerHTML = detailsHtml;
                    } else {
                        provinceDetailsText.innerHTML = `<p class="text-gray-600">جاري البحث عن نباتات شائعة في ${arabicName}...</p>`;
                        handleGeminiProvinceSearch(arabicName);
                    }
                    if (provinceInfoModal) provinceInfoModal.style.display = 'flex';
                }
            }
        });

        if (closeProvinceModalBtn) {
            closeProvinceModalBtn.addEventListener('click', () => { 
                if (provinceInfoModal) provinceInfoModal.style.display = 'none';
                resetProvinceHighlight(); // إزالة التمييز عند إغلاق الـ Modal
            });
        }
        if (provinceInfoModal) {
            provinceInfoModal.addEventListener('click', (event) => {
                if (event.target === provinceInfoModal) {
                    provinceInfoModal.style.display = 'none';
                    resetProvinceHighlight(); // إزالة التمييز عند النقر خارج الـ Modal
                }
            });
        }

        // --- Logic for Province Search Box ---
        if (searchProvinceBtn && provinceSearchInput) {
            searchProvinceBtn.addEventListener('click', () => {
                const searchTerm = provinceSearchInput.value.trim().toLowerCase();
                let foundProvinceId = null;

                // البحث عن المنطقة بالاسم العربي أو الإنجليزي (ID)
                for (const id in provinceArabicNames) {
                    if (provinceArabicNames[id].toLowerCase().includes(searchTerm) || id.toLowerCase().includes(searchTerm)) {
                        foundProvinceId = id;
                        break;
                    }
                }

                if (foundProvinceId) {
                    highlightProvince(foundProvinceId); // تمييز المنطقة
                    // يمكنك أيضاً فتح الـ Modal تلقائياً هنا إذا أردت
                    // ونعرض معلوماتها
                    const arabicName = provinceArabicNames[foundProvinceId];
                    if (provinceModalTitle) provinceModalTitle.textContent = `نباتات في ${arabicName}`;
                    const plantsInProvince = plantsData.filter(plant => plant.province === foundProvinceId);
                    
                    if (provinceDetails) {
                        if (provinceSpinner) provinceSpinner.style.display = 'none';
                        if (provinceDetailsText) provinceDetailsText.innerHTML = '';

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
                            provinceDetailsText.innerHTML = detailsHtml;
                        } else {
                            provinceDetailsText.innerHTML = `<p class="text-gray-600">جاري البحث عن نباتات شائعة في ${arabicName}...</p>`;
                            handleGeminiProvinceSearch(arabicName);
                        }
                        if (provinceInfoModal) provinceInfoModal.style.display = 'flex';
                    }

                } else {
                    alert('لم يتم العثور على منطقة بهذا الاسم. يرجى التأكد من الإملاء.');
                    resetProvinceHighlight(); // إزالة أي تمييز إذا لم يتم العثور على شيء
                }
            });

            // يمكن أيضاً تفعيل البحث عند الضغط على Enter
            provinceSearchInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    searchProvinceBtn.click();
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
