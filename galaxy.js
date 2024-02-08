let mapSize = 900;
let sectorsPerAxis = 9;
let starsAmount = 300;

let sectors = [];
let stars = [];

let starNames = [
    "Acamar",
    "Adahn",
    "Aldea",
    "Andevian",
    "Antedi",
    "Balosnee",
    "Baratas",
    "Brax",
    "Bretel",
    "Calondia"
];

let indexing = [
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"],
    ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"],
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ["Prime", "Secundus", "Tertius", "Quartus", "Quintus", "Sextus", "Septimus", "Octus", "Nonus", "Decus"],
];

let viewMode = "galaxy";
let selectedStar = null;
let galaxyViewCamera = { x: 0, y: 0 };

function generateGalaxy() {
    const sectorSize = mapSize / sectorsPerAxis;
    const centralSectorIndex = Math.floor(sectorsPerAxis / 2);
    const minDistance = 15; // Set your desired minimum distance between stars
    initializeSectors();

    for (let i = 0; i < starsAmount; i++) {
        let position, sectorIndices;
        let attempts = 0;
        do {
            position = {
                x: Math.random() * mapSize - mapSize / 2,
                y: Math.random() * mapSize - mapSize / 2
            };
            sectorIndices = {
                x: Math.floor((position.x + mapSize / 2) / sectorSize),
                y: Math.floor((position.y + mapSize / 2) / sectorSize)
            };
            attempts++;
            if (attempts > 1000) {
                break;
            }
        } while (isCentralSector(centralSectorIndex, sectorIndices.x, sectorIndices.y) || isStarTooClose(position, minDistance));

        if (attempts <= 1000) {
            const starSystemData = generateStarSystem();
            const star = {
                ... starSystemData,
                position: position,
                sectorIndex: sectors[sectorIndices.x][sectorIndices.y].index,
            };
            stars.push(star);
            sectors[sectorIndices.x][sectorIndices.y].stars.push(star.uuid);
        }
    }
}

function isStarTooClose(position, minDistance) {
    return stars.some(star => {
        const dx = star.position.x - position.x;
        const dy = star.position.y - position.y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });
}

function isCentralSector(centralSectorIndex, x, y) {
    return x === centralSectorIndex && y === centralSectorIndex;
}

function initializeSectors() {
    for (let x = 0; x < sectorsPerAxis; x++) {
        sectors[x] = [];
        for (let y = 0; y < sectorsPerAxis; y++) {
            sectors[x][y] = { "index": y * sectorsPerAxis + x, "stars": [] };
        }
    }
}

function generateStarSystem() {
    let name = starNames[getRandomInt(0, starNames.length - 1)];
    let indexingType = getRandomInt(0, indexing.length - 1);
    let planetCount = getRandomInt(2, 6);
    let planets = [];
    for (let i = 0; i < planetCount; i++) {
        planets.push(generatePlanet(name, i, indexingType));
    }
    return { "uuid": generateUUID(), "name": name, "planets": planets };
}

function generatePlanet(name, index, indexingType) {
    let planetSuffix = indexing[indexingType][index];
    let planet = {
        "uuid": generateUUID(),
        "name": `${name} ${planetSuffix}`,
        "initialRotation": Math.random() * 2 * Math.PI,
    };

    return planet;
}

function generateUUID() {
    return 'xxxx-xxxx-4xxx-yxxx-xxxx-xxxx'.replace(/[xy]/g, function(c) {
        var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawGalaxy(closestStarUuid) {
    viewMode = "galaxy";

    const sensorRange = fleets[0].stats["sensor-range"];

    const canvas = document.getElementById('canvas');
    let isWidthHigherThanHeight = canvas.parentElement.offsetWidth > canvas.parentElement.offsetHeight;
    let higherValue = isWidthHigherThanHeight ? canvas.parentElement.offsetWidth : canvas.parentElement.offsetHeight;
    canvas.height = higherValue;
    canvas.width = higherValue;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Adjust scale based on the longer dimension of the screen.
    const longerDimension = Math.max(canvas.width, canvas.height);
    const scale = longerDimension / mapSize;

    const sectorSize = canvas.width / sectorsPerAxis;
    ctx.strokeStyle = 'rgb(50, 50, 50)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= sectorsPerAxis; i++) {
        const pos = i * sectorSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
        ctx.closePath();
    }

    ctx.save();
    
    ctx.shadowBlur = 10;

    stars.forEach(star => {
        const adjustedX = star.position.x - galaxyViewCamera.x;
        const adjustedY = star.position.y - galaxyViewCamera.y;
        const distanceToPlayerFleet = Math.sqrt(Math.pow(adjustedX - fleets[0].position.x, 2) + Math.pow(adjustedY - fleets[0].position.y, 2));
        let alpha = 1;
        if (distanceToPlayerFleet > sensorRange) alpha = 0.25;
        ctx.beginPath();
        const x = (adjustedX + mapSize / 2) * scale;
        const y = (adjustedY + mapSize / 2) * scale;
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.shadowColor = star.uuid === closestStarUuid ? 'cyan' : 'white';
        ctx.fillStyle = star.uuid === closestStarUuid ? 'cyan' : 'white';
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.closePath();
    });

    ctx.restore();

    fleets.forEach(fleet => {
        const adjustedX = fleet.position.x - galaxyViewCamera.x;
        const adjustedY = fleet.position.y - galaxyViewCamera.y;
        ctx.beginPath();
        const x = (adjustedX + mapSize / 2) * scale;
        const y = (adjustedY + mapSize / 2) * scale;
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
    });

    // Draw a circle around the player fleet with adjusted camera position
    ctx.beginPath();
    const adjustedFleetX = (fleets[0].position.x - galaxyViewCamera.x + mapSize / 2) * scale;
    const adjustedFleetY = (fleets[0].position.y - galaxyViewCamera.y + mapSize / 2) * scale;
    ctx.arc(adjustedFleetX, adjustedFleetY, sensorRange * scale, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
}


function drawSolarSystem(solarSystemData) {
    viewMode = "solarSystem";

    const canvas = document.getElementById('canvas');
    canvas.height = canvas.parentElement.offsetHeight;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const sunRadius = 30; // Radius of the sun
    const numberOfPlanets = solarSystemData.planets.length;
    const distanceIncrement = 40; // Distance between each planet's orbit
    const orbitLineWidth = 0.5; // Width of the orbit line

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the sun
    ctx.beginPath();
    ctx.arc(centerX, centerY, sunRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.closePath();

    // Draw the planets and their orbits
    for (let i = 1; i <= numberOfPlanets; i++) {
        const planetRadius = 5; // Radius of the planet
        const distanceFromSun = sunRadius + i * distanceIncrement;
        const angle = solarSystemData.planets[i - 1].initialRotation;

        // Draw the orbit
        ctx.beginPath();
        ctx.arc(centerX, centerY, distanceFromSun, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'; // Color of the orbit line
        ctx.lineWidth = orbitLineWidth;
        ctx.stroke();
        ctx.closePath();

        // Calculate the planet's position on its orbit
        const radians = (degrees) => degrees * Math.PI / 180;

        const planetX = centerX + distanceFromSun * Math.cos(angle + radians(date.getTime() / 20000000 / i));
        const planetY = centerY + distanceFromSun * Math.sin(angle + radians(date.getTime() / 20000000 / i));


        // Draw the planet
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue'; // Color of the planet
        ctx.fill();
        ctx.closePath();
    }
}

function findClosestStar(mouseX, mouseY, scale) {
    let closestStar = null;
    let minimumDistance = Infinity;
    
    stars.forEach(star => {
        const dx = (star.position.x + mapSize / 2) * scale - mouseX;
        const dy = (star.position.y + mapSize / 2) * scale - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const distanceToPlayerFleet = Math.sqrt(Math.pow(star.position.x - fleets[0].position.x, 2) + Math.pow(star.position.y - fleets[0].position.y, 2));
        
        if (distance < minimumDistance && distanceToPlayerFleet < fleets[0].stats["sensor-range"]) {
            closestStar = star;
            minimumDistance = distance;
        }
    });

    if (minimumDistance > 15) {
        closestStar = null;
    }

    return closestStar;
}

function setupClickHandler() {
    const canvas = document.getElementById('canvas');

    canvas.addEventListener('click', function(event) {
        handleClickOnGalaxy();
    });
}

let closestStar = null;
function setupMouseMoveHandler() {
    const canvas = document.getElementById('canvas');
    const scale = Math.min(canvas.width, canvas.height) / mapSize;
    
    canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        if (viewMode === "galaxy") {
            closestStar = findClosestStar(mouseX, mouseY, scale);
        }
    });
}

function handleClickOnGalaxy() {
    if (closestStar) {
        selectedStar = closestStar;
        document.getElementById('star_system_controls').style.display = 'block';
        drawSolarSystem(selectedStar);
    }
}

function backToGalaxyView() {
    viewMode = "galaxy";

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    closestStar = findClosestStar(mouseX, mouseY, scale);

    document.getElementById('star_system_controls').style.display = 'none';
    drawGalaxy();
}

function setSelectedStarAsTarget() {
    if (selectedStar) {
        fleets[0].target = {
            "position": selectedStar.position,
        };
        backToGalaxyView();
    }
}

function moveFleets() {
    fleets.forEach(fleet => {
        if (fleet.target.position) {
            const dx = fleet.target.position.x - fleet.position.x;
            const dy = fleet.target.position.y - fleet.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                const speed = fleet.stats.speed / 1000;
                const ratio = speed / distance;
                if (distance < speed) {
                    fleet.position.x = fleet.target.position.x;
                    fleet.position.y = fleet.target.position.y;
                    fleet.target = {};
                } else {
                    fleet.position.x += dx * ratio;
                    fleet.position.y += dy * ratio;
                }

            }
        }
    });
}

generateGalaxy();
drawGalaxy();
setupClickHandler();
setupMouseMoveHandler();

let date = new Date(2032, 0, 1);
let paused = false;

function tick() {
    if (paused) return;
    date.setMinutes(date.getMinutes() + 20);
    moveFleets();

    requestAnimationFrame(tick);
}

function tick2() {
    if (viewMode === "solarSystem") {
        drawSolarSystem(selectedStar);
    } else if (viewMode === "galaxy") {
        drawGalaxy(closestStar ? closestStar.uuid : null);
    }
    document.getElementById('date').innerText = date.toISOString().split('T')[0];

    setTimeout(() => {
        requestAnimationFrame(tick2);
    }, 100);
}

function pause() {
    paused = !paused;
}

function play() {
    paused = false;
    tick();
}

tick();
tick2();