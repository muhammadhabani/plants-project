document.addEventListener('DOMContentLoaded', () => {

    // --- Global Elements and Navigation (تكون موجودة في كلا الصفحتين أو تتفاعل بينهما) ---
    // هذه الأزرار موجودة في صفحات مختلفة ولكنها تربط الصفحات ببعضها، لذلك يتم تعريفها في النطاق العام
    const goToMapBtn = document.getElementById('goToMapBtn');
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    const backToMainFromListBtn = document.getElementById('backToMainFromListBtn');

    // --- Global Data Storage ---
    let plantsData = []; // بيانات مستكشف النباتات
    let provincesInfoData = []; // بيانات معلومات المناطق
    let currentPlantListData = []; // لتخزين البيانات التي يتم تحميلها (نادرة أو غازية)
    let highlightedProvince = null; // لتتبع المنطقة المميزة حالياً في الخريطة

    // --- Data Fetching Functions ---
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

    async function fetchProvincesInfo() {
        try {
            const response = await fetch('provinces_info.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            provincesInfoData = await response.json();
            console.log('Provinces info loaded:', provincesInfoData);
        } catch (error) {
            console.error('Could not fetch provinces info:', error);
        }
    }

    // دالة لجلب بيانات قوائم النباتات (النادرة/الغازية)
    async function fetchSpecificPlantList(filePath) {
        // السبينر في صفحات القوائم
        const plantsListSpinner = document.getElementById('plantsListContainer') ? document.getElementById('plantsListContainer').querySelector('.spinner') : null;
        const plantsList = document.getElementById('plantsList');

        if (plantsListSpinner) plantsListSpinner.style.display = 'block';
        if (plantsList) plantsList.innerHTML = '';

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            currentPlantListData = await response.json();
            console.log(`Loaded from ${filePath}:`, currentPlantListData);
            renderPlantList(currentPlantListData);
        } catch (error) {
            console.error(`Could not fetch plant list from ${filePath}:`, error);
            if (plantsList) plantsList.innerHTML = `<li class="text-red-500 text-center">حدث خطأ أثناء تحميل القائمة: ${error.message}</li>`;
        } finally {
            if (plantsListSpinner) plantsListSpinner.style.display = 'none';
        }
    }

    // دالة لعرض قائمة النباتات في الـ UL (تم تحديثها لدعم كل أنواع البيانات)
    function renderPlantList(plantsToDisplay) {
        const plantsList = document.getElementById('plantsList'); // يجب إعادة تعريفها هنا
        if (!plantsList) return;

        plantsList.innerHTML = '';
        if (plantsToDisplay.length === 0) {
            plantsList.innerHTML = '<li class="text-gray-600 text-center">لا توجد نباتات مطابقة لمعايير البحث.</li>';
            return;
        }

        plantsToDisplay.forEach(plant => {
            const listItem = document.createElement('li');
            listItem.className = 'bg-white/70 p-4 rounded-lg shadow-sm border border-gray-200';
            let content = `<h4 class="text-xl font-bold text-gray-800">${plant.name}`;
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
        const plantSearchInput = document.getElementById('plantSearchInput'); // يجب إعادة تعريفها هنا
        if (!plantSearchInput) return;

        const searchTerm = plantSearchInput.value.trim().toLowerCase();
        if (!searchTerm) {
            renderPlantList(currentPlantListData);
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
        renderPlantList(filteredPlants);
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
        fetchProvincesInfo();

        const provinceInfoModal = document.getElementById('provinceInfoModal');
        const closeProvinceModalBtn = document.getElementById('closeProvinceModalBtn');
        const provinceModalTitle = document.getElementById('provinceModalTitle');
        const provinceDetails = document.getElementById('provinceDetails');
        const provinceDetailsText = document.getElementById('provinceDetailsText');
        const provinceSpinner = provinceInfoModal ? provinceInfoModal.querySelector('.spinner') : null;

        // تعريف عناصر البحث في الخريطة هنا فقط
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
            if (provinceSpinner) provinceSpinner.style.display = 'block';
            if (provinceDetailsText) provinceDetailsText.innerHTML = '';

            const prompt = `بصفتك خبير نباتات متخصص في الغطاء النباتي للمملكة العربية السعودية، اذكر أبرز أنواع النباتات الشائعة أو المميزة التي تنمو في منطقة
