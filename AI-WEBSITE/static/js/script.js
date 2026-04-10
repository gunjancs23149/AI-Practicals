document.addEventListener('DOMContentLoaded', () => {
    const getRecBtn = document.getElementById('getRecBtn');
    const userIdInput = document.getElementById('userIdInput');
    const toastContainer = document.getElementById('toastContainer');
    const resultsSection = document.getElementById('resultsSection');
    const recommendationGrid = document.getElementById('recommendationGrid');
    const loadingState = document.getElementById('loadingState');

    getRecBtn.addEventListener('click', fetchRecommendations);
    userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchRecommendations();
        }
    });

    async function fetchRecommendations() {
        const userId = userIdInput.value.trim();
        if (!userId) {
            showToast("Please enter a User ID (e.g. U1) to begin.");
            return;
        }

        // Reset UI
        showToast('', false);
        resultsSection.classList.add('hidden');
        recommendationGrid.innerHTML = '';
        loadingState.classList.remove('hidden');
        
        getRecBtn.innerHTML = `<span>Scanning...</span>`;
        getRecBtn.disabled = true;

        try {
            // Using absolute localhost URL occasionally bypasses local file limits
            const baseUrl = window.location.protocol.includes('http') ? '' : 'http://127.0.0.1:5000';
            const response = await fetch(`${baseUrl}/recommend?user_id=${encodeURIComponent(userId)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch recommendations');
            }

            if (data.message) {
                loadingState.classList.add('hidden');
                showToast(data.message);
            } else if (data.recommendations && data.recommendations.length > 0) {
                // Synthesize artificial delay to let skeleton animation finish for premium feel
                setTimeout(() => {
                    loadingState.classList.add('hidden');
                    renderRecommendations(data.recommendations);
                }, 800);
            } else {
                loadingState.classList.add('hidden');
                showToast("No recommendations found for this user.");
            }
        } catch (error) {
            console.error(error);
            loadingState.classList.add('hidden');
            showToast("Server unavailable. Ensure Flask is running on port 5000.");
        } finally {
            getRecBtn.innerHTML = `<span>Discover</span><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
            getRecBtn.disabled = false;
        }
    }

    function showToast(message, visible = true) {
        if (!visible) {
            toastContainer.classList.add('hidden');
            return;
        }
        toastContainer.textContent = message;
        toastContainer.classList.remove('hidden');
    }

    function renderRecommendations(recommendations) {
        recommendationGrid.innerHTML = '';
        
        recommendations.forEach((product, index) => {
            const starsHTML = getStarsHTML(product.rating);
            
            const productKeywords = {
                'P1': 'earbuds,wireless',
                'P2': 'gaming,mouse',
                'P3': 'mechanical,keyboard',
                'P4': 'apparel,tshirt',
                'P5': 'denim,jacket',
                'P6': 'sneakers,running',
                'P7': 'book,vintage',
                'P8': 'code,screen',
                'P9': 'novel,book',
                'P10': 'espresso,machine',
                'P11': 'lamp,modern',
                'P12': 'smartwatch,tech',
                'P13': 'speaker,audio',
                'P14': 'cozy,blanket',
                'P15': 'cooking,pan'
            };
            
            const keyword = productKeywords[product.product_id] || 'minimalist,product';
            // Use unsplash source for more premium imagery 
            const dummyImageUrl = `https://loremflickr.com/600/600/${keyword}?lock=${product.product_id.replace('P', '')}`;

            const card = document.createElement('div');
            card.className = 'product-card';
            // Stagger animation based on index
            card.style.animation = `fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.15}s`;
            card.style.opacity = '0';
            
            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${dummyImageUrl}" alt="${product.product_name}" loading="lazy">
                    <div class="card-overlay"></div>
                </div>
                <div class="card-content">
                    <div class="card-category">${product.category}</div>
                    <div class="card-title">${product.product_name}</div>
                    <div class="card-rating">
                        ${starsHTML} <span class="rating-score">${product.rating.toFixed(1)}</span>
                    </div>
                </div>
            `;
            recommendationGrid.appendChild(card);
        });

        resultsSection.classList.remove('hidden');
    }

    function getStarsHTML(rating) {
        const full = Math.round(rating);
        const empty = 5 - full;
        return '<span class="star-fill">★</span>'.repeat(Math.max(0, full)) + 
               '<span class="star-empty">★</span>'.repeat(Math.max(0, empty));
    }
});
