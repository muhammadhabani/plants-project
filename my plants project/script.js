document.addEventListener('DOMContentLoaded', () => { // بداية DOMContentLoaded

    console.log('DOM Content Loaded: script.js started.');

    // --- Global Elements and Navigation ---
    const goToMapBtn = document.getElementById('goToMapBtn');
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    const backToMainFromListBtn = document.getElementById('backToMainFromListBtn');

    // --- Global Data Storage ---
    let plantsData = [];
    let provincesInfoData = [];
    let currentPlantListData = [];
    let highlightedProvince = null;

    // --- Data Fetching Functions ---
    async function fetchPlantsData() {
        console.log('Fetching plants.json...');
        try {
            const response = await fetch('plants.json');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            plantsData = await response.json();
            console.log('Plants data loaded successfully:', plantsData);
        } catch (error) {
            console.error('Could not fetch plants data:', error);
        }
    }

    async function fetchProvincesInfo() {
        console.log('Fetching provinces_info.json...');
        try {
            const response = await fetch('documents/provinces_info.json'); 
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            provincesInfoData = await response.json();
            console.log('Provinces info loaded successfully:', provincesInfoData);
        } catch (error) {
            console.error('Could not fetch provinces info:', error);
        }
    }

    // دالة لجلب بيانات قوائم النباتات (النادرة/الغازية)
    async function fetchSpecificPlantList(filePath) {
        const plantsListContainer = document.getElementById('plantsListContainer');
        const plantsListSpinner = plantsListContainer ? plantsListContainer.querySelector('.spinner') : null;
        const plantsList = document.getElementById('plantsList');

        console.log(`fetchSpecificPlantList called for: ${filePath}`);

        if (plantsListSpinner) plantsListSpinner.style.display = 'block';
        if (plantsList) plantsList.innerHTML = ''; // مسح القائمة الحالية

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            currentPlantListData = await response.json();
            console.log(`Data loaded for ${filePath}:`, currentPlantListData);
            renderPlantList(currentPlantListData); // عرض القائمة بعد الجلب مباشرة
        } catch (error) {
            console.error(`ERROR: Could not fetch plant list from ${filePath}:`, error);
            if (plantsList) plantsList.innerHTML = `<li class="text-red-500 text-center">حدث خطأ أثناء تحميل القائمة: ${error.message}<br>يرجى التأكد من وجود ملف JSON في المسار الصحيح (${filePath}) واسمه الصحيح.</li>`;
        } finally {
            if (plantsListSpinner) plantsListSpinner.style.display = 'none';
        }
    }

    // دالة لعرض قائمة النباتات في الـ UL
    function renderPlantList(plantsToDisplay) {
        const plantsList = document.getElementById('plantsList');
        if (!plantsList) {
            console.warn('plantsList element not found for rendering.');
            return;
        }

        console.log('renderPlantList called with data:', plantsToDisplay);

        plantsList.innerHTML = '';
        if (!plantsToDisplay || plantsToDisplay.length === 0) {
            plantsList.innerHTML = '<li class="text-gray-600 text-center">لا توجد نباتات لعرضها أو لا توجد نتائج مطابقة.</li>';
            console.log('No plants to display or empty array.');
            return;
        }

        plantsToDisplay.forEach(plant => {
            const listItem = document.createElement('li');
            listItem.className = 'bg-white/70 p-4 rounded-lg shadow-sm border border-gray-200';
            let content = `<h4 class="text-xl font-bold text-gray-800">${plant.name || 'غير معروف'}`;
            if (plant.scientific_name) {
                content += ` (<span class="italic text-sm text-gray-600">${plant.scientific_name}</span>)`;
            }
            content += `</h4>`;
            
            if (plant.local_names && plant.local_names.length > 0) {
                content += `<p class="text-sm text-gray-600 mt-1">الأسماء المحلية: ${plant.local_names.join(', ')}</p>`;
            }
            if (plant.status) {
                content += `<p class="text-md font-semibold text-blue-700 mt-2">الحالة: ${plant.status}</p>`;
            } else if (plant.impact) {
                content += `<p class="text-md font-semibold text-orange-700 mt-2">التأثير: ${plant.impact}</p>`;
            }

            if (plant.family) {
                content += `<p class="text-sm text-gray-700 mt-1">العائلة: ${plant.family}</p>`;
            }
            if (plant.origin) {
                content += `<p class="text-sm text-gray-700 mt-1">الموطن الأصلي: ${plant.origin}</p>`;
            }
            if (plant.propagation_methods) {
                content += `<p class="text-sm text-gray-700 mt-1">طرق الإكثار: ${plant.propagation_methods}</p>`;
            }
            if (plant.distribution_in_sa) {
                content += `<p class="text-sm text-gray-700 mt-1">التوزيع في السعودية: ${plant.distribution_in_sa}</p>`;
            }
            if (plant.habit) {
                content += `<p class="text-sm text-gray-700 mt-1">الشكل: ${plant.habit}</p>`;
            }
            
            if (plant.description) {
                content += `<p class="text-sm text-gray-700 mt-2">${plant.description}</p>`;
            }
            
            listItem.innerHTML = content;
            plantsList.appendChild(listItem);
        });
    }

    // دالة لتصفية قائمة النباتات بناءً على البحث
    function filterPlantsList() {
        const plantSearchInput = document.getElementById('plantSearchInput');
        if (!plantSearchInput) {
            console.warn('plantSearchInput element not found for filtering.');
            return;
        }

        const searchTerm = plantSearchInput.value.trim().toLowerCase();
        console.log('Filtering list with search term:', searchTerm);

        if (!currentPlantListData || currentPlantListData.length === 0) {
            console.warn('currentPlantListData is empty or null, cannot filter.');
            renderPlantList([]);
            return;
        }
        
        const filteredPlants = currentPlantListData.filter(plant => {
            if (plant.name && plant.name.toLowerCase().includes(searchTerm)) return true;
            if (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchTerm)) return true;
            if (plant.local_names && plant.local_names.some(name => name.toLowerCase().includes(searchTerm))) return true;
            
            if (plant.status && plant.status.toLowerCase().includes(searchTerm)) return true;
            if (plant.description && plant.description.toLowerCase().includes(searchTerm)) return true;
            if (plant.propagation_methods && plant.propagation_methods.toLowerCase().includes(searchTerm)) return true;

            if (plant.impact && plant.impact.toLowerCase().includes(searchTerm)) return true;
            if (plant.origin && plant.origin.toLowerCase().includes(searchTerm)) return true;
            if (plant.family && plant.family.toLowerCase().includes(searchTerm)) return true;
            if (plant.distribution_in_sa && plant.distribution_in_sa.toLowerCase().includes(searchTerm)) return true;
            if (plant.habit && plant.habit.toLowerCase().includes(searchTerm)) return true;

            return false;
        });
        console.log('Filtered plants:', filteredPlants);
        renderPlantList(filteredPlants);
    }


    // --- Logic specific to index.html (Main Page) ---
    const slide1 = document.getElementById('slide-1');

    if (slide1) {
        console.log('index.html page detected.');
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
            console.log('Showing slide:', index);
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
            console.log(`Handling Gemini search for: ${plantName}, type: ${type}`);
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
        
        if (window.location.hash === '#explorer') {
            showSlide(1);
        } else {
            showSlide(0);
        }
    }
    
    // --- Logic specific to map.html (Map Page) ---
    const map = document.getElementById('saudi-map'); 

    if (map) {
        console.log('map.html page detected.');
        fetchPlantsData();
        fetchProvincesInfo();

        const provinceInfoModal = document.getElementById('provinceInfoModal');
        const closeProvinceModalBtn = document.getElementById('closeProvinceModalBtn');
        const provinceModalTitle = document.getElementById('provinceModalTitle');
        const provinceDetails = document.getElementById('provinceDetails');
        const provinceDetailsText = document.getElementById('provinceDetailsText');
        const provinceSpinner = provinceInfoModal ? provinceInfoModal.querySelector('.spinner') : null;

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

        function resetProvinceHighlight() {
            if (highlightedProvince) {
                highlightedProvince.style.fill = '';
                highlightedProvince.style.stroke = '';
                highlightedProvince.style.transform = '';
                highlightedProvince = null;
            }
        }

        function highlightProvince(provinceId) {
            resetProvinceHighlight();
            const targetProvince = document.getElementById(provinceId);
            if (targetProvince) {
                targetProvince.style.fill = '#FFD700'; // لون أصفر ذهبي للتمييز
                targetProvince.style.stroke = '#FF4500'; // حدود حمراء برتقالية
                targetProvince.style.transform = 'scale(1.02)'; // تكبير بسيط
                highlightedProvince = targetProvince;
            }
        }

        async function handleGeminiProvinceSearch(provinceName) {
            console.log(`Handling Gemini search for province: ${provinceName}`);
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
                    provinceDetailsText.innerHTML = `<div class="text-center p-4 bg-red-100"><p class="font-bold">حدث خطأ</p><p class="text-sm mt-2">${error.message}</p></div>`;
                }
            } finally {
                if (provinceSpinner) provinceSpinner.style.display = 'none';
            }
        }


        map.addEventListener('click', (event) => {
            console.log('Map clicked.');
            resetProvinceHighlight();

            const provinceElement = event.target.closest('.province');
            if (provinceElement) {
                const provinceId = provinceElement.id;
                const arabicName = provinceArabicNames[provinceId] || 'منطقة غير معروفة';
                
                highlightProvince(provinceId);
                
                if (provinceModalTitle) provinceModalTitle.textContent = `معلومات عن ${arabicName}`;
                
                if (provinceDetails) {
                    if (provinceSpinner) provinceSpinner.style.display = 'none';
                    if (provinceDetailsText) provinceDetailsText.innerHTML = '';

                    const currentProvinceInfo = provincesInfoData.find(info => info.id === provinceId);
                    if (currentProvinceInfo && currentProvinceInfo.description) {
                        provinceDetailsText.innerHTML += `
                            <h4 class="text-xl font-bold text-gray-800 mb-2">${currentProvinceInfo.arabic_name}</h4>
                            <p class="mb-4">${currentProvinceInfo.description}</p>
                            <hr class="border-gray-300 my-4">
                        `;
                    } else {
                        provinceDetailsText.innerHTML += `<p class="mb-4 text-gray-600">لا توجد معلومات وصفية محلية عن هذه المنطقة.</p>`;
                    }

                    const plantsInProvince = plantsData.filter(plant => plant.province === provinceId);
                    if (plantsInProvince.length > 0) {
                        provinceDetailsText.innerHTML += `<h4 class="text-xl font-bold text-gray-800 mb-2">النباتات المتوفرة محلياً:</h4>`;
                        let plantsHtml = '<ul class="list-disc list-inside space-y-2">';
                        plantsInProvince.forEach(plant => {
                            plantsHtml += `<li class="text-gray-700">
                                                <span class="font-bold text-green-700">${plant.name}</span> 
                                                (<span class="italic text-sm">${plant.scientific_name}</span>)
                                                <p class="text-xs text-gray-500 mt-1">${plant.info.substring(0, 100)}...</p>
                                            </li>`;
                        });
                        plantsHtml += '</ul>';
                        provinceDetailsText.innerHTML += plantsHtml;
                    } else {
                        provinceDetailsText.innerHTML += `<p class="mb-4 text-gray-600">لا توجد بيانات نباتات متوفرة محلياً لهذه المنطقة.</p>`;
                        provinceDetailsText.innerHTML += `<p class="text-gray-600">جاري البحث عن نباتات شائعة عبر الذكاء الاصطناعي...</p>`;
                        handleGeminiProvinceSearch(arabicName);
                    }
                    if (provinceInfoModal) provinceInfoModal.style.display = 'flex';
                }
            }
        });

        if (closeProvinceModalBtn) {
            closeProvinceModalBtn.addEventListener('click', () => { 
                if (provinceInfoModal) provinceInfoModal.style.display = 'none';
                resetProvinceHighlight();
            });
        }
        if (provinceInfoModal) {
            provinceInfoModal.addEventListener('click', (event) => {
                if (event.target === provinceInfoModal) {
                    provinceInfoModal.style.display = 'none';
                    resetProvinceHighlight();
                }
            });
        }

        if (searchProvinceBtn && provinceSearchInput) {
            searchProvinceBtn.addEventListener('click', () => {
                console.log('Province search button clicked.');
                const searchTerm = provinceSearchInput.value.trim().toLowerCase();
                let foundProvinceId = null;

                for (const id in provinceArabicNames) {
                    if (provinceArabicNames[id].toLowerCase().includes(searchTerm) || id.toLowerCase().includes(searchTerm)) {
                        foundProvinceId = id;
                        break;
                    }
                }

                if (foundProvinceId) {
                    console.log('Province found:', foundProvinceId);
                    highlightProvince(foundProvinceId);
                    const arabicName = provinceArabicNames[foundProvinceId];
                    if (provinceModalTitle) provinceModalTitle.textContent = `معلومات عن ${arabicName}`;
                    
                    if (provinceDetails) {
                        if (provinceSpinner) provinceSpinner.style.display = 'none';
                        if (provinceDetailsText) provinceDetailsText.innerHTML = '';

                        const currentProvinceInfo = provincesInfoData.find(info => info.id === foundProvinceId);
                        if (currentProvinceInfo && currentProvinceInfo.description) {
                            provinceDetailsText.innerHTML += `
                                <h4 class="text-xl font-bold text-gray-800 mb-2">${currentProvinceInfo.arabic_name}</h4>
                                <p class="mb-4">${currentProvinceInfo.description}</p>
                                <hr class="border-gray-300 my-4">
                            `;
                        } else {
                            provinceDetailsText.innerHTML += `<p class="mb-4 text-gray-600">لا توجد معلومات وصفية محلية عن هذه المنطقة.</p>`;
                        }

                        const plantsInProvince = plantsData.filter(plant => plant.province === foundProvinceId);
                        if (plantsInProvince.length > 0) {
                            provinceDetailsText.innerHTML += `<h4 class="text-xl font-bold text-gray-800 mb-2">النباتات المتوفرة محلياً:</h4>`;
                            let plantsHtml = '<ul class="list-disc list-inside space-y-2">';
                            plantsInProvince.forEach(plant => {
                                plantsHtml += `<li class="text-gray-700">
                                                    <span class="font-bold text-green-700">${plant.name}</span> 
                                                    (<span class="italic text-sm">${plant.scientific_name}</span>)
                                                    <p class="text-xs text-gray-500 mt-1">${plant.info.substring(0, 100)}...</p>
                                                </li>`;
                            });
                            plantsHtml += '</ul>';
                            provinceDetailsText.innerHTML += plantsHtml;
                        } else {
                            provinceDetailsText.innerHTML += `<p class="mb-4 text-gray-600">لا توجد بيانات نباتات متوفرة محلياً لهذه المنطقة.</p>`;
                            provinceDetailsText.innerHTML += `<p class="text-gray-600">جاري البحث عن نباتات شائعة عبر الذكاء الاصطناعي...</p>`;
                            handleGeminiProvinceSearch(arabicName);
                        }
                        if (provinceInfoModal) provinceInfoModal.style.display = 'flex';
                    }

                } else {
                    alert('لم يتم العثور على منطقة بهذا الاسم. يرجى التأكد من الإملاء.');
                    resetProvinceHighlight();
                }
            });

            provinceSearchInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    searchProvinceBtn.click();
                }
            });
        }

    } // نهاية كتلة map.html


    // --- General Navigation between index.html and other pages ---
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

    if (backToMainFromListBtn) {
        backToMainFromListBtn.addEventListener('click', () => {
            window.location.href = 'index.html#explorer';
        });
    }

    // --- Logic for Specific Plant Lists (Rare/Invasive) ---
    const plantsListElement = document.getElementById('plantsList');
    const plantSearchInputElement = document.getElementById('plantSearchInput');
    const searchPlantListBtn = document.getElementById('searchPlantListBtn');

    if (plantsListElement) {
        console.log('Plant List page detected. Initializing...');
        const path = window.location.pathname;
        console.log('Current path for list page:', path);
        
        // تعديل الشرط لجعل التحقق أكثر مرونة ودقة
        const filename = path.split('/').pop(); // استخراج اسم الملف فقط (مثلاً rare-plants-list.html)
        console.log('Extracted filename for list page:', filename); // تشخيص: ما هو اسم الملف المستخرج؟

        if (filename === 'rare-plants-list.html') { // استخدام مقارنة مباشرة
            console.log('Detected Rare/Endangered Plants List page. Fetching data...');
            fetchSpecificPlantList('documents/rare_endangered_plants.json');
        } else if (filename === 'invasive-plants-list.html') { // استخدام مقارنة مباشرة
            console.log('Detected Invasive Plants List page. Fetching data...');
            fetchSpecificPlantList('documents/invasive_plants.json');
        } else {
            console.warn('Could not identify specific list page based on filename.'); // تشخيص: إذا لم يتطابق أي مسار
        }

        if (plantSearchInputElement && searchPlantListBtn) {
            console.log('Attaching search event listeners to list page.');
            searchPlantListBtn.addEventListener('click', filterPlantsList);
            plantSearchInputElement.addEventListener('input', filterPlantsList);
        } else if (plantSearchInputElement && !searchPlantListBtn) {
            console.log('Search button not found, but attaching input listener for instant search.');
            plantSearchInputElement.addEventListener('input', filterPlantsList);
        } else {
            console.warn('Neither search input nor search button found for list page. No search functionality will be active.');
        }
    }


}); // نهاية DOMContentLoaded
