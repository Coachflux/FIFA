// ========== GLOBAL GOAL 2026 - MAIN JAVASCRIPT ==========

// Points System
let userPoints = parseInt(localStorage.getItem('gg_points')) || 1250;
let lastCheckin = localStorage.getItem('gg_last_checkin') || null;
let sessionStart = Date.now();
let activeTimeClaimed = false;

// Update navigation points display
function updateNavPoints() {
    const navPoints = document.getElementById('nav-points');
    if (navPoints) {
        navPoints.textContent = userPoints.toLocaleString();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    updateNavPoints();
    initScrollEffects();
    initNavbar();
    initSessionTimer();
    initAdRefresh();
});

// ========== POINTS MANAGEMENT ==========
function addPoints(amount, reason) {
    userPoints += amount;
    localStorage.setItem('gg_points', userPoints);
    updateNavPoints();

    // Show notification
    showNotification(`+${amount} Points!`, reason, 'success');

    // Log for anti-fraud
    logActivity('points_earned', { amount, reason, timestamp: new Date().toISOString() });
}

function showNotification(title, message, type = 'success') {
    // Create notification element
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; top: 100px; right: 20px; z-index: 9999;
        background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
        color: white; padding: 1rem 1.5rem; border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); backdrop-filter: blur(10px);
        transform: translateX(400px); transition: transform 0.4s ease;
        max-width: 300px; font-family: 'Inter', sans-serif;
    `;
    notif.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 0.3rem;">${title}</div>
        <div style="font-size: 0.85rem; opacity: 0.9;">${message}</div>
    `;
    document.body.appendChild(notif);

    // Animate in
    setTimeout(() => notif.style.transform = 'translateX(0)', 100);

    // Remove after 4 seconds
    setTimeout(() => {
        notif.style.transform = 'translateX(400px)';
        setTimeout(() => notif.remove(), 400);
    }, 4000);
}

// ========== DAILY CHECK-IN ==========
function claimDaily() {
    const today = new Date().toDateString();

    if (lastCheckin === today) {
        showNotification('Already Claimed!', 'Come back tomorrow for more points.', 'error');
        return;
    }

    addPoints(20, 'Daily check-in bonus');
    lastCheckin = today;
    localStorage.setItem('gg_last_checkin', today);
}

// ========== SESSION TIMER (20 min = +30 pts) ==========
function initSessionTimer() {
    setInterval(() => {
        const elapsed = Date.now() - sessionStart;
        const minutes = Math.floor(elapsed / 60000);

        if (minutes >= 20 && !activeTimeClaimed) {
            addPoints(30, 'Active session bonus (20+ minutes)');
            activeTimeClaimed = true;
        }
    }, 60000); // Check every minute
}

// ========== VIDEO WATCHING ==========
function watchVideo(videoId, points = 50) {
    // Simulate video watching - in production, this would track actual video progress
    const watched = localStorage.getItem(`gg_video_${videoId}`);

    if (watched) {
        showNotification('Already Watched', 'You already earned points for this video.', 'error');
        return false;
    }

    // In real implementation, integrate with YouTube/Video API
    // For now, simulate with a timer
    showNotification('Watching...', 'Stay on this page while the video plays.', 'success');

    setTimeout(() => {
        addPoints(points, `Watched highlight video #${videoId}`);
        localStorage.setItem(`gg_video_${videoId}`, 'true');
    }, 5000); // 5 second simulation

    return true;
}

// ========== REFERRAL SYSTEM ==========
function getReferralCode() {
    let code = localStorage.getItem('gg_ref_code');
    if (!code) {
        code = 'GG' + Math.random().toString(36).substr(2, 8).toUpperCase();
        localStorage.setItem('gg_ref_code', code);
    }
    return code;
}

function copyReferralLink() {
    const code = getReferralCode();
    const link = `${window.location.origin}/?ref=${code}`;

    navigator.clipboard.writeText(link).then(() => {
        showNotification('Copied!', 'Referral link copied to clipboard.', 'success');
    });
}

// ========== YOUTUBE SUBSCRIPTION VERIFY ==========
function verifyYouTube(username) {
    if (!username || username.length < 3) {
        showNotification('Invalid Username', 'Please enter a valid YouTube username.', 'error');
        return;
    }

    const verified = localStorage.getItem('gg_youtube_verified');
    if (verified) {
        showNotification('Already Verified', 'You already claimed this bonus.', 'error');
        return;
    }

    // In production, this would verify via YouTube API or manual review
    // For demo, we accept and flag for review
    localStorage.setItem('gg_youtube_pending', username);
    showNotification('Pending Review', 'Your subscription is being verified. Points added!', 'success');
    addPoints(100, 'YouTube subscription bonus (pending verification)');
}

// ========== NEWSLETTER SUBSCRIBE ==========
function handleSubscribe(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;

    if (!email || !email.includes('@')) {
        showNotification('Invalid Email', 'Please enter a valid email address.', 'error');
        return;
    }

    const subscribed = localStorage.getItem('gg_newsletter');
    if (subscribed) {
        showNotification('Already Subscribed', 'You are already on our list!', 'error');
        return;
    }

    localStorage.setItem('gg_newsletter', email);
    addPoints(50, 'Newsletter subscription');
    showNotification('Welcome!', 'You are subscribed. Check your inbox for confirmation.', 'success');
    e.target.reset();
}

// ========== ANTI-FRAUD LOGGING ==========
function logActivity(action, data) {
    const logs = JSON.parse(localStorage.getItem('gg_activity_log') || '[]');
    logs.push({ action, data, userAgent: navigator.userAgent, timestamp: new Date().toISOString() });

    // Keep only last 100 entries
    if (logs.length > 100) logs.shift();
    localStorage.setItem('gg_activity_log', JSON.stringify(logs));
}

// ========== NAVBAR ==========
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    navLinks.style.position = 'absolute';
    navLinks.style.top = '70px';
    navLinks.style.left = '0';
    navLinks.style.right = '0';
    navLinks.style.background = 'rgba(5, 8, 23, 0.98)';
    navLinks.style.flexDirection = 'column';
    navLinks.style.padding = '2rem';
    navLinks.style.gap = '1.5rem';
}

// ========== SCROLL EFFECTS ==========
function initScrollEffects() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ========== AD REFRESH ==========
function initAdRefresh() {
    // Refresh ads every 60 seconds for better viewability metrics
    setInterval(() => {
        if (typeof adsbygoogle !== 'undefined') {
            try {
                adsbygoogle.push({});
            } catch(e) {}
        }
    }, 60000);
}

// ========== CITY EXPLORATION ==========
function exploreCity(country) {
    const messages = {
        'usa': 'Exploring host cities in the United States...',
        'canada': 'Exploring host cities in Canada...',
        'mexico': 'Exploring host cities in Mexico...'
    };
    showNotification('Coming Soon', messages[country] || 'Exploring...', 'success');
}
