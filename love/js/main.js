	const audio = document.getElementById('bg-music');
	const hearts = [];

	// Sunrise/sunset times (will be fetched from API)
	let sunriseTime = null;
	let sunsetTime = null;

	// Beijing coordinates
	const LAT = 39.9042;
	const LNG = 116.4074;

	// Parse UTC time string from API and construct correct Date object
	// The API returns UTC times; for east-of-GMT locations, the UTC date
	// of the event may differ from the local date.
	function parseUTCTime(timeStr) {
		const match = timeStr.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/i);
		if (!match) return null;

		let hours = parseInt(match[1]);
		const minutes = parseInt(match[2]);
		const seconds = parseInt(match[3]);
		const period = match[4].toUpperCase();

		if (period === 'PM' && hours !== 12) hours += 12;
		if (period === 'AM' && hours === 12) hours = 0;

		const tzOffsetHours = -new Date().getTimezoneOffset() / 60;
		const localNow = new Date();
		const tzDateStr = localNow.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
		const tzNow = new Date(tzDateStr);
		const y = tzNow.getFullYear();
		const m = tzNow.getMonth();
		const d = tzNow.getDate();

		const localHours = hours + tzOffsetHours;
		let utcDay = d;
		if (localHours >= 24) utcDay = d - 1;
		else if (localHours < 0) utcDay = d + 1;

		return new Date(Date.UTC(y, m, utcDay, hours, minutes, seconds, 0));
	}

	// Fetch sunrise/sunset data from API
	async function fetchSunTimes() {
		try {
			const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${LAT}&lng=${LNG}&date=today`);
			const data = await response.json();

			if (data.status === 'OK') {
				sunriseTime = parseUTCTime(data.results.sunrise);
				sunsetTime = parseUTCTime(data.results.sunset);
				console.log('Sunrise:', sunriseTime.toISOString(), 'Sunset:', sunsetTime.toISOString());
			}
		} catch (error) {
			console.warn('Failed to fetch sunrise/sunset times, using fallback:', error);
		}
	}

	// Determine if it's night based on sunrise/sunset
	function isNight() {
		if (sunriseTime && sunsetTime) {
			const now = new Date();
			// Night if before sunrise or after sunset
			return now < sunriseTime || now > sunsetTime;
		}
		// Fallback: fixed time (8 PM - 6 AM)
		const hour = new Date().getHours();
		return hour >= 20 || hour < 6;
	}

	// --- macOS-style glass navigation bar helpers ---
	function updateNavClock() {
		const now = new Date();
		document.getElementById('nav-time').textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
		document.getElementById('nav-date').textContent = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
	}

	function updateNavSun() {
		const sunEl = document.getElementById('nav-sun');
		if (!sunriseTime || !sunsetTime) {
			sunEl.textContent = '☀ 加载中…';
			return;
		}
		const now = new Date();
		if (now < sunriseTime) {
			sunEl.textContent = '☀ SR ' + sunriseTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
		} else if (now >= sunriseTime && now < sunsetTime) {
			sunEl.textContent = '🌇 SS ' + sunsetTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
		} else {
			const nextSunrise = new Date(sunriseTime);
			nextSunrise.setDate(nextSunrise.getDate() + 1);
			sunEl.textContent = '☀ NDSR ' + nextSunrise.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
		}
	}

	function getWeatherIcon(code) {
		if (code === 0) return '☀';
		if (code >= 1 && code <= 3) return '⛅';
		if (code === 45 || code === 48) return '🌫';
		if (code >= 51 && code <= 67) return '🌧';
		if (code >= 71 && code <= 77) return '❄';
		if (code >= 80 && code <= 82) return '🌧';
		if (code >= 85 && code <= 86) return '❄';
		if (code >= 95 && code <= 99) return '⛈';
		return '🌡';
	}

	async function fetchWeather(lat, lng) {
		const weatherEl = document.getElementById('nav-weather');
		try {
			const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`);
			const data = await res.json();
			const temp = data.current.temperature_2m;
			const code = data.current.weather_code;
			const icon = getWeatherIcon(code);
			weatherEl.textContent = `${icon} ${temp}°C`;
		} catch (err) {
			console.warn('Failed to fetch weather:', err);
			weatherEl.textContent = '🌡 --°C';
		}
	}

	function initLocation() {
		const locEl = document.getElementById('nav-location');
		if (!navigator.geolocation) {
			locEl.textContent = 'Beijing';
			fetchWeather(LAT, LNG);
			return;
		}
		navigator.geolocation.getCurrentPosition(
			pos => {
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
				fetchWeather(lat, lng);
				fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh`)
					.then(r => r.json())
					.then(data => {
						const city = data.city || data.locality || data.principalSubdivision;
						if (city) locEl.textContent = city;
						else locEl.textContent = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
					})
					.catch(() => {
						locEl.textContent = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
					});
			},
			err => {
				console.warn('Geolocation failed:', err);
				locEl.textContent = 'Beijing';
				fetchWeather(LAT, LNG);
			}
		);
	}

	// Determine current season based on month
	function getSeason() {
		const month = new Date().getMonth(); // 0-11
		if (month >= 2 && month <= 4) return 'spring'; // March, April, May
		if (month >= 5 && month <= 7) return 'summer'; // June, July, August
		if (month >= 8 && month <= 10) return 'autumn'; // September, October, November
		return 'winter'; // December, January, February
	}

	function applyTheme() {
		if (isNight()) {
			document.body.className = 'night';
		} else {
			const season = getSeason();
			document.body.className = season === 'spring' ? 'spring-day' : 'day';
		}
	}

// Fetch sun times on load, then apply theme
fetchSunTimes().then(() => {
	applyTheme();
	updateNavSun();
	// Refresh sun times daily at midnight
	setInterval(fetchSunTimes, 24 * 60 * 60 * 1000);
});

// Initialize macOS-style nav bar
initLocation();
updateNavClock();
updateNavSun();
setInterval(updateNavClock, 1000);
setInterval(updateNavSun, 60 * 1000);

	// Check theme every minute
	setInterval(applyTheme, 60000);

	document.addEventListener('click', function(event) {
		if (event.target.closest('#test-panel')) return;
		audio.play();
		if (isNight()) {
			var heart = document.createElement("div");
			heart.classList.add("heart");
			heart.style.left = event.clientX + "px";
			heart.style.top = event.clientY + "px";
			document.body.appendChild(heart);
			setTimeout(function() { heart.remove(); }, 1000);
		} else {
			hearts.push({
				x: event.clientX,
				y: event.clientY,
				size: 0,
				opacity: 1,
				maxSize: 20 + Math.random() * 15
			});
		}
	});

	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var startTime = new Date("2023-06-08T22:08:00").getTime();

	// ===== Sakura (Day) =====
	var petals = [];

	function drawSakuraFlower(ctx, x, y, size, color, opacity, rotation) {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(rotation * Math.PI / 180);
		ctx.globalAlpha = opacity;
		for (let i = 0; i < 5; i++) {
			ctx.rotate(72 * Math.PI / 180);
			ctx.beginPath();
			ctx.fillStyle = color;
			ctx.moveTo(0, 0);
			ctx.bezierCurveTo(size * 0.3, size * 0.3, size * 0.4, size * 0.8, 0, size);
			ctx.bezierCurveTo(-size * 0.4, size * 0.8, -size * 0.3, size * 0.3, 0, 0);
			ctx.fill();
		}
		ctx.beginPath();
		ctx.fillStyle = 'rgba(255, 255, 220, ' + (opacity * 0.9) + ')';
		ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	function drawFallingPetal(ctx, x, y, size, rotation, color, opacity, wobble) {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(rotation * Math.PI / 180);
		ctx.globalAlpha = opacity;
		ctx.beginPath();
		ctx.fillStyle = color;
		const wobbleOffset = Math.sin(wobble) * 2;
		ctx.moveTo(0, -size * 0.3);
		ctx.bezierCurveTo(size * 0.4 + wobbleOffset, -size * 0.2, size * 0.5, size * 0.3, 0, size * 0.6);
		ctx.bezierCurveTo(-size * 0.5, size * 0.3, -size * 0.4 - wobbleOffset, -size * 0.2, 0, -size * 0.3);
		ctx.fill();
		ctx.restore();
	}

	function Petal(x, y) {
		this.x = x || Math.random() * canvas.width;
		this.y = y || -20;
		this.size = Math.random() * 8 + 6;
		this.speedY = Math.random() * 1 + 0.5;
		this.speedX = Math.random() * 1 - 0.5;
		this.rotation = Math.random() * 360;
		this.rotationSpeed = Math.random() * 1 - 0.5;
		this.opacity = Math.random() * 0.4 + 0.6;
		this.wobble = Math.random() * Math.PI * 2;
		this.wobbleSpeed = Math.random() * 0.03 + 0.02;
		this.wobbleAmount = Math.random() * 1.5 + 0.5;
		const colors = [
			'rgba(255, 183, 197, ',
			'rgba(255, 192, 203, ',
			'rgba(255, 160, 180, ',
			'rgba(255, 224, 229, ',
			'rgba(250, 200, 210, '
		];
		this.baseColor = colors[Math.floor(Math.random() * colors.length)];
	}

	function updatePetal(petal) {
		petal.y += petal.speedY;
		petal.x += petal.speedX + Math.sin(petal.wobble) * petal.wobbleAmount;
		petal.wobble += petal.wobbleSpeed;
		petal.rotation += petal.rotationSpeed;
		if (petal.y > canvas.height + 20) {
			petal.y = -20;
			petal.x = Math.random() * canvas.width;
			petal.opacity = Math.random() * 0.4 + 0.6;
		}
	}

	function createPetal() {
		if (petals.length < 250) {
			petals.push(new Petal());
		}
	}

	function drawHearts(ctx) {
		for (let i = hearts.length - 1; i >= 0; i--) {
			const heart = hearts[i];
			heart.size += (heart.maxSize - heart.size) * 0.1;
			heart.opacity -= 0.02;
			heart.y -= 0.5;
			if (heart.opacity <= 0) { hearts.splice(i, 1); continue; }
			ctx.save();
			ctx.translate(heart.x, heart.y);
			ctx.globalAlpha = heart.opacity;
			ctx.fillStyle = 'rgba(255, 105, 180, 0.8)';
			ctx.beginPath();
			const size = heart.size;
			ctx.moveTo(0, size * 0.3);
			ctx.bezierCurveTo(size * 0.5, -size * 0.3, size, 0, 0, size);
			ctx.bezierCurveTo(-size, 0, -size * 0.5, -size * 0.3, 0, size * 0.3);
			ctx.fill();
			ctx.restore();
		}
	}

	// ===== Stars (Night) =====
	var stars = [];
	var meteors = [];

	function drawSky() {
		context.fillStyle = "#000";
		context.fillRect(0, 0, canvas.width, canvas.height);
	}

	function createStar() {
		var star = {
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height,
			size: Math.random() * 3 + 1,
			brightness: Math.random() * 0.5 + 0.5,
			blink: Math.random() * 10 + 5
		};
		stars.push(star);
		if (stars.length > 52) {
			stars.splice(0, 24);
		}
	}

	function createMeteor() {
		if (meteors.length < 3) {
			var meteor = {
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				speed: Math.random() * 10 + 5,
				length: Math.random() * 80 + 20,
				angle: Math.random() * Math.PI / 2 + Math.PI / 4,
				trail: [],
				arcRadius: Math.random() * 100 + 50,
				arcAngle: 0
			};
			meteors.push(meteor);
		}
	}

	function drawStars() {
		for (var i = 0; i < stars.length; i++) {
			var star = stars[i];
			context.beginPath();
			context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
			context.closePath();
			context.fillStyle = "rgba(255, 255, 255, " + star.brightness + ")";
			context.fill();
			star.blink--;
			if (star.blink <= 0) {
				star.brightness = Math.random() * 0.5 + 0.5;
				star.blink = Math.random() * 10 + 5;
			}
		}
	}

	function drawMeteors() {
		for (var i = 0; i < meteors.length; i++) {
			var meteor = meteors[i];
			meteor.arcAngle += meteor.speed / meteor.arcRadius;
			meteor.x += Math.cos(meteor.angle) * meteor.speed;
			meteor.y += Math.sin(meteor.angle) * meteor.speed;
			meteor.trail.push({ x: meteor.x, y: meteor.y });
			if (meteor.trail.length > meteor.length) {
				meteor.trail.shift();
			}
			if (meteor.arcAngle >= Math.PI) {
				meteors.splice(i, 1);
				i--;
				continue;
			}
			context.beginPath();
			context.moveTo(meteor.trail[0].x, meteor.trail[0].y);
			for (var j = 1; j < meteor.trail.length; j++) {
				context.lineTo(meteor.trail[j].x, meteor.trail[j].y);
			}
			var gradient = context.createLinearGradient(meteor.x, meteor.y, meteor.trail[0].x, meteor.trail[0].y);
			gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
			gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
			context.strokeStyle = gradient;
			context.lineWidth = 1;
			context.stroke();
		}
	}

	// ===== Milky Way (银河) - Diffuse glow, unique each time =====
	var milkyWayCanvas = null;
	var milkyWayBrightStars = [];
	var milkyWayRotation = 0;
	var milkyWayInitialized = false;

	function initMilkyWay() {
		milkyWayBrightStars = [];
		milkyWayRotation = Math.random() * Math.PI * 0.3 - Math.PI * 0.15;

		const W = canvas.width;
		const H = canvas.height;
		const diag = Math.sqrt(W * W + H * H);

		const bandAngle = -Math.PI / 5 + (Math.random() - 0.5) * 0.4;
		const bandWidth = H * (0.25 + Math.random() * 0.15);
		const cx = W / 2;
		const cy = H / 2;
		const perpAngle = bandAngle + Math.PI / 2;
		const bandLen = diag * 3;

		milkyWayCanvas = document.createElement('canvas');
		const mwScale = 3;
		milkyWayCanvas.width = W * mwScale;
		milkyWayCanvas.height = H * mwScale;
		const mwCtx = milkyWayCanvas.getContext('2d');
		const mwCx = (W * mwScale) / 2;
		const mwCy = (H * mwScale) / 2;
		mwCtx.clearRect(0, 0, W * mwScale, H * mwScale);
		mwCtx.globalCompositeOperation = 'lighter';

		// Layer 1: Broad diffuse base glow
		const baseCloudCount = 20 + Math.floor(Math.random() * 10);
		for (let i = 0; i < baseCloudCount; i++) {
			const t = (i + 0.5) / baseCloudCount;
			const along = (t - 0.5) * bandLen;
			const bx = mwCx + Math.cos(bandAngle) * along + (Math.random() - 0.5) * bandWidth * 0.3;
			const by = mwCy + Math.sin(bandAngle) * along + (Math.random() - 0.5) * bandWidth * 0.3;
			const sizeX = bandWidth * (0.5 + Math.random() * 0.6);
			const sizeY = bandWidth * (0.3 + Math.random() * 0.4);
			const baseAlpha = 0.04 + Math.random() * 0.03;

			const hueShift = Math.random();
			let cr, cg, cb;
			if (hueShift < 0.3) { cr = 140 + Math.random() * 30; cg = 150 + Math.random() * 30; cb = 200 + Math.random() * 40; }
			else if (hueShift < 0.6) { cr = 160 + Math.random() * 30; cg = 170 + Math.random() * 30; cb = 210 + Math.random() * 30; }
			else { cr = 180 + Math.random() * 20; cg = 175 + Math.random() * 25; cb = 195 + Math.random() * 30; }

			const gradient = mwCtx.createRadialGradient(bx, by, 0, bx, by, sizeX);
			gradient.addColorStop(0, 'rgba(' + Math.round(cr) + ',' + Math.round(cg) + ',' + Math.round(cb) + ',' + baseAlpha + ')');
			gradient.addColorStop(0.5, 'rgba(' + Math.round(cr) + ',' + Math.round(cg) + ',' + Math.round(cb) + ',' + (baseAlpha * 0.5) + ')');
			gradient.addColorStop(1, 'rgba(' + Math.round(cr) + ',' + Math.round(cg) + ',' + Math.round(cb) + ',0)');

			mwCtx.save();
			mwCtx.translate(bx, by);
			mwCtx.rotate(bandAngle);
			mwCtx.scale(1, sizeY / sizeX);
			mwCtx.translate(-bx, -by);
			mwCtx.fillStyle = gradient;
			mwCtx.fillRect(bx - sizeX * 1.5, by - sizeX * 1.5, sizeX * 3, sizeX * 3);
			mwCtx.restore();
		}

		// Layer 2: Brighter core clouds
		const coreCloudCount = 35 + Math.floor(Math.random() * 15);
		for (let i = 0; i < coreCloudCount; i++) {
			const t = 0.15 + Math.random() * 0.7;
			const along = (t - 0.5) * bandLen;
			const offset = (Math.random() - 0.5) * bandWidth * 0.5;
			const fx = mwCx + Math.cos(bandAngle) * along + Math.cos(perpAngle) * offset;
			const fy = mwCy + Math.sin(bandAngle) * along + Math.sin(perpAngle) * offset;
			const size = bandWidth * (0.1 + Math.random() * 0.25);
			const alpha = 0.03 + Math.random() * 0.04;

			const warmth = Math.random();
			let cr, cg, cb;
			if (warmth < 0.3) { cr = 200 + Math.random() * 40; cg = 190 + Math.random() * 30; cb = 160 + Math.random() * 40; }
			else if (warmth < 0.7) { cr = 180 + Math.random() * 30; cg = 185 + Math.random() * 30; cb = 210 + Math.random() * 30; }
			else { cr = 170 + Math.random() * 30; cg = 180 + Math.random() * 30; cb = 220 + Math.random() * 25; }

			const gradient = mwCtx.createRadialGradient(fx, fy, 0, fx, fy, size);
			gradient.addColorStop(0, 'rgba(' + Math.round(cr) + ',' + Math.round(cg) + ',' + Math.round(cb) + ',' + alpha + ')');
			gradient.addColorStop(0.3, 'rgba(' + Math.round(cr) + ',' + Math.round(cg) + ',' + Math.round(cb) + ',' + (alpha * 0.6) + ')');
			gradient.addColorStop(1, 'rgba(' + Math.round(cr) + ',' + Math.round(cg) + ',' + Math.round(cb) + ',0)');
			mwCtx.fillStyle = gradient;
			mwCtx.fillRect(fx - size, fy - size, size * 2, size * 2);
		}

		// Layer 3: Fine structure clumps
		const clumpCount = 60 + Math.floor(Math.random() * 20);
		for (let i = 0; i < clumpCount; i++) {
			const t = 0.1 + Math.random() * 0.8;
			const along = (t - 0.5) * bandLen;
			const offset = (Math.random() - 0.5) * bandWidth * 0.6;
			const fx = mwCx + Math.cos(bandAngle) * along + Math.cos(perpAngle) * offset;
			const fy = mwCy + Math.sin(bandAngle) * along + Math.sin(perpAngle) * offset;
			const size = bandWidth * (0.02 + Math.random() * 0.08);
			const alpha = 0.02 + Math.random() * 0.025;

			const gradient = mwCtx.createRadialGradient(fx, fy, 0, fx, fy, size);
			gradient.addColorStop(0, 'rgba(220,225,240,' + alpha + ')');
			gradient.addColorStop(1, 'rgba(200,210,230,0)');
			mwCtx.fillStyle = gradient;
			mwCtx.fillRect(fx - size, fy - size, size * 2, size * 2);
		}

		// Layer 4: Dark dust lanes
		mwCtx.globalCompositeOperation = 'destination-out';
		const dustCount = 5 + Math.floor(Math.random() * 4);
		for (let i = 0; i < dustCount; i++) {
			const t = 0.2 + Math.random() * 0.6;
			const along = (t - 0.5) * bandLen;
			const offset = (Math.random() - 0.5) * bandWidth * 0.3;
			const fx = mwCx + Math.cos(bandAngle) * along + Math.cos(perpAngle) * offset;
			const fy = mwCy + Math.sin(bandAngle) * along + Math.sin(perpAngle) * offset;
			const sizeX = bandWidth * (0.08 + Math.random() * 0.15);
			const sizeY = bandWidth * (0.03 + Math.random() * 0.06);
			const dustAlpha = 0.3 + Math.random() * 0.4;

			const gradient = mwCtx.createRadialGradient(fx, fy, 0, fx, fy, sizeX);
			gradient.addColorStop(0, 'rgba(0,0,0,' + dustAlpha + ')');
			gradient.addColorStop(0.5, 'rgba(0,0,0,' + (dustAlpha * 0.3) + ')');
			gradient.addColorStop(1, 'rgba(0,0,0,0)');

			mwCtx.save();
			mwCtx.translate(fx, fy);
			mwCtx.rotate(bandAngle + (Math.random() - 0.5) * 0.5);
			mwCtx.scale(1, sizeY / sizeX);
			mwCtx.translate(-fx, -fy);
			mwCtx.fillStyle = gradient;
			mwCtx.fillRect(fx - sizeX * 1.5, fy - sizeX * 1.5, sizeX * 3, sizeX * 3);
			mwCtx.restore();
		}

		mwCtx.globalCompositeOperation = 'source-over';

		// Layer 5: Dense field of small stars in the band
		const smallStarCount = 300 + Math.floor(Math.random() * 100);
		for (let i = 0; i < smallStarCount; i++) {
			const t = 0.05 + Math.random() * 0.9;
			const along = (t - 0.5) * bandLen;
			const offset = (Math.random() - 0.5) * bandWidth * 0.9;
			const sx = mwCx + Math.cos(bandAngle) * along + Math.cos(perpAngle) * offset;
			const sy = mwCy + Math.sin(bandAngle) * along + Math.sin(perpAngle) * offset;

			// Gaussian-like distribution - more stars near center
			const distFactor = Math.abs(offset) / (bandWidth * 0.9);
			if (Math.random() < distFactor * 0.7) continue; // Skip stars far from center

			const size = Math.random() * 1.2 + 0.3;
			const alpha = 0.3 + Math.random() * 0.5;

			mwCtx.fillStyle = 'rgba(230,235,245,' + alpha + ')';
			mwCtx.beginPath();
			mwCtx.arc(sx, sy, size, 0, Math.PI * 2);
			mwCtx.fill();
		}

		// Layer 6: Sparse bright stars you can pick out
		const brightStarCount = 30 + Math.floor(Math.random() * 20);
		for (let i = 0; i < brightStarCount; i++) {
			const t = 0.05 + Math.random() * 0.9;
			const along = (t - 0.5) * bandLen;
			const offset = (Math.random() - 0.5) * bandWidth * 0.8;
			const x = cx + Math.cos(bandAngle) * along + Math.cos(perpAngle) * offset;
			const y = cy + Math.sin(bandAngle) * along + Math.sin(perpAngle) * offset;

			if (x > -50 && x < W + 50 && y > -50 && y < H + 50) {
				milkyWayBrightStars.push({
					x: x, y: y,
					size: Math.random() * 1.5 + 0.5,
					brightness: Math.random() * 0.5 + 0.5,
					twinkleSpeed: Math.random() * 0.03 + 0.01,
					twinkleOffset: Math.random() * Math.PI * 2,
					r: 220 + Math.random() * 35,
					g: 225 + Math.random() * 30,
					b: 235 + Math.random() * 20
				});
			}
		}

		milkyWayInitialized = true;
	}

	function drawMilkyWay() {
		if (!milkyWayInitialized) {
			initMilkyWay();
		}

		context.save();
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		context.translate(centerX, centerY);
		context.rotate(milkyWayRotation);
		context.translate(-centerX, -centerY);

		// Draw the larger offscreen canvas offset so center aligns
		const mwW = milkyWayCanvas.width;
		const mwH = milkyWayCanvas.height;
		context.drawImage(milkyWayCanvas, centerX - mwW / 2, centerY - mwH / 2);

		const time = Date.now() * 0.001;
		for (let i = 0; i < milkyWayBrightStars.length; i++) {
			const star = milkyWayBrightStars[i];
			const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinkleOffset) * 0.3 + 0.7;
			const alpha = star.brightness * twinkle;
			context.fillStyle = 'rgba(' + Math.round(star.r) + ',' + Math.round(star.g) + ',' + Math.round(star.b) + ',' + alpha + ')';
			context.beginPath();
			context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
			context.fill();
		}

		context.restore();

		milkyWayRotation += 0.00008;
		if (milkyWayRotation > Math.PI * 2) {
			milkyWayRotation -= Math.PI * 2;
		}
	}

	// ===== Fireflies (Summer Night) =====
	var fireflies = [];

	function Firefly() {
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * canvas.height;
		this.size = Math.random() * 3 + 2;
		this.speedX = (Math.random() - 0.5) * 0.5;
		this.speedY = (Math.random() - 0.5) * 0.5;
		this.brightness = Math.random();
		this.blinkSpeed = Math.random() * 0.02 + 0.01;
		this.blinkDirection = 1;
		this.wobble = Math.random() * Math.PI * 2;
		this.wobbleSpeed = Math.random() * 0.02 + 0.01;

		const colorTypes = [
			{ inner: 'rgba(255, 255, 100, 0.9)', mid: 'rgba(200, 255, 100, 0.6)', outer: 'rgba(100, 255, 50, 0)', core: 'rgba(255, 255, 200, 1)' },
			{ inner: 'rgba(255, 100, 150, 0.9)', mid: 'rgba(255, 150, 180, 0.6)', outer: 'rgba(255, 50, 100, 0)', core: 'rgba(255, 200, 220, 1)' },
			{ inner: 'rgba(255, 150, 100, 0.9)', mid: 'rgba(255, 180, 120, 0.6)', outer: 'rgba(255, 100, 50, 0)', core: 'rgba(255, 220, 180, 1)' }
		];
		this.colors = colorTypes[Math.floor(Math.random() * colorTypes.length)];
	}

	function updateFirefly(firefly) {
		firefly.x += firefly.speedX + Math.sin(firefly.wobble) * 0.3;
		firefly.y += firefly.speedY + Math.cos(firefly.wobble) * 0.3;
		firefly.wobble += firefly.wobbleSpeed;

		firefly.brightness += firefly.blinkSpeed * firefly.blinkDirection;
		if (firefly.brightness >= 1) {
			firefly.brightness = 1;
			firefly.blinkDirection = -1;
		} else if (firefly.brightness <= 0.1) {
			firefly.brightness = 0.1;
			firefly.blinkDirection = 1;
		}

		if (firefly.x < -20) firefly.x = canvas.width + 20;
		if (firefly.x > canvas.width + 20) firefly.x = -20;
		if (firefly.y < -20) firefly.y = canvas.height + 20;
		if (firefly.y > canvas.height + 20) firefly.y = -20;
	}

	function drawFireflies() {
		for (var i = 0; i < fireflies.length; i++) {
			var firefly = fireflies[i];
			updateFirefly(firefly);

			context.save();
			context.globalAlpha = firefly.brightness;

			var gradient = context.createRadialGradient(
				firefly.x, firefly.y, 0,
				firefly.x, firefly.y, firefly.size * 3
			);
			gradient.addColorStop(0, firefly.colors.inner);
			gradient.addColorStop(0.3, firefly.colors.mid);
			gradient.addColorStop(1, firefly.colors.outer);

			context.fillStyle = gradient;
			context.beginPath();
			context.arc(firefly.x, firefly.y, firefly.size * 3, 0, Math.PI * 2);
			context.fill();

			context.fillStyle = firefly.colors.core;
			context.beginPath();
			context.arc(firefly.x, firefly.y, firefly.size, 0, Math.PI * 2);
			context.fill();

			context.restore();
		}
	}

	function createFirefly() {
		if (fireflies.length < 33) {
			fireflies.push(new Firefly());
		}
	}

	// ===== Snowflakes (Winter Night) =====
	var snowflakes = [];

	function Snowflake() {
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * -canvas.height;
		this.size = Math.random() * 4 + 2;
		this.speedY = Math.random() * 1 + 0.5;
		this.speedX = (Math.random() - 0.5) * 0.5;
		this.rotation = Math.random() * 360;
		this.rotationSpeed = (Math.random() - 0.5) * 2;
		this.opacity = Math.random() * 0.5 + 0.5;
		this.wobble = Math.random() * Math.PI * 2;
		this.wobbleSpeed = Math.random() * 0.02 + 0.01;

		// Randomly assign snowflake shape type based on scientific distribution
		// Dendritic: 35%, Plate: 28%, Fern: 15%, Columnar: 12%, Needle: 7%, Irregular: 3%
		const rand = Math.random() * 100;
		if (rand < 35) {
			this.shape = 'dendritic';
		} else if (rand < 63) { // 35 + 28 = 63
			this.shape = 'plate';
		} else if (rand < 78) { // 63 + 15 = 78
			this.shape = 'fern';
		} else if (rand < 90) { // 78 + 12 = 90
			this.shape = 'columnar';
		} else if (rand < 97) { // 90 + 7 = 97
			this.shape = 'needle';
		} else {
			this.shape = 'irregular';
		}
	}

	function updateSnowflake(snowflake) {
		snowflake.y += snowflake.speedY;
		snowflake.x += snowflake.speedX + Math.sin(snowflake.wobble) * 0.3;
		snowflake.wobble += snowflake.wobbleSpeed;
		snowflake.rotation += snowflake.rotationSpeed;

		if (snowflake.y > canvas.height + 20) {
			snowflake.y = Math.random() * -100;
			snowflake.x = Math.random() * canvas.width;
		}
	}

	// Draw dendritic snowflake (classic branching star)
	function drawDendritic(snowflake) {
		context.strokeStyle = 'rgba(255, 255, 255, 1)';
		context.lineWidth = 1;

		for (let i = 0; i < 6; i++) {
			context.beginPath();
			context.moveTo(0, 0);
			context.lineTo(0, -snowflake.size * 2);
			context.stroke();

			// Branches
			context.beginPath();
			context.moveTo(0, -snowflake.size);
			context.lineTo(snowflake.size * 0.5, -snowflake.size * 1.5);
			context.stroke();

			context.beginPath();
			context.moveTo(0, -snowflake.size);
			context.lineTo(-snowflake.size * 0.5, -snowflake.size * 1.5);
			context.stroke();

			context.rotate(60 * Math.PI / 180);
		}
	}

	// Draw plate-like snowflake (hexagonal plate)
	function drawPlate(snowflake) {
		context.strokeStyle = 'rgba(255, 255, 255, 1)';
		context.fillStyle = 'rgba(255, 255, 255, 0.3)';
		context.lineWidth = 1;

		context.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (i * 60) * Math.PI / 180;
			const x = Math.cos(angle) * snowflake.size * 1.5;
			const y = Math.sin(angle) * snowflake.size * 1.5;
			if (i === 0) context.moveTo(x, y);
			else context.lineTo(x, y);
		}
		context.closePath();
		context.fill();
		context.stroke();
	}

	// Draw columnar snowflake (tube/column shape)
	function drawColumnar(snowflake) {
		context.strokeStyle = 'rgba(255, 255, 255, 1)';
		context.fillStyle = 'rgba(255, 255, 255, 0.2)';
		context.lineWidth = 1;

		const width = snowflake.size * 0.8;
		const height = snowflake.size * 2.5;

		context.beginPath();
		context.rect(-width, -height, width * 2, height * 2);
		context.fill();
		context.stroke();

		// Top and bottom caps
		context.beginPath();
		context.ellipse(0, -height, width, width * 0.3, 0, 0, Math.PI * 2);
		context.stroke();

		context.beginPath();
		context.ellipse(0, height, width, width * 0.3, 0, 0, Math.PI * 2);
		context.stroke();
	}

	// Draw needle-like snowflake (elongated needle)
	function drawNeedle(snowflake) {
		context.strokeStyle = 'rgba(255, 255, 255, 1)';
		context.lineWidth = 1.5;

		context.beginPath();
		context.moveTo(0, -snowflake.size * 3);
		context.lineTo(0, snowflake.size * 3);
		context.stroke();

		// Small branches at ends
		context.beginPath();
		context.moveTo(0, -snowflake.size * 2.5);
		context.lineTo(snowflake.size * 0.3, -snowflake.size * 2);
		context.stroke();

		context.beginPath();
		context.moveTo(0, -snowflake.size * 2.5);
		context.lineTo(-snowflake.size * 0.3, -snowflake.size * 2);
		context.stroke();

		context.beginPath();
		context.moveTo(0, snowflake.size * 2.5);
		context.lineTo(snowflake.size * 0.3, snowflake.size * 2);
		context.stroke();

		context.beginPath();
		context.moveTo(0, snowflake.size * 2.5);
		context.lineTo(-snowflake.size * 0.3, snowflake.size * 2);
		context.stroke();
	}

	// Draw fern-like dendritic snowflake (complex branching)
	function drawFern(snowflake) {
		context.strokeStyle = 'rgba(255, 255, 255, 1)';
		context.lineWidth = 1;

		for (let i = 0; i < 6; i++) {
			// Main branch
			context.beginPath();
			context.moveTo(0, 0);
			context.lineTo(0, -snowflake.size * 2.5);
			context.stroke();

			// Multiple sub-branches
			for (let j = 1; j <= 3; j++) {
				const branchY = -snowflake.size * j * 0.6;
				const branchLen = snowflake.size * (0.8 - j * 0.15);

				context.beginPath();
				context.moveTo(0, branchY);
				context.lineTo(branchLen, branchY - snowflake.size * 0.4);
				context.stroke();

				context.beginPath();
				context.moveTo(0, branchY);
				context.lineTo(-branchLen, branchY - snowflake.size * 0.4);
				context.stroke();
			}

			context.rotate(60 * Math.PI / 180);
		}
	}

	// Draw irregular snowflake (random shape)
	function drawIrregular(snowflake) {
		context.strokeStyle = 'rgba(255, 255, 255, 1)';
		context.fillStyle = 'rgba(255, 255, 255, 0.2)';
		context.lineWidth = 1;

		context.beginPath();
		const points = 5 + Math.floor(Math.random() * 4);
		for (let i = 0; i < points; i++) {
			const angle = (i * 360 / points) * Math.PI / 180;
			const radius = snowflake.size * (1 + Math.random() * 0.8);
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius;
			if (i === 0) context.moveTo(x, y);
			else context.lineTo(x, y);
		}
		context.closePath();
		context.fill();
		context.stroke();
	}

	function drawSnowflake(snowflake) {
		context.save();
		context.translate(snowflake.x, snowflake.y);
		context.rotate(snowflake.rotation * Math.PI / 180);
		context.globalAlpha = snowflake.opacity;

		switch(snowflake.shape) {
			case 'dendritic':
				drawDendritic(snowflake);
				break;
			case 'plate':
				drawPlate(snowflake);
				break;
			case 'columnar':
				drawColumnar(snowflake);
				break;
			case 'needle':
				drawNeedle(snowflake);
				break;
			case 'fern':
				drawFern(snowflake);
				break;
			case 'irregular':
				drawIrregular(snowflake);
				break;
		}

		context.restore();
	}

	function drawSnowflakes() {
		for (var i = 0; i < snowflakes.length; i++) {
			var snowflake = snowflakes[i];
			updateSnowflake(snowflake);
			drawSnowflake(snowflake);
		}
	}

	function createSnowflake() {
		if (snowflakes.length < 150) {
			snowflakes.push(new Snowflake());
		}
	}

	// ===== Timer =====
	function updateTimer() {
		var currentTime = new Date().getTime();
		var timeDiff = currentTime - startTime;
		var seconds = Math.floor(timeDiff / 1000);
		var minutes = Math.floor(seconds / 60);
		var hours = Math.floor(minutes / 60);
		var days = Math.floor(hours / 24);
		hours %= 24;
		minutes %= 60;
		seconds %= 60;
		var timer = document.getElementById("timer");
		timer.innerHTML = "<day>" + days + "</day> <times>" + hours + ":" + minutes + ":" + seconds + "</times>";
	}

	// ===== Main Loop =====
	function loop() {
		context.clearRect(0, 0, canvas.width, canvas.height);

		if (isNight()) {
			drawSky();
			const season = getSeason();

			if (season === 'winter') {
				// Winter: only snowflakes, no stars
				if (Math.random() < 0.3) createSnowflake();
				drawSnowflakes();
			} else {
				// Spring, Summer, Autumn: stars + meteors
				if (Math.random() < 0.05) createStar();
				if (Math.random() < 0.05) createMeteor();
				drawStars();
				drawMeteors();

				// Summer: add fireflies and milky way
				if (season === 'summer') {
					if (Math.random() < 0.033) createFirefly();
					drawFireflies();
					drawMilkyWay();
				}
			}
		} else {
			const season = getSeason();

			if (season !== 'spring') {
				if (Math.random() < 0.25) createPetal();
				petals.forEach(function(petal) {
					updatePetal(petal);
					drawFallingPetal(context, petal.x, petal.y, petal.size,
						petal.rotation, petal.baseColor + petal.opacity + ')', petal.opacity, petal.wobble);
				});
			}
			drawHearts(context);
		}

		updateTimer();
		requestAnimationFrame(loop);
	}

	window.addEventListener('resize', function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		petals = [];
		stars = [];
		meteors = [];
		fireflies = [];
		snowflakes = [];
		milkyWayInitialized = false;
	});

	// ===== Test Panel =====
	let testMode = false;
	let testHour = null;
	let testMinute = null;
	let testSeasonOverride = null;

	// Override isNight to use test time if set
	const originalIsNight = isNight;
	isNight = function() {
		if (testMode && testHour !== null && testMinute !== null) {
			// Simple rule: 6:00-20:00 is day, otherwise night
			return testHour < 6 || testHour >= 20;
		}
		return originalIsNight();
	};

	// Override getSeason to use test season if set
	const originalGetSeason = getSeason;
	getSeason = function() {
		if (testMode && testSeasonOverride) {
			return testSeasonOverride;
		}
		return originalGetSeason();
	};

	function toggleTestPanel() {
		const panel = document.getElementById('test-panel');
		panel.classList.toggle('active');
	}

	function applyTestSettings() {
		const hourInput = document.getElementById('test-hour').value;
		const minuteInput = document.getElementById('test-minute').value;
		const seasonSelect = document.getElementById('test-season').value;

		testMode = true;
		testHour = hourInput !== '' ? parseInt(hourInput) : null;
		testMinute = minuteInput !== '' ? parseInt(minuteInput) : null;
		testSeasonOverride = seasonSelect !== 'auto' ? seasonSelect : null;

		applyTheme();
		console.log('Test mode applied:', { hour: testHour, minute: testMinute, season: testSeasonOverride });
	}

	function resetTestSettings() {
		testMode = false;
		testHour = null;
		testMinute = null;
		testSeasonOverride = null;
		document.getElementById('test-hour').value = '';
		document.getElementById('test-minute').value = '';
		document.getElementById('test-season').value = 'auto';
		applyTheme();
		console.log('Test mode reset');
	}

	// Toggle panel with T key
	document.addEventListener('keydown', function(event) {
		if (event.key === 't' || event.key === 'T') {
			if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'SELECT') {
				toggleTestPanel();
			}
		}
	});

	loop();