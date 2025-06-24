document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
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
    const ksaMap = document.getElementById('ksa-map');

    // --- Plants Database (Local fallback) ---
    let plantsData = [];
    
    // Load plants data
    async function loadPlantsData() {
        try {
            const response = await fetch('./plants.json');
            if (response.ok) {
                plantsData = await response.json();
                console.log('Plants data loaded:', plantsData.length, 'plants');
                setupAutocomplete();
            }
        } catch (error) {
            console.error('Failed to load plants data:', error);
        }
    }

    // --- Autocomplete functionality ---
    function setupAutocomplete() {
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-10 max-h-40 overflow-y-auto hidden';
        suggestionsContainer.id = 'suggestions';
        
        plantNameInput.parentNode.style.position = 'relative';
        plantNameInput.parentNode.appendChild(suggestionsContainer);

        plantNameInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            
            if (query.length < 2) {
                suggestionsContainer.classList.add('hidden');
                return;
            }

            const matches = plantsData.filter(plant => 
                plant.name.includes(query) || 
                plant.commonNames.some(name => name.includes(query))
            );

            if (matches.length > 0) {
                suggestionsContainer.innerHTML = matches.map(plant => 
                    `<div class="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 text-right suggestion-item" data-name="${plant.name}">
                        <div class="font-semibold">${plant.name}</div>
                        <div class="text-sm text-gray-600">${plant.scientificName}</div>
                    </div>`
                ).join('');
                
                suggestionsContainer.classList.remove('hidden');
                
                // Add click handlers to suggestions
                suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        plantNameInput.value = item.dataset.name;
                        suggestionsContainer.classList.add('hidden');
                    });
                });
            } else {
                suggestionsContainer.classList.add('hidden');
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!plantNameInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.classList.add('hidden');
            }
        });
    }

    // --- Enhanced Map Interaction ---
    ksaMap?.addEventListener('load', () => {
        const svgDoc = ksaMap.contentDocument;
        if (!svgDoc) {
            console.error('Could not access SVG document');
            return;
        }

        const regions = svgDoc.querySelectorAll('path[id]');
        
        regions.forEach(region => {
            const regionId = region.getAttribute('id');
            
            // Enhanced styling
            region.style.transition = 'all 0.3s ease';
            region.style.cursor = 'pointer';
            region.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))';
            
            region.addEventListener('mouseenter', () => {
                region.style.fill = '#6a4f3e';
                region.style.transform = 'scale(1.02)';
                region.style.filter = 'drop-shadow(4px 4px 8px rgba(0,0,0,0.2))';
            });
            
            region.addEventListener('mouseleave', () => {
                region.style.fill = '';
                region.style.transform = 'scale(1)';
                region.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))';
            });
            
            region.addEventListener('click', () => {
                showRegionPlants(regionId);
            });
        });
    });

    // Show plants for specific region
    function showRegionPlants(regionName) {
        const regionPlants = plantsData.filter(plant => 
            plant.regions.includes(regionName)
        );

        modalTitle.textContent = `نباتات ${regionName}`;
        
        if (regionPlants.length > 0) {
            const plantsHtml = regionPlants.map(plant => `
                <div class="mb-4 p-4 bg-gray-50 rounded-lg border-r-4 border-green-500">
                    <h4 class="font-bold text-lg text-green-800">${plant.name}</h4>
                    <p class="text-sm text-gray-600 italic">${plant.scientificName}</p>
                    <p class="text-gray-700 mt-2">${plant.description}</p>
                    <div class="mt-2 text-sm">
                        <span class="font-semibold">الأسماء الشعبية:</span> ${plant.commonNames.join('، ')}
                    </div>
                </div>
            `).join('');
            
            geminiTextContent.innerHTML = plantsHtml;
        } else {
            geminiTextContent.innerHTML = `
                <div class="text-center p-8">
                    <div class="text-6xl mb-4">🌱</div>
                    <p class="text-lg text-gray-600">لا توجد معلومات متاحة حالياً عن نباتات ${regionName}</p>
                    <p class="text-sm text-gray-500 mt-2">سيتم إضافة المزيد من المعلومات قريباً</p>
                </div>
            `;
        }
        
        geminiModal.style.display = 'flex';
    }

    // --- Slide Navigation ---
    function showSlide(index) {
        backgrounds.forEach((bg, i) => { 
            if (bg) bg.style.opacity = (i === index) ? '1' : '0'; 
        });
        slides.forEach((slide, i) => { 
            if (slide) slide.style.display = (i === index) ? 'flex' : 'none'; 
        });
    }
    
    startBtn?.addEventListener('click', () => showSlide(1));
    backBtn?.addEventListener('click', () => showSlide(0));
    
    // --- Enhanced API Call Logic ---
    async function handleSearch(plantName, type) {
        // Check if plant exists in our database first
        const plantInfo = plantsData.find(plant => 
            plant.name.toLowerCase() === plantName.toLowerCase() ||
            plant.commonNames.some(name => name.toLowerCase() === plantName.toLowerCase())
        );

        geminiModal.style.display = 'flex';
        spinner.style.display = 'block';
        geminiTextContent.innerHTML = '';

        const titles = { 
            info: "معلومات عامة", 
            uses: "استخدامات تقليدية", 
            names: "أسماء شعبية", 
            scientific: "الاسم العلمي" 
        };
        
        modalTitle.textContent = `${titles[type]} عن ${plantName}`;

        // If we have local data, show it first
        if (plantInfo && type !== 'info') {
            let localContent = '';
            
            switch(type) {
                case 'uses':
                    localContent = `<div class="bg-green-50 p-4 rounded-lg mb-4">
                        <h4 class="font-bold text-green-800 mb-2">الاستخدامات التقليدية:</h4>
                        <ul class="list-disc list-inside text-right">
                            ${plantInfo.traditionalUses.map(use => `<li>${use}</li>`).join('')}
                        </ul>
                    </div>`;
                    break;
                case 'names':
                    localContent = `<div class="bg-blue-50 p-4 rounded-lg mb-4">
                        <h4 class="font-bold text-blue-800 mb-2">الأسماء الشعبية:</h4>
                        <p>${plantInfo.commonNames.join('، ')}</p>
                    </div>`;
                    break;
                case 'scientific':
                    localContent = `<div class="bg-purple-50 p-4 rounded-lg mb-4">
                        <h4 class="font-bold text-purple-800 mb-2">المعلومات العلمية:</h4>
                        <p><strong>الاسم العلمي:</strong> ${plantInfo.scientificName}</p>
                        <p><strong>العائلة النباتية:</strong> ${plantInfo.family}</p>
                        <p><strong>المناطق:</strong> ${plantInfo.regions.join('، ')}</p>
                    </div>`;
                    break;
            }
            
            geminiTextContent.innerHTML = localContent;
        }

        // Enhanced prompts for better responses
        const prompts = {
            info: `بصفتك خبير نباتات متخصص في الغطاء النباتي للمملكة العربية السعودية، قدم وصفاً تعريفياً شاملاً لنبات '${plantName}' يشمل: الوصف المورفولوجي، البيئة المناسبة، طرق التكاثر، والأهمية البيئية.`,
            uses: `بصفتك باحث في التراث النباتي للمملكة، اذكر بالتفصيل الاستخدامات التقليدية والحديثة لنبات '${plantName}' في الثقافة السعودية، مع ذكر طرق الاستخدام والفوائد.`,
            names: `كمختص في النباتات البرية السعودية، ما هي جميع الأسماء الشعبية والمحلية لنبات '${plantName}' في مختلف مناطق المملكة؟ مع ذكر المنطقة الجغرافية لكل اسم إن أمكن.`,
            scientific: `بصفتك عالم نباتات، قدم معلومات علمية دقيقة عن نبات '${plantName}' تشمل: الاسم العلمي الكامل، العائلة النباتية، التصنيف التقسيمي، والخصائص المميزة.`
        };

        try {
            const response = await fetch('/.netlify/functions/fetch-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompts[type] })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `خطأ في الخادم: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.candidates || result.candidates.length === 0) {
                throw new Error("لم يتم الحصول على استجابة صحيحة من النظام");
            }
            
            const aiResponse = result.candidates[0].content.parts[0].text.replace(/\n/g, '<br>');
            
            // Combine local data with AI response
            const existingContent = geminiTextContent.innerHTML;
            geminiTextContent.innerHTML = existingContent + `
                <div class="mt-4 p-4 bg-gray-50 rounded-lg border-t-2 border-[#6a4f3e]">
                    <h4 class="font-bold text-[#6a4f3e] mb-2">معلومات إضافية:</h4>
                    <div class="text-gray-700">${aiResponse}</div>
                </div>
            `;

        } catch (error) {
            console.error("Search Error:", error);
            
            // Enhanced error handling
            let errorMessage = '';
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.';
            } else if (error.message.includes('Server configuration')) {
                errorMessage = 'خطأ في إعدادات الخادم. يرجى المحاولة لاحقاً.';
            } else {
                errorMessage = error.message;
            }
            
            const errorHtml = `
                <div class="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                    <div class="text-4xl mb-2">⚠️</div>
                    <p class="font-bold text-red-800 mb-2">حدث خطأ</p>
                    <p class="text-sm text-red-600">${errorMessage}</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                        إعادة تحميل الصفحة
                    </button>
                </div>
            `;
            
            geminiTextContent.innerHTML = geminiTextContent.innerHTML + errorHtml;
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
                // Show helpful message with suggestions
                modalTitle.textContent = 'اختر نباتاً للبحث عنه';
                geminiTextContent.innerHTML = `
                    <div class="text-center p-6">
                        <div class="text-6xl mb-4">🌿</div>
                        <p class="text-lg mb-4">الرجاء إدخال اسم النبات أولاً</p>
                        <div class="text-right">
                            <p class="font-semibold mb-2">أمثلة على النباتات المتاحة:</p>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                ${plantsData.slice(0, 6).map(plant => 
                                    `<button onclick="document.getElementById('plantNameInput').value='${plant.name}'; document.getElementById('closeModalBtn').click();" 
                                     class="p-2 bg-green-100 hover:bg-green-200 rounded border text-green-800 transition">
                                        ${plant.name}
                                    </button>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                `;
                geminiModal.style.display = 'flex';
            }
        });
    });
    
    closeModalBtn?.addEventListener('click', () => { 
        geminiModal.style.display = 'none'; 
    });
    
    geminiModal?.addEventListener('click', (event) => {
        if (event.target === geminiModal) {
            geminiModal.style.display = 'none';
        }
    });

    // --- Keyboard Navigation ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && geminiModal.style.display === 'flex') {
            geminiModal.style.display = 'none';
        }
        
        if (e.key === 'Enter' && document.activeElement === plantNameInput) {
            const firstButton = explorerButtons[0];
            if (firstButton && plantNameInput.value.trim()) {
                firstButton.click();
            }
        }
    });

    // --- Initialize ---
    showSlide(0);
    loadPlantsData();
    
    // Add loading indicator
    console.log('🌱 موقع النباتات السعودية جاهز!');
});
