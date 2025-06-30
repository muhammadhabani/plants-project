document.addEventListener('DOMContentLoaded', () => { // بداية DOMContentLoaded

    console.log('DOM Content Loaded: script.js started.'); // تشخيص: بداية تحميل السكريبت

    // --- Global Elements and Navigation ---
    const goToMapBtn = document.getElementById('goToMapBtn');
    const backToHomeBtn = document.getElementById('backToHomeBtn'); // هذا الزر فقط في map.html
    const backToMainFromListBtn = document.getElementById('backToMainFromListBtn'); // هذا الزر فقط في rare/invasive pages

    // --- Global Data Storage ---
    let plantsData = [];
    let provincesInfoData = [];
    let currentPlantListData = []; // لبيانات القوائم النادرة/الغازية
    let highlightedProvince = null; // للمناطق في الخريطة

    // --- Data Fetching Functions ---
    async function fetchPlantsData() {
        console.log('Fetching plants.json...'); // تشخيص
        try {
            const response = await fetch('plants.json');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            plantsData = await response.json();
            console.log('Plants data loaded successfully:', plantsData); // تشخيص
        } catch (error) {
            console.error('Could not fetch plants data:', error); // تشخيص: خطأ في جلب plants.json
        }
    }

    async function fetchProvincesInfo() {
        console.log('Fetching provinces_info.json...'); // تشخيص
        try {
            const response = await fetch('provinces_info.json');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            provincesInfoData = await response.json();
            console.log('Provinces info loaded successfully:', provincesInfoData); // تشخيص
        } catch (error) {
            console.error('Could not fetch provinces info:', error); // تشخيص: خطأ في جلب provinces_info.json
        }
    }

    // دالة لجلب بيانات قوائم النباتات (النادرة/الغازية)
    async function fetchSpecificPlantList(filePath) {
        const plantsListContainer = document.getElementById('plantsListContainer');
        const plantsListSpinner = plantsListContainer ? plantsListContainer.querySelector('.spinner') : null;
        const plantsList = document.getElementById('plantsList');

        console.log(`fetchSpecificPlantList called for: ${filePath}`); // تشخيص: هل تم استدعاء الدالة؟

        if (plantsListSpinner) plantsListSpinner.style.display = 'block';
        if (plantsList) plantsList.innerHTML = ''; // مسح القائمة الحالية

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            currentPlantListData = await response.json();
            console.log(`Data loaded for ${filePath}:`, currentPlantListData); // تشخيص: هل تم تحميل البيانات؟
            renderPlantList(currentPlantListData); // عرض القائمة بعد الجلب مباشرة
        } catch (error) {
            console.error(`ERROR: Could not fetch plant list from ${filePath}:`, error); // تشخيص: خطأ في جلب ملف JSON للقائمة
            if (plantsList) plantsList.innerHTML = `<li class="text-red-500 text-center">حدث خطأ أثناء تحميل القائمة: ${error.message}<br>يرجى التأكد من وجود ملف JSON في المسار الصحيح (${filePath}) واسمه الصحيح.</li>`;
        } finally {
            if (plantsListSpinner) plantsListSpinner.style.display = 'none';
        }
    }

    // دالة لعرض قائمة النباتات في الـ UL
    function renderPlantList(plantsToDisplay) {
        const plantsList = document.getElementById('plantsList');
        if (!plantsList) {
            console.warn('plantsList element not found for rendering.'); // تشخيص: هل عنصر القائمة موجود؟
            return;
        }

        console.log('renderPlantList called with data:', plantsToDisplay); // تشخيص: ما هي البيانات التي ستعرض؟

        plantsList.innerHTML = '';
        if (!plantsToDisplay || plantsToDisplay.length === 0) {
            plantsList.innerHTML = '<li class="text-gray-600 text-center">لا توجد نباتات لعرضها أو لا توجد نتائج مطابقة.</li>';
            console.log('No plants to display or empty array.'); // تشخيص
            return;
        }

        plantsToDisplay.forEach(plant => {
            const listItem = document.createElement('li');
            listItem.className = 'bg-white/70 p-4 rounded-lg shadow-sm border border-gray-200';
            let content = `<h4 class="text-xl font-bold text-gray-800">${plant.name || 'غير معروف'}`; // إضافة 'غير معروف' للسلامة
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
            console.warn('plantSearchInput element not found for filtering.'); // تشخيص
            return;
        }

        const searchTerm = plantSearchInput.value.trim().toLowerCase();
        console.log('Filtering list with search term:', searchTerm); // تشخيص

        if (!currentPlantListData || currentPlantListData.length === 0) {
            console.warn('currentPlantListData is empty, cannot filter.'); // تشخيص
            renderPlantList([]); // عرض رسالة عدم وجود بيانات
            return;
        }
        
        const filteredPlants = currentPlantListData.filter(plant => {
            // البحث بالاسم العربي
            if (plant.name && plant.name.toLowerCase().includes(searchTerm)) return true;
            // البحث بالاسم العلمي
            if (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchTerm)) return true;
            // البحث في الأسماء المحلية
            if (plant.local_names && plant.local_names.some(name => name.toLowerCase().includes(searchTerm))) return true;
            
            // حقول خاصة بالنباتات النادرة
            if (plant.status && plant.status.toLowerCase().includes(searchTerm)) return true;
            if (plant.description && plant.description.toLowerCase().includes(searchTerm)) return true;
            if (plant.propagation_methods && plant.propagation_methods.toLowerCase().includes(searchTerm)) return true;

            // حقول خاصة بالنباتات الغازية
            if (plant.impact && plant.impact.toLowerCase().includes(searchTerm)) return true;
            if (plant.origin && plant.origin.toLowerCase().includes(searchTerm)) return true;
            if (plant.family && plant.family.toLowerCase().includes(searchTerm)) return true;
            if (plant.distribution_in_sa && plant.distribution_in_sa.toLowerCase().includes(searchTerm)) return true;
            if (plant.habit && plant.habit.toLowerCase().includes(searchTerm)) return true;

            return false;
        });
        console.log('Filtered plants:', filteredPlants); // تشخيص: ما هي النتائج بعد التصفية؟
        renderPlantList(filteredPlants);
    }


    // --- Logic specific to index.html (Main Page) ---
    const slide1 = document.getElementById('slide-1');

    if (slide1) { // بداية كتلة index.html
        console.log('index.html page detected.'); // تشخيص
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
            console.log('Showing slide:', index); // تشخيص
            if (backgrounds[0] && backgrounds[1]) {
                backgrounds.forEach((bg, i) => { bg.style.opacity = (i === index) ? '1' : '0'; });
            }
            slides.forEach((slide, i) => { slide.style.display = (i === index) ? 'flex' : 'none'; });

            // تحديث حالة الأزرار بناءً على الشريحة النشطة
            if (index === 0) { // Slide 1 (Home)
                if (startBtn) startBtn.style.display = 'block';
                if (backBtn) backBtn.style.display = 'none';
            } else if (index === 1) { // Slide 2 (Explorer)
                if (startBtn) startBtn.style.display = 'none';
                if (backBtn) backBtn.style.display = 'block';
            }
        }

        // Initial state
        showSlide(0);

        if (startBtn) {
            startBtn.addEventListener('click', () => showSlide(1));
        }
        if (backBtn) {
            backBtn.addEventListener('click', () => showSlide(0));
        }

        // Gemini Modal Logic
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                if (geminiModal) geminiModal.classList.add('hidden');
            });
        }

        // Close modal if clicked outside
        if (geminiModal) {
            geminiModal.addEventListener('click', (e) => {
                if (e.target === geminiModal) {
                    geminiModal.classList.add('hidden');
                }
            });
        }

        // Function to fetch data from Gemini API
        async function fetchGeminiResponse(prompt) {
            if (spinner) spinner.style.display = 'block';
            if (geminiTextContent) geminiTextContent.innerHTML = '';
            if (geminiModal) geminiModal.classList.remove('hidden');

            try {
                const response = await fetch('YOUR_GEMINI_API_ENDPOINT', { // Replace with your actual API endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer YOUR_API_KEY' // Replace with your actual API key or handle securely
                    },
                    body: JSON.stringify({ prompt: prompt })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API error: ${response.status} - ${errorData.message || response.statusText}`);
                }

                const data = await response.json();
                if (geminiTextContent) {
                    geminiTextContent.innerHTML = data.response || 'No response from Gemini.';
                }
            } catch (error) {
                console.error('Error fetching Gemini response:', error);
                if (geminiTextContent) {
                    geminiTextContent.innerHTML = `<p class="text-red-500">Error: ${error.message}. Please try again later.</p>`;
                }
            } finally {
                if (spinner) spinner.style.display = 'none';
            }
        }

        // Event Listeners for Explorer Buttons
        if (explorerButtons) {
            explorerButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const plantName = plantNameInput ? plantNameInput.value.trim() : '';
                    const dataType = button.dataset.type;
                    let prompt = '';

                    if (!plantName) {
                        alert('Please enter a plant name first!');
                        return;
                    }

                    switch (dataType) {
                        case 'info':
                            prompt = `Provide detailed information about the plant: ${plantName} focusing on its characteristics, habitat, and uses in Saudi Arabia.`;
                            modalTitle.textContent = `معلومات عن ${plantName}`;
                            break;
                        case 'benefits':
                            prompt = `What are the ecological and medicinal benefits of the plant: ${plantName} in the context of Saudi Arabian flora?`;
                            modalTitle.textContent = `فوائد ${plantName}`;
                            break;
                        case 'care':
                            prompt = `Describe the care and cultivation requirements for the plant: ${plantName} in the climate of Saudi Arabia.`;
                            modalTitle.textContent = `رعاية ${plantName}`;
                            break;
                        default:
                            prompt = `Tell me about the plant: ${plantName} in Saudi Arabia.`;
                            modalTitle.textContent = `معلومات عن ${plantName}`;
                            break;
                    }
                    fetchGeminiResponse(prompt);
                });
            });
        }

        // Go to Map Button (index.html specific)
        if (goToMapBtn) {
            goToMapBtn.addEventListener('click', () => {
                window.location.href = 'map.html';
            });
        }

        // Fetch initial data for index.html if needed
        fetchPlantsData();
        fetchProvincesInfo();

    } // نهاية كتلة index.html

    // --- Logic specific to rare-plants-list.html and invasive-plants-list.html ---
    const rarePlantsPage = document.getElementById('rarePlantsPage');
    const invasivePlantsPage = document.getElementById('invasivePlantsPage');

    if (rarePlantsPage) { // بداية كتلة rare-plants-list.html
        console.log('rare-plants-list.html page detected.'); // تشخيص
        fetchSpecificPlantList('rare_plants.json');
        const plantSearchInput = document.getElementById('plantSearchInput');
        if (plantSearchInput) {
            plantSearchInput.addEventListener('input', filterPlantsList);
        }
    } // نهاية كتلة rare-plants-list.html

    if (invasivePlantsPage) { // بداية كتلة invasive-plants-list.html
        console.log('invasive-plants-list.html page detected.'); // تشخيص
        fetchSpecificPlantList('invasive_plants.json');
        const plantSearchInput = document.getElementById('plantSearchInput');
        if (plantSearchInput) {
            plantSearchInput.addEventListener('input', filterPlantsList);
        }
    } // نهاية كتلة invasive-plants-list.html

    // --- Logic specific to map.html ---
    const mapPage = document.getElementById('mapPage');
    if (mapPage) { // بداية كتلة map.html
        console.log('map.html page detected.'); // تشخيص
        const saudiMap = document.getElementById('saudi-map');
        const provinceInfo = document.getElementById('province-info');

        if (saudiMap) {
            saudiMap.addEventListener('mouseover', (event) => {
                let target = event.target;
                // Traverse up to find the path or g element with a data-province attribute
                while (target && !target.dataset.province && target !== saudiMap) {
                    target = target.parentNode;
                }

                if (target && target.dataset.province) {
                    const provinceId = target.dataset.province;
                    const province = provincesInfoData.find(p => p.id === provinceId);
                    if (province) {
                        provinceInfo.innerHTML = `<h3>${province.name_ar}</h3><p>${province.description_ar}</p>`;
                        provinceInfo.style.display = 'block';
                        // Position tooltip near the mouse or province
                        provinceInfo.style.left = `${event.pageX + 10}px`;
                        provinceInfo.style.top = `${event.pageY + 10}px`;
                    }
                } else {
                    provinceInfo.style.display = 'none';
                }
            });

            saudiMap.addEventListener('mouseout', (event) => {
                // Hide info box only if mouse leaves a province path and not entering another province path immediately
                if (!event.relatedTarget || (!event.relatedTarget.dataset.province && !event.relatedTarget.closest('#saudi-map'))) {
                    provinceInfo.style.display = 'none';
                }
            });

            saudiMap.addEventListener('click', (event) => {
                let target = event.target;
                while (target && !target.dataset.province && target !== saudiMap) {
                    target = target.parentNode;
                }

                if (target && target.dataset.province) {
                    const provinceId = target.dataset.province;
                    console.log(`Province clicked: ${provinceId}`); // تشخيص

                    // Remove highlight from previously highlighted province
                    if (highlightedProvince) {
                        const prevProvinceElement = saudiMap.querySelector(`[data-province="${highlightedProvince}"]`);
                        if (prevProvinceElement) {
                            prevProvinceElement.classList.remove('highlighted-province');
                        }
                    }

                    // Add highlight to the newly clicked province
                    target.classList.add('highlighted-province');
                    highlightedProvince = provinceId;

                    // Filter plants based on province
                    const plantsInProvince = plantsData.filter(plant =>
                        plant.distribution_in_sa && plant.distribution_in_sa.includes(provinceId)
                    );
                    currentPlantListData = plantsInProvince; // Update global list for filtering
                    renderPlantList(plantsInProvince);

                    // Show the plant list section
                    const plantListSection = document.getElementById('plantListSection');
                    if (plantListSection) {
                        plantListSection.classList.remove('hidden');
                    }
                }
            });
        }

        // Search and filter for map.html
        const plantSearchInput = document.getElementById('plantSearchInput');
        if (plantSearchInput) {
            plantSearchInput.addEventListener('input', filterPlantsList);
        }

        // Back to Home Button (map.html specific)
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        // Fetch initial data for map.html
        fetchPlantsData();
        fetchProvincesInfo();

    } // نهاية كتلة map.html

    // --- Logic specific to all list pages (rare, invasive) ---
    // This button is for rare-plants-list.html and invasive-plants-list.html
    if (backToMainFromListBtn) {
        backToMainFromListBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

}); // نهاية DOMContentLoaded
