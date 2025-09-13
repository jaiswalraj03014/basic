// =================================
// SENOVA AI - INTERACTIVE FRONTEND
// =================================


// Global Variables
let particleAnimation;
let isHeroChartInitialized = false;
let testimonialInterval;
let currentTestimonial = 0;

// =================================
// INITIALIZATION
// =================================

document.addEventListener('DOMContentLoaded', function() {
    initializeParticles();
    initializeNavigation();
    initializeAnimations();
    initializeCounters();
    initializeTypewriter();
    initializeHeroChart();
    initializeTestimonials();
    initializeChatDemo();
    initializeDashboardFeatures();
    initializeScrollEffects();
    initializeInteractiveElements();
    
    console.log('🚀 Senova AI Frontend Initialized Successfully!');
});

// =================================
// PARTICLE ANIMATION SYSTEM
// =================================

function initializeParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.color = `rgba(56, 189, 248, ${this.opacity})`;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            
            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    
    // Create particles
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections
        drawConnections();
        
        requestAnimationFrame(animate);
    }
    
    // Draw connections between nearby particles
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.1 * (1 - distance / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }
    
    animate();
}

// =================================
// NAVIGATION SYSTEM
// =================================

function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navbar = document.querySelector('.navbar');
    
    // Mobile menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : 'auto';
        });
    }
    
    // Smooth scrolling for nav links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
            
            // Close mobile menu if open
            if (navMenu && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Navbar scroll effect
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (navbar) {
            if (scrollTop > 100) {
                navbar.style.background = 'rgba(15, 23, 42, 0.95)';
                navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
            } else {
                navbar.style.background = 'rgba(30, 41, 59, 0.8)';
                navbar.style.boxShadow = 'none';
            }
        }
        
        lastScrollTop = scrollTop;
    });
}

// =================================
// ANIMATION SYSTEM
// =================================

function initializeAnimations() {
    // AOS-like animation system
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });
    
    // Parallax effect for hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        const heroVisual = document.querySelector('.hero-visual');
        if (heroVisual) {
            heroVisual.style.transform = `translate3d(0, ${rate}px, 0)`;
        }
    });
    
    // Tilt effect for feature cards
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });
}

// =================================
// COUNTER ANIMATIONS
// =================================

function initializeCounters() {
    const counters = document.querySelectorAll('[data-target]');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(target * easeOutQuart);
            
            counter.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                counter.textContent = target.toLocaleString();
            }
        };
        
        requestAnimationFrame(animate);
    };
    
    // Observer for counter animation
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// =================================
// TYPEWRITER EFFECT
// =================================

function initializeTypewriter() {
    const typewriterElement = document.getElementById('typewriter');
    if (!typewriterElement) return;
    
    const texts = [
        'AI Chat Experience',
        'Conversation Analysis',
        'Mental Health Insights',
        'Smart Notifications'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let delay = 100;
    
    function type() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            delay = 50;
        } else {
            typewriterElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            delay = 100;
        }
        
        if (!isDeleting && charIndex === currentText.length) {
            delay = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            delay = 500; // Pause before typing next text
        }
        
        setTimeout(type, delay);
    }
    
    // Start typewriter effect
    setTimeout(type, 1000);
}

// =================================
// HERO CHART INITIALIZATION
// =================================

function initializeHeroChart() {
    const canvas = document.getElementById('heroChart');
    if (!canvas || isHeroChartInitialized) return;
    
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.1)');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [85, 12, 3],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    '#10b981',
                    '#3b82f6',
                    '#ef4444'
                ],
                borderWidth: 2,
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            animation: {
                animateRotate: true,
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
    
    isHeroChartInitialized = true;
}

// =================================
// TESTIMONIAL SLIDER
// =================================

function initializeTestimonials() {
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.dot');
    
    if (testimonials.length === 0) return;
    
    function showTestimonial(index) {
        testimonials.forEach((testimonial, i) => {
            testimonial.classList.toggle('active', i === index);
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        currentTestimonial = index;
    }
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showTestimonial(index);
            resetTestimonialInterval();
        });
    });
    
    function resetTestimonialInterval() {
        clearInterval(testimonialInterval);
        testimonialInterval = setInterval(() => {
            const nextIndex = (currentTestimonial + 1) % testimonials.length;
            showTestimonial(nextIndex);
        }, 5000);
    }
    
    // Auto-rotate testimonials
    resetTestimonialInterval();
}

// =================================
// INTERACTIVE CHAT DEMO
// =================================

function initializeChatDemo() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const sentimentBar = document.getElementById('sentimentBar');
    const sentimentText = document.getElementById('sentimentText');
    const engagementCircle = document.getElementById('engagementCircle');
    const engagementText = document.getElementById('engagementText');
    
    if (!chatInput) return;
    
    const responses = [
        "That's great to hear! How has your day been going?",
        "I understand. Can you tell me more about that?",
        "That sounds interesting! What made you think about that?",
        "Thanks for sharing that with me. How does that make you feel?",
        "I appreciate your perspective on this topic."
    ];
    
    let messageCount = 0;
    let totalSentiment = 0;
    
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const currentTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${isUser ? '👤' : '🤖'}</div>
            <div class="message-content">
                <p>${text}</p>
                <span class="message-time">${currentTime}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Animate message appearance
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
    }
    
    function analyzeSentiment(text) {
        // Simple sentiment analysis simulation
        const positiveWords = ['good', 'great', 'amazing', 'happy', 'excited', 'love', 'wonderful', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'sad', 'angry', 'hate', 'awful', 'horrible', 'depressed'];
        
        const words = text.toLowerCase().split(/\s+/);
        let sentiment = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) sentiment += 1;
            if (negativeWords.includes(word)) sentiment -= 1;
        });
        
        return Math.max(-1, Math.min(1, sentiment / words.length * 10));
    }
    
    function updateAnalysis(sentiment) {
        messageCount++;
        totalSentiment += sentiment;
        const avgSentiment = totalSentiment / messageCount;
        
        // Update sentiment bar
        if (sentimentBar && sentimentText) {
            const sentimentPercentage = ((avgSentiment + 1) / 2) * 100;
            sentimentBar.style.width = `${sentimentPercentage}%`;
            
            if (avgSentiment > 0.2) {
                sentimentText.textContent = 'Positive';
                sentimentBar.style.background = 'linear-gradient(45deg, #10b981, #059669)';
            } else if (avgSentiment < -0.2) {
                sentimentText.textContent = 'Negative';
                sentimentBar.style.background = 'linear-gradient(45deg, #ef4444, #dc2626)';
            } else {
                sentimentText.textContent = 'Neutral';
                sentimentBar.style.background = 'linear-gradient(45deg, #3b82f6, #2563eb)';
            }
        }
        
        // Update engagement ring
        if (engagementCircle && engagementText) {
            const engagement = Math.min(100, messageCount * 15 + Math.abs(avgSentiment) * 20);
            const circumference = 2 * Math.PI * 25;
            const offset = circumference - (engagement / 100) * circumference;
            
            engagementCircle.style.strokeDashoffset = offset;
            engagementText.textContent = `${Math.round(engagement)}%`;
        }
    }
    
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        addMessage(message, true);
        chatInput.value = '';
        
        // Analyze sentiment
        const sentiment = analyzeSentiment(message);
        updateAnalysis(sentiment);
        
        // AI response with delay
        setTimeout(() => {
            const response = responses[Math.floor(Math.random() * responses.length)];
            addMessage(response);
        }, 1000 + Math.random() * 1000);
    }
    
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Auto-type placeholder animation
    const placeholders = [
        'Type your message...',
        'How are you feeling?',
        'Tell me about your day...',
        'What\'s on your mind?'
    ];
    
    let placeholderIndex = 0;
    setInterval(() => {
        chatInput.placeholder = placeholders[placeholderIndex];
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
    }, 3000);
}

// =================================
// DASHBOARD FEATURES
// =================================

function initializeDashboardFeatures() {
    // Activity Heatmap
    initializeHeatmap();
    
    // Time period selector
    initializeTimePeriodSelector();
    
    // Engagement meter animation
    animateEngagementMeter();
    
    // Refresh buttons
    initializeRefreshButtons();
    
    // Wellness buttons
    initializeWellnessButtons();
}

function initializeHeatmap() {
    const heatmapContainer = document.getElementById('activityHeatmap');
    if (!heatmapContainer) return;
    
    // Generate 7x10 grid (10 weeks, 7 days)
    for (let week = 0; week < 10; week++) {
        for (let day = 0; day < 7; day++) {
            const cell = document.createElement('div');
            cell.className = `heatmap-cell level-${Math.floor(Math.random() * 5)}`;
            cell.title = `Week ${week + 1}, Day ${day + 1}`;
            
            // Add hover effect
            cell.addEventListener('mouseenter', (e) => {
                e.target.style.transform = 'scale(1.2)';
                e.target.style.zIndex = '10';
            });
            
            cell.addEventListener('mouseleave', (e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.zIndex = '1';
            });
            
            heatmapContainer.appendChild(cell);
        }
    }
}

function initializeTimePeriodSelector() {
    const timeBtns = document.querySelectorAll('.time-btn');
    
    timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Simulate chart update
            const period = btn.getAttribute('data-period');
            console.log(`Updating chart for period: ${period}`);
            
            // Add loading effect
            btn.style.opacity = '0.7';
            setTimeout(() => {
                btn.style.opacity = '1';
            }, 500);
        });
    });
}

function animateEngagementMeter() {
    const engagementMeter = document.getElementById('engagementMeter');
    const engagementValue = document.getElementById('engagementValue');
    
    if (!engagementMeter) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                
                // Animate the meter
                const targetValue = 87;
                const circumference = 2 * Math.PI * 70;
                const offset = circumference - (targetValue / 100) * circumference;
                
                engagementMeter.style.strokeDasharray = circumference;
                engagementMeter.style.strokeDashoffset = circumference;
                
                setTimeout(() => {
                    engagementMeter.style.transition = 'stroke-dashoffset 2s ease-in-out';
                    engagementMeter.style.strokeDashoffset = offset;
                }, 500);
                
                // Animate the counter
                animateValue(engagementValue, 0, targetValue, 2000);
            }
        });
    }, { threshold: 0.5 });
    
    if (engagementMeter.parentElement) {
        observer.observe(engagementMeter.parentElement);
    }
}

function animateValue(element, start, end, duration) {
    if (!element) return;
    
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (end - start) * easeOutQuart);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function initializeRefreshButtons() {
    document.querySelectorAll('#refreshSentiment, #exportSentiment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Add loading animation
            btn.innerHTML = '⟳';
            btn.classList.add('loading');
            
            setTimeout(() => {
                btn.innerHTML = btn.id.includes('refresh') ? '🔄' : '📊';
                btn.classList.remove('loading');
            }, 1500);
        });
    });
}

function initializeWellnessButtons() {
    document.querySelectorAll('.wellness-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const originalText = btn.textContent;
            btn.textContent = 'Starting...';
            btn.style.background = 'linear-gradient(45deg, #38bdf8, #06b6d4)';
            
            setTimeout(() => {
                btn.textContent = '✓ Complete';
                btn.style.background = 'linear-gradient(45deg, #10b981, #059669)';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = 'linear-gradient(45deg, #10b981, #059669)';
                }, 2000);
            }, 1000);
        });
    });
}

// =================================
// SCROLL EFFECTS
// =================================

function initializeScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        // Parallax backgrounds
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.style.transform = `translate3d(0, ${rate * 0.2}px, 0)`;
        }
        
        // Floating elements animation based on scroll
        document.querySelectorAll('.float-element').forEach((el, index) => {
            const speed = 0.1 + (index * 0.05);
            el.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
        });
        
        ticking = false;
    }
    
    function requestScrollUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestScrollUpdate);
}

// =================================
// INTERACTIVE ELEMENTS
// =================================

function initializeInteractiveElements() {
    // Button ripple effects
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = this.querySelector('.btn-ripple');
            if (ripple) {
                ripple.style.width = '0';
                ripple.style.height = '0';
                
                setTimeout(() => {
                    ripple.style.width = '300px';
                    ripple.style.height = '300px';
                }, 10);
            }
        });
    });
    
    // Card hover effects
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Feature card interactions
    document.querySelectorAll('.feature-card').forEach(card => {
        const icon = card.querySelector('.icon-wrapper');
        
        card.addEventListener('mouseenter', () => {
            if (icon) {
                icon.style.animation = 'bounce 0.6s ease';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (icon) {
                icon.style.animation = 'none';
            }
        });
    });
    
    // Download button special effects
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            // This still prevents the immediate default click action.
            e.preventDefault(); 
            
            const btnText = downloadBtn.querySelector('.btn-text');
            const btnIcon = downloadBtn.querySelector('.btn-icon');
            const originalText = btnText.textContent;
            
            // Don't run the animation again if it's already in progress.
            if (downloadBtn.classList.contains('downloading')) {
                return;
            }
            
            downloadBtn.classList.add('downloading');
            downloadBtn.style.pointerEvents = 'none';
            btnIcon.textContent = '⏳';
            btnText.textContent = 'Preparing...';
            
            setTimeout(() => {
                btnIcon.textContent = '✓';
                btnText.textContent = 'Download Ready!';
                
                // --- THIS IS THE FIX ---
                // Create a temporary link to trigger the actual download.
                const fileUrl = downloadBtn.getAttribute('href');
                const tempLink = document.createElement('a');
                tempLink.href = fileUrl;
                tempLink.setAttribute('download', 'extension.zip');
                tempLink.style.display = 'none';
                document.body.appendChild(tempLink);
                tempLink.click(); // This starts the download.
                document.body.removeChild(tempLink);
                // --- END OF FIX ---

                // Reset the button after a short delay.
                setTimeout(() => {
                    btnIcon.textContent = '🚀';
                    btnText.textContent = originalText;
                    downloadBtn.style.pointerEvents = 'auto';
                    downloadBtn.classList.remove('downloading');
                }, 2000);

            }, 1500);
        });
    }
    
    // Glowing animations
    const glowElements = document.querySelectorAll('.btn, .card, .feature-card');
    
    setInterval(() => {
        const randomElement = glowElements[Math.floor(Math.random() * glowElements.length)];
        if (randomElement && !randomElement.classList.contains('glow')) {
            randomElement.classList.add('glow');
            setTimeout(() => {
                randomElement.classList.remove('glow');
            }, 2000);
        }
    }, 3000);
}

// =================================
// DASHBOARD DATA API (SIMULATION)
// =================================

// Dashboard data fetching simulation
(function() {
    const statsContainer = document.getElementById('statsContainer');
    const riskList = document.getElementById('riskList');
    const interventionList = document.getElementById('interventionList');
    const wellnessList = document.getElementById('wellnessList');
    
    if (!statsContainer && !riskList && !wellnessList) return;
    
    // Simulate API calls
    const API_BASE = (window.API_BASE_URL) || 'http://localhost:8000';
    
    async function fetchJSON(path) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        // Mock data
        const mockData = {
            '/stats': {
                total_sessions: 127,
                total_messages: 2856,
                uptime: '99.8%',
                risk_level_distribution: {
                    low: 89,
                    medium: 8,
                    high: 3
                },
                intervention_counts: {
                    'Breathing Exercise': 12,
                    'Positive Affirmation': 8,
                    'Mindfulness Reminder': 15
                }
            },
            '/wellness-resources': {
                crisis_resources: [
                    { name: 'Crisis Hotline', contact: '1-800-273-8255' },
                    { name: 'Mental Health Support', contact: 'support@mentalhealth.org' }
                ],
                breathing_exercises: [
                    { name: '4-7-8 Breathing', description: 'Inhale 4, hold 7, exhale 8' }
                ],
                grounding_techniques: [
                    { name: '5-4-3-2-1 Technique', description: '5 things you see, 4 you hear, etc.' }
                ]
            }
        };
        
        return mockData[path] || {};
    }
    
    function renderKeyValue(container, data) {
        if (!container) return;
        container.innerHTML = Object.entries(data)
            .map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`)
            .join('');
    }
    
    function renderList(container, dataObj) {
        if (!container || !dataObj) return;
        container.innerHTML = '';
        Object.entries(dataObj).forEach(([key, value]) => {
            const li = document.createElement('li');
            li.textContent = `${key}: ${value}`;
            container.appendChild(li);
        });
    }
    
    function renderArrayList(container, items, formatter) {
        if (!container || !Array.isArray(items)) return;
        container.innerHTML = '';
        items.forEach((item) => {
            const li = document.createElement('li');
            li.innerHTML = formatter ? formatter(item) : String(item);
            container.appendChild(li);
        });
    }
    
    async function loadDashboard() {
        try {
            const [stats, wellness] = await Promise.all([
                fetchJSON('/stats'),
                fetchJSON('/wellness-resources')
            ]);
            
            // Update stats
            renderKeyValue(statsContainer, {
                total_sessions: stats.total_sessions,
                total_messages: stats.total_messages,
                uptime: stats.uptime
            });
            
            // Update risk distribution
            renderList(riskList, stats.risk_level_distribution);
            
            // Update interventions
            renderList(interventionList, stats.intervention_counts);
            
            // Update wellness resources
            const resources = [
                ...wellness.crisis_resources.map(r => ({label: r.name, value: r.contact})),
                ...wellness.breathing_exercises.map(r => ({label: r.name, value: r.description})),
                ...wellness.grounding_techniques.map(r => ({label: r.name, value: r.description}))
            ];
            renderArrayList(wellnessList, resources, (r) => `<strong>${r.label}</strong>: ${r.value}`);
            
        } catch (err) {
            console.error('Dashboard load error:', err);
            if (statsContainer) statsContainer.innerHTML = '<em>Failed to load stats.</em>';
        }
    }
    
    // Load dashboard data
    loadDashboard();
})();

// =================================
// UTILITY FUNCTIONS
// =================================

// Debounce function for performance
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Generate random color
function getRandomColor() {
    const colors = [
        '#38bdf8', '#06b6d4', '#8b5cf6', '#a855f7',
        '#10b981', '#059669', '#f59e0b', '#d97706',
        '#ef4444', '#dc2626', '#6366f1', '#4f46e5'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// =================================
// ERROR HANDLING
// =================================

window.addEventListener('error', (e) => {
    console.error('Frontend Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// =================================
// PERFORMANCE MONITORING
// =================================

// Performance observer for monitoring
if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
                console.log('Page Load Time:', entry.loadEventEnd - entry.loadEventStart, 'ms');
            }
        });
    });
    
    observer.observe({ type: 'navigation', buffered: true });
}

// Memory usage tracking (development only)
if (window.performance && window.performance.memory) {
    setInterval(() => {
        const memory = window.performance.memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
            console.warn('High memory usage detected:', memory.usedJSHeapSize / 1024 / 1024, 'MB');
        }
    }, 30000);
}

console.log('✨ Senova AI - Advanced Interactive Frontend Loaded Successfully! ✨');